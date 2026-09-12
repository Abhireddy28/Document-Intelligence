import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Minimize2,
  ArrowUp,
  MessageSquare,
} from 'lucide-react';
import { chatService, ChatMessage } from '../services/chatService';
import { authService } from '../services/authService';

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  // Quick initial helper chips
  const starterPrompts = isAdmin
    ? [
        'Show whole student data',
        'Show document volume & status',
        'List students with attendance < 75%',
        'What are the VFSTR R22 pass criteria?',
      ]
    : [
        'Show whole student data',
        'Why was DOC-1002 flagged?',
        'Verify student roll number 22CS101',
        'What are the VFSTR R22 pass criteria?',
      ];

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'msg-welcome',
        role: 'assistant',
        content: isAdmin
          ? `Hello **${user?.name || 'Administrator'}**! 👋 I am your **VFSTR AI Assistant**.\n\nI have direct access to live university records, document processing queues, and academic regulations.\n\n💡 **Basic questions you can ask:**\n* *'Show whole student data'* — Fetch complete student master registry\n* *'Show document volume & status'* — View pipeline telemetry\n* *'Why was DOC-1002 flagged?'* — Inspect OCR confidence guardrail diagnostics\n* *'What are R22 pass marks criteria?'* — Review grading & pass requirements\n\nHow can I help you today?`
          : `Hello **${user?.name || 'Verifier'}**! 👋 I am your **VFSTR AI Verification Assistant**.\n\nI can help you review verification items, look up registered student profiles, and cross-reference academic regulations.\n\n💡 **Basic questions you can ask:**\n* *'Show whole student data'* — View student master database\n* *'Why was DOC-1002 flagged?'* — Diagnose OCR noise and character substitution\n* *'Verify student roll number 22CS101'* — Check registry match\n* *'What are R22 pass marks criteria?'* — Review pass thresholds\n\nHow can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage(query, messages);
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: res.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ I encountered an issue retrieving the answer. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Chat cleared. How can I assist you with **VFSTR Document Intelligence**?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Modern Markdown Parser with Table Support
  const renderFormatted = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const flushTable = (keyPrefix: string) => {
      if (tableHeaders.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`${keyPrefix}-table`} className="my-2.5 overflow-x-auto border border-border rounded-xl shadow-2xs">
            <table className="w-full text-left border-collapse text-[11px]">
              {tableHeaders.length > 0 && (
                <thead>
                  <tr className="bg-slate-100 border-b border-border text-navy font-bold">
                    {tableHeaders.map((th, hIdx) => (
                      <th key={hIdx} className="p-2 font-bold uppercase text-[10px] tracking-wider text-secondary">
                        <span dangerouslySetInnerHTML={{ __html: renderInline(th.trim()) }} />
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-border bg-white">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 text-navy">
                        <span dangerouslySetInnerHTML={{ __html: renderInline(cell.trim()) }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];

      // Table line
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const cells = line.split('|').slice(1, -1);
        if (cells.every((c) => c.trim().match(/^:?-+:?$/))) {
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable(`flush-${idx}`);
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={idx} className="text-xs font-extrabold text-navy mt-2.5 mb-1 tracking-tight">
            {line.replace('### ', '')}
          </h4>
        );
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h5 key={idx} className="text-[11px] font-bold text-primary mt-2 mb-0.5 uppercase tracking-wider">
            {line.replace('#### ', '')}
          </h5>
        );
        continue;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const item = line.substring(2);
        elements.push(
          <li key={idx} className="ml-3.5 list-disc text-xs text-navy/90 my-0.5 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          </li>
        );
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <div key={idx} className="text-xs text-navy/90 my-1 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
          </div>
        );
        continue;
      }
      if (line.startsWith('---')) {
        elements.push(<hr key={idx} className="my-2 border-border" />);
        continue;
      }
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={idx} className="border-l-2 border-primary pl-2.5 my-1.5 text-[11px] text-secondary italic bg-slate-50 py-1 rounded-r">
            {line.replace('> ', '')}
          </blockquote>
        );
        continue;
      }
      if (!line.trim()) {
        elements.push(<div key={idx} className="h-1.5" />);
        continue;
      }
      elements.push(
        <p key={idx} className="text-xs text-navy/90 my-0.5 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
        </p>
      );
    }

    if (inTable) {
      flushTable('flush-end');
    }

    return elements;
  };

  const renderInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-navy">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-primary font-mono text-[11px] px-1 py-0.2 rounded border border-border">$1</code>');
  };

  return (
    <>
      {/* Floating Extension Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-navy hover:bg-navy-light text-white p-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2.5 group border border-slate-700"
          title="Open AI Assistant"
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left pr-1 hidden sm:block">
            <p className="text-xs font-bold leading-tight flex items-center gap-1 text-white">
              AI Assistant
            </p>
            <p className="text-[10px] text-slate-300">
              {isAdmin ? 'Admin Copilot' : 'Verifier Co-Pilot'}
            </p>
          </div>
        </button>
      )}

      {/* ChatGPT / Extension Style Side Panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-96 sm:w-[430px] h-[600px] bg-white border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-white border-b border-border p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-primary-light" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-navy tracking-tight">VFSTR AI Assistant</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary-light text-primary border border-primary/20">
                    {isAdmin ? 'ADMIN' : 'VERIFIER'}
                  </span>
                </div>
                <p className="text-[10px] text-secondary">Document Intelligence &amp; NLP Copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Clear conversation"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-secondary hover:text-navy transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-secondary hover:text-navy transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-navy text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary-light" />
                  </div>
                )}

                <div className={`max-w-[84%] relative ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-xs shadow-2xs font-medium'
                        : 'bg-white text-navy border border-border rounded-tl-xs shadow-soft'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div>{renderFormatted(msg.content)}</div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-border/40 text-[9px]">
                      <span className={msg.role === 'user' ? 'text-white/70' : 'text-slate-400'}>
                        {msg.timestamp}
                      </span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy answer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-navy flex items-center gap-0.5"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-primary-light text-primary flex items-center justify-center text-xs shrink-0 mt-0.5 border border-primary/20">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Starter Suggestion Pills shown when only welcome message exists */}
            {messages.length === 1 && (
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider pl-1">
                  Suggested Questions:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {starterPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs bg-white hover:bg-primary-light text-navy hover:text-primary p-2.5 rounded-xl border border-border hover:border-primary/30 transition-colors shadow-2xs font-medium flex items-center justify-between"
                    >
                      <span className="truncate">{prompt}</span>
                      <ArrowUp className="w-3 h-3 text-secondary rotate-45 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing Loader */}
            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-xl bg-navy text-white flex items-center justify-center text-xs shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary-light" />
                </div>
                <div className="bg-white border border-border px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-soft flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-secondary font-medium ml-1">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message VFSTR AI Assistant..."
                disabled={loading}
                className="w-full bg-slate-50 border border-border rounded-2xl pl-4 pr-11 py-2.5 text-xs text-navy placeholder:text-secondary/70 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1.5 p-2 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-2xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
