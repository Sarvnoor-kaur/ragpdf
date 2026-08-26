import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Cpu, ArrowLeft, Loader2, AlertCircle, Hash, Database, CheckCircle2
} from 'lucide-react';
import { searchDocuments } from '../services/searchService';

const SearchTest = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);
    setResults(null);

    try {
      const res = await searchDocuments(query);
      setResults(res.data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform semantic search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-accentViolet" />
            <span className="text-sm font-semibold text-white">Semantic Search Test</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Search Input Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-2xl flex items-center justify-center shadow-lg shadow-accentIndigo/20 mx-auto mb-4">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Vector Search Simulator</h1>
          <p className="text-slate-400 text-sm mb-8">
            Test the MongoDB Atlas Vector Search index directly. Enter a query below to see which document chunks are mathematically closest to your meaning.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., How many paid leaves do employees get?"
                className="w-full bg-[#131b2e] border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo/40 transition-all text-sm"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
              ) : (
                'Search'
              )}
            </button>
          </form>
        </div>

        {/* Status / Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && !error && results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Retrieved Chunks
              </h2>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-700 rounded-3xl py-16 text-center">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-semibold mb-1">No relevant policy information was found.</p>
                <p className="text-slate-500 text-sm">Try asking a different question or adjusting your phrasing.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((chunk, idx) => (
                  <div key={chunk._id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors relative overflow-hidden group">
                    {/* Rank Number */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-800 to-transparent flex justify-end p-3 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-xl font-black text-slate-700 block -mt-1 -mr-1">#{idx + 1}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-3 pr-10">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-accentViolet bg-accentViolet/10 border border-accentViolet/20 px-2.5 py-1 rounded-md">
                        <Hash className="w-3 h-3" /> Score: {chunk.score ? chunk.score.toFixed(4) : 'N/A'}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md">
                        Page {chunk.pageStart} {chunk.pageStart !== chunk.pageEnd ? `- ${chunk.pageEnd}` : ''}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      {chunk.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default SearchTest;
