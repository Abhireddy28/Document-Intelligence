import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger("agent64.database")

# In-Memory collection store for offline fallback / resilience
class MemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self.data: List[Dict[str, Any]] = []

    async def find_one(self, filter_query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        filter_query = filter_query or {}
        for doc in self.data:
            match = True
            for k, v in filter_query.items():
                if k == "$or":
                    or_match = False
                    for cond in v:
                        if all(doc.get(sub_k) == sub_v for sub_k, sub_v in cond.items()):
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                return dict(doc)
        return None

    def find(self, filter_query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        filter_query = filter_query or {}
        matched = []
        for doc in self.data:
            match = True
            for k, v in filter_query.items():
                if k == "$or":
                    or_match = False
                    for cond in v:
                        if all(doc.get(sub_k) == sub_v for sub_k, sub_v in cond.items()):
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif isinstance(v, dict):
                    # Handle basic operators like $gte, $lte, $in, $regex
                    val = doc.get(k)
                    for op, op_v in v.items():
                        if op == "$gte" and not (val is not None and val >= op_v):
                            match = False
                        elif op == "$lte" and not (val is not None and val <= op_v):
                            match = False
                        elif op == "$gt" and not (val is not None and val > op_v):
                            match = False
                        elif op == "$lt" and not (val is not None and val < op_v):
                            match = False
                        elif op == "$in" and val not in op_v:
                            match = False
                        elif op == "$regex":
                            import re
                            pattern = re.compile(op_v, re.IGNORECASE)
                            if not (isinstance(val, str) and pattern.search(val)):
                                match = False
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(dict(doc))
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=-1):
                reverse = direction < 0
                self.items.sort(key=lambda x: x.get(key, 0) or "", reverse=reverse)
                return self
            def skip(self, n):
                self.items = self.items[n:]
                return self
            def limit(self, n):
                self.items = self.items[:n]
                return self
            async def to_list(self, length=None):
                if length is not None:
                    return self.items[:length]
                return self.items
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return Cursor(matched)

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(len(self.data) + 1)
        self.data.append(doc_copy)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def insert_many(self, documents: List[Dict[str, Any]]):
        for doc in documents:
            await self.insert_one(doc)

    async def update_one(self, filter_query: Dict[str, Any], update_query: Dict[str, Any]):
        doc = await self.find_one(filter_query)
        if doc:
            for idx, existing in enumerate(self.data):
                if existing.get("document_id") == doc.get("document_id") or existing.get("_id") == doc.get("_id"):
                    if "$set" in update_query:
                        self.data[idx].update(update_query["$set"])
                    if "$push" in update_query:
                        for k, v in update_query["$push"].items():
                            if k not in self.data[idx]:
                                self.data[idx][k] = []
                            self.data[idx][k].append(v)
                    return True
        return False

    async def delete_one(self, filter_query: Dict[str, Any]):
        doc = await self.find_one(filter_query)
        if doc:
            self.data = [d for d in self.data if d.get("document_id") != doc.get("document_id") and d.get("_id") != doc.get("_id")]
            return True
        return False

    async def count_documents(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        filter_query = filter_query or {}
        cursor = self.find(filter_query)
        res = await cursor.to_list()
        return len(res)

    async def delete_many(self, filter_query: Optional[Dict[str, Any]] = None):
        if not filter_query:
            self.data = []
        else:
            to_delete = await self.find(filter_query).to_list()
            delete_ids = {d.get("_id") for d in to_delete}
            self.data = [d for d in self.data if d.get("_id") not in delete_ids]


class DatabaseManager:
    def __init__(self):
        self.client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
        self.db = None
        self.use_memory = False
        self.memory_collections: Dict[str, MemoryCollection] = {
            "users": MemoryCollection("users"),
            "documents": MemoryCollection("documents"),
            "extractions": MemoryCollection("extractions"),
            "students": MemoryCollection("students"),
            "verification_queue": MemoryCollection("verification_queue"),
            "corrections": MemoryCollection("corrections"),
            "audit_logs": MemoryCollection("audit_logs"),
        }

    async def connect(self):
        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000
            )
            # Test connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.use_memory = False
            logger.info("Connected successfully to MongoDB Atlas at %s", settings.MONGODB_URI.split('@')[-1] if '@' in settings.MONGODB_URI else settings.MONGODB_URI)
            print(f"Connected successfully to MongoDB Atlas database '{settings.DATABASE_NAME}'!")
        except Exception as e:
            logger.warning("MongoDB unavailable (%s). Initializing High-Performance In-Memory Resilient Store.", e)
            self.use_memory = True

    def get_collection(self, name: str):
        if self.use_memory or self.db is None:
            if name not in self.memory_collections:
                self.memory_collections[name] = MemoryCollection(name)
            return self.memory_collections[name]
        return self.db[name]

    async def close(self):
        if self.client:
            self.client.close()

db_manager = DatabaseManager()

def get_db():
    return db_manager
