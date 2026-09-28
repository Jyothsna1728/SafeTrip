import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, RotateCcw, Compass, Code2, Luggage, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { assistantApi } from '../../api';
import { useExplore } from '../../context/ExploreContext';

const STORAGE_KEY = 'safetrip_ai_chat_history';

export default function AssistantDrawer({ isOpen, onClose }) {
  const { exploreLocation } = useExplore();

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist chat history:', e);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || loading) return;

    setErrorMsg('');
    setLastUserPrompt(messageContent);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { role: 'user', content: messageContent, timestamp: timeStr };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history (excluding the current user message being sent)
      const historyPayload = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await assistantApi.sendMessage({
        message: messageContent,
        destination: exploreLocation?.name || 'India',
        history: historyPayload,
      });

      const reply = res?.reply || "I'm here! Feel free to ask another question.";
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: replyTime }]);
    } catch (err) {
      setErrorMsg("Sorry, I couldn't reach the AI service right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setInput('');
    setErrorMsg('');
    setLastUserPrompt('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const locationLabel = exploreLocation?.name || 'this destination';

  const suggestedPrompts = [
    { label: `🗺️ Plan 3-day itinerary for ${locationLabel}`, prompt: `Plan a detailed 3-day travel itinerary for ${locationLabel} with morning/afternoon/evening schedules, iconic sights, and food stops.` },
    { label: `🍲 Must-try foods & delicacies in ${locationLabel}`, prompt: `What are the iconic, must-try foods, famous dishes, and top eateries in ${locationLabel}?` },
    { label: `💰 Estimated budget & local transport for ${locationLabel}`, prompt: `What is the estimated budget per day and best local transport options for exploring ${locationLabel}?` },
    { label: `🛡️ Local safety tips & emergency guidelines`, prompt: `What are the essential travel safety tips, neighborhood precautions, and emergency guidelines for ${locationLabel}?` },
    { label: `⛅ Live weather & what to pack`, prompt: `What is the current weather and temperature in ${locationLabel}, and what should I pack?` },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">

          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">SafeTrip AI</h3>
                <p className="text-[11px] text-teal-300 font-medium">Your travel & everyday AI companion</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  title="Start New Chat"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold px-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60 custom-scrollbar">
            {/* Welcome Screen when conversation is empty */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-5 py-8 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-xl ring-8 ring-teal-50">
                  <Bot className="w-9 h-9" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-black text-slate-900">Hey! I'm SafeTrip AI 👋</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ask me anything — travel planning, destinations, coding, study help, general knowledge, or whatever you're curious about.
                  </p>
                </div>

                <div className="w-full space-y-2 text-left pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Suggested Questions</span>
                  <div className="space-y-1.5">
                    {suggestedPrompts.map((sp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(sp.prompt)}
                        className="w-full text-left p-2.5 rounded-2xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-medium text-slate-700 hover:text-teal-800 shadow-sm transition-all flex items-center justify-between group"
                      >
                        <span className="line-clamp-1">{sp.label}</span>
                        <Send className="w-3 h-3 text-slate-300 group-hover:text-teal-600 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-none shadow-md font-medium'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line prose prose-xs select-text">
                      {m.content}
                    </div>
                    {m.timestamp && (
                      <div className={`text-[9px] mt-1.5 flex ${isUser ? 'justify-end text-slate-400' : 'justify-start text-slate-400'}`}>
                        {m.timestamp}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 font-medium pl-1">SafeTrip AI is thinking...</span>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {lastUserPrompt && (
                  <button
                    onClick={() => handleSend(lastUserPrompt)}
                    className="flex items-center gap-1 font-bold text-red-800 hover:underline px-2 py-1 bg-red-100 rounded-lg shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-2"
            >
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... (Shift + Enter for new line)"
                  className="w-full text-xs bg-transparent border-0 focus:outline-none resize-none max-h-32 text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white shadow-md shadow-teal-600/20 transition-all shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 px-1">
              <span>Powered by Groq AI</span>
              <span>Press Enter ↵ to send</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
