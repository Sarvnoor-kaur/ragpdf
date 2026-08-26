import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, ArrowLeft, Loader2, AlertCircle, Hash, Bot, User, FileText
} from 'lucide-react';
import { askQuestion } from '../services/ragService';

const Chat = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await askQuestion(question);
      setResult(res.data.data); // backend sends { success, data: { answer, sources } }
    } catch (err) {
      setError(err.response?.data?.message || 'Sorry, I couldn\'t process your question right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-accentViolet" />
            <span className="text-sm font-semibold text-white">Company Policy Assistant</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        
        {/* Intro */}
        {!result && !loading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            <div className="w-16 h-16 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-2xl flex items-center justify-center shadow-lg shadow-accentIndigo/20 mb-6">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3">Ask me anything</h1>
            <p className="text-slate-400 text-sm">
              I can answer questions based on the uploaded company policies. I will retrieve the relevant sections and synthesize a factual answer for you.
            </p>
          </div>
        )}

        {/* Chat Display */}
        <div className="flex-1 overflow-y-auto mb-8 space-y-6">
          {/* User Question */}
          {result && (
            <div className="flex items-start gap-4 justify-end">
              <div className="bg-accentViolet/10 border border-accentViolet/20 rounded-2xl rounded-tr-sm p-4 max-w-[85%] text-slate-200 text-sm">
                {result.question}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}

          {/* AI Answer & Sources */}
          {result && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentIndigo to-accentViolet flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-sm p-5 max-w-[90%]">
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.answer}
                </div>
                
                {result.sources && result.sources.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-800/60">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <FileText className="w-3.5 h-3.5" /> Sources
                    </h4>
                    <div className="flex flex-col gap-2">
                      {result.sources.map((source, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-[#131b2e]/50 border border-slate-800 rounded-lg p-3">
                          <div className="text-accentViolet font-black text-sm mt-0.5">{(idx + 1).toString().padStart(2, '0')}</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{source.documentTitle}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-500 font-medium">Page {source.page}</span>
                              <span className="text-[10px] text-slate-600 font-medium">Score: {source.score.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentIndigo to-accentViolet flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-sm p-5 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-accentViolet animate-spin" />
                <span className="text-sm text-slate-400 font-medium">Searching company policies...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl mt-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="mt-auto">
          <form onSubmit={handleAsk} className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="w-full bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-2xl pl-5 pr-32 py-4 focus:outline-none focus:border-accentViolet focus:ring-1 focus:ring-accentViolet/40 transition-all text-sm shadow-xl"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Ask
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-4">
            AI can make mistakes. Always verify important rules with HR.
          </p>
        </div>

      </main>
    </div>
  );
};

export default Chat;
