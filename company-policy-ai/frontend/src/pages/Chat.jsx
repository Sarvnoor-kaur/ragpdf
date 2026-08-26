import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, ArrowLeft, Loader2, AlertCircle, Bot, User, FileText,
  Plus, Trash2, Menu, X, ChevronRight, Sparkles, Send
} from 'lucide-react';
import {
  createConversation,
  getUserConversations,
  getConversation,
  sendMessage,
  deleteConversation
} from '../services/chatService';

/**
 * Deduplicates sources by Document Name + Page number
 * e.g., if 3 chunks come from LeavePolicy.pdf Page 4, return only 1 entry for LeavePolicy.pdf Page 4.
 */
const deduplicateSources = (sources) => {
  if (!sources || !Array.isArray(sources) || sources.length === 0) return [];
  const map = new Map();

  sources.forEach((src) => {
    const docName = src.documentName || src.documentTitle || 'Policy Document';
    const page = src.page || 1;
    const key = `${docName}__p${page}`;

    if (!map.has(key)) {
      map.set(key, {
        documentName: docName,
        page: page,
        score: src.score,
      });
    }
  });

  return Array.from(map.values());
};

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, loading]);

  // Load user conversations on initial mount
  useEffect(() => {
    fetchConversations();
  }, []);

const getConvId = (conv) => conv?.id || conv?._id;

  const fetchConversations = async () => {
    setFetchingChats(true);
    try {
      const res = await getUserConversations();
      const list = res.data.conversations || [];
      setConversations(list);

      if (list.length > 0) {
        // Select the most recent conversation
        loadConversation(getConvId(list[0]));
      } else {
        // Create an initial new chat
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setFetchingChats(false);
    }
  };

  const loadConversation = async (id) => {
    if (!id) return;
    setActiveConversationId(id);
    setError('');
    try {
      const res = await getConversation(id);
      setActiveConversation(res.data.conversation);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation history.');
    }
  };

  const handleNewChat = async () => {
    setError('');
    try {
      const res = await createConversation();
      const newConv = res.data.conversation;
      const newId = getConvId(newConv);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newId);
      setActiveConversation(newConv);
      setQuestion('');
      setSidebarOpen(false);
    } catch (err) {
      setError('Failed to create a new chat.');
    }
  };

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      const updatedList = conversations.filter((c) => getConvId(c) !== id);
      setConversations(updatedList);

      if (activeConversationId === id) {
        if (updatedList.length > 0) {
          loadConversation(getConvId(updatedList[0]));
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      setError('Failed to delete conversation.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    let targetConvId = activeConversationId;

    // If no active conversation, create one first
    if (!targetConvId) {
      try {
        const res = await createConversation();
        const newConv = res.data.conversation;
        targetConvId = getConvId(newConv);
        setActiveConversationId(targetConvId);
        setConversations((prev) => [newConv, ...prev]);
      } catch (err) {
        setError('Failed to initialize conversation.');
        return;
      }
    }

    const currentQuestion = question.trim();
    setQuestion('');
    setLoading(true);
    setError('');

    // Optimistically append user message to local state
    setActiveConversation((prev) => ({
      ...prev,
      messages: [
        ...(prev?.messages || []),
        { role: 'user', content: currentQuestion, createdAt: new Date().toISOString() },
      ],
    }));

    try {
      const res = await sendMessage(targetConvId, currentQuestion);
      const updatedConv = res.data.conversation;
      
      setActiveConversation(updatedConv);

      // Update sidebar conversations list title & ordering
      setConversations((prev) =>
        prev.map((c) => (getConvId(c) === targetConvId ? { ...c, title: updatedConv.title, updatedAt: updatedConv.updatedAt } : c))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Sorry, I couldn\'t process your question right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col md:flex-row text-slate-100 overflow-hidden h-screen">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0f172a] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accentIndigo to-accentViolet flex items-center justify-center shadow-md">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white font-display">Chat History</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-accentIndigo/10 hover:bg-accentIndigo/20 border border-accentIndigo/30 text-accentIndigo hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {fetchingChats ? (
            <div className="flex items-center justify-center py-8 text-slate-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading chats...
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No saved conversations yet.</p>
          ) : (
            conversations.map((conv) => {
              const convId = getConvId(conv);
              const isActive = convId === activeConversationId;
              return (
                <div
                  key={convId}
                  onClick={() => {
                    loadConversation(convId);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-accentViolet' : 'text-slate-500'}`} />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, convId)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col bg-[#0b0f19] h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accentViolet" />
              <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {activeConversation?.title || 'Policy AI Assistant'}
              </h2>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Welcome Empty State */}
          {(!activeConversation?.messages || activeConversation.messages.length === 0) && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
              <div className="w-16 h-16 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-2xl flex items-center justify-center shadow-xl shadow-accentIndigo/20 mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-2 font-display">Company Policy Assistant</h1>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Ask any questions about company leave, benefits, remote work, or IT policies. Answers are strictly grounded in your uploaded documents.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {[
                  'How many annual leave days do employees get?',
                  'What is the notice period requirement?',
                  'Is there internet cost reimbursement?'
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setQuestion(sample)}
                    className="text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-xl text-left transition-all cursor-pointer"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {activeConversation?.messages?.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const uniqueSources = deduplicateSources(msg.sources);

            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 max-w-3xl mx-auto ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accentIndigo to-accentViolet flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-accentViolet/15 border border-accentViolet/30 text-slate-100 rounded-tr-xs max-w-[85%]'
                      : 'bg-[#131b2e]/80 border border-slate-800 text-slate-200 rounded-tl-xs max-w-[90%] shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Deduplicated Sources Display */}
                  {!isUser && uniqueSources.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <FileText className="w-3.5 h-3.5 text-accentIndigo" /> Sources
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-1.5 bg-[#0b0f19] border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>{src.documentName}</span>
                            <span className="text-slate-500 font-normal">• Page {src.page}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start gap-3.5 max-w-3xl mx-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accentIndigo to-accentViolet flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-[#131b2e]/80 border border-slate-800 rounded-2xl rounded-tl-xs px-5 py-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-accentViolet animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Searching company policies &amp; generating answer...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="max-w-3xl mx-auto flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Area */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-md shrink-0">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about company policies..."
              disabled={loading}
              className="flex-1 bg-[#131b2e] border border-slate-700/80 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo/40 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-gradient-to-r from-accentIndigo to-accentViolet hover:opacity-90 text-white font-semibold p-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-accentIndigo/20"
              title="Send Message"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
};

export default Chat;
