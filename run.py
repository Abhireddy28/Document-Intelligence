"""
Agent 64 — Document Intelligence Agent
Unified Native Runner (Zero Docker Required)
Launches FastAPI Backend and React Frontend simultaneously with graceful process management.
"""

import os
import sys
import time
import subprocess
import webbrowser
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

def kill_port_owners(ports=[8000, 5173, 5174]):
    """Free up ports on Windows if previously occupied."""
    if os.name == 'nt':
        for port in ports:
            try:
                res = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
                for line in res.strip().split("\n"):
                    parts = line.strip().split()
                    if len(parts) >= 5 and "LISTENING" in parts:
                        pid = parts[-1]
                        if pid and pid != "0":
                            subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
            except Exception:
                pass

def print_banner():
    print("=" * 65)
    print("   🤖 AGENT 64 — INSTITUTIONAL DOCUMENT INTELLIGENCE AGENT")
    print("   Vignan's University • Agentic AI Day 2026 Hackathon")
    print("=" * 65)

def main():
    print_banner()
    print("[1/4] Checking and freeing local ports (8000, 5173)...")
    kill_port_owners()

    print("[2/4] Initializing clean state and generating test fixtures...")
    try:
        subprocess.run([sys.executable, "create_sample_files.py"], cwd=ROOT_DIR, check=True)
        subprocess.run([sys.executable, "-m", "app.seed.seed_database"], cwd=BACKEND_DIR, check=True)
    except Exception as e:
        print(f"Note: {e}")

    # Launch Backend
    print("[3/4] Starting FastAPI Backend on http://127.0.0.1:8000...")
    backend_cmd = [
        sys.executable,
        "-m", "uvicorn",
        "app.main:app",
        "--app-dir", "backend",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ]
    backend_proc = subprocess.Popen(backend_cmd, cwd=ROOT_DIR)

    # Wait for backend to be ready
    time.sleep(2)

    # Launch Frontend
    print("[4/4] Starting React Vite Frontend on http://localhost:5173...")
    frontend_cmd = "npm run dev"
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=FRONTEND_DIR, shell=True)

    time.sleep(3)

    print("\n" + "=" * 65)
    print("  🚀 AGENT 64 IS NOW RUNNING!")
    print("  -------------------------------------------------------------")
    print("  🌐 Frontend Dashboard : http://localhost:5173")
    print("  📄 Swagger API Docs    : http://127.0.0.1:8000/docs")
    print("  🔑 Demo Admin Login    : admin@example.com / admin123")
    print("  🔑 Demo Verifier Login : verifier@example.com / verifier123")
    print("  -------------------------------------------------------------")
    print("  Press Ctrl+C in this terminal to stop all services.")
    print("=" * 65 + "\n")

    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

    def cleanup(sig=None, frame=None):
        print("\n\nShutting down Agent 64 services...")
        try:
            backend_proc.terminate()
        except Exception:
            pass
        try:
            frontend_proc.terminate()
        except Exception:
            pass
        kill_port_owners()
        print("All services stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
