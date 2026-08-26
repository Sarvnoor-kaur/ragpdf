import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Building, Shield, Calendar, Hash,
  Layers, CheckCircle2, AlertCircle, Loader2, Cpu, LogOut,
  ChevronRight, BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDocument } from '../services/documentService';

const fmtSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  archived: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
};

// ─── Metadata Row ────────────────────────────────────────────────────────────
const MetaRow = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-start gap-3 bg-[#131b2e]/50 border border-slate-800/80 p-3.5 rounded-xl">
    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${accent || 'text-slate-400'}`} />
    <div>
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  </div>
);

// ─── Chunk Card ───────────────────────────────────────────────────────────────
const ChunkCard = ({ chunk }) => {
  const pageLabel =
    chunk.pageStart === chunk.pageEnd
      ? `Page ${chunk.pageStart}`
      : `Pages ${chunk.pageStart}–${chunk.pageEnd}`;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accentIndigo/15 flex items-center justify-center">
            <Hash className="w-3.5 h-3.5 text-accentIndigo" />
          </div>
          <span className="text-xs font-bold text-accentIndigo">
            Chunk {chunk.chunkNumber}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          {chunk.embedding && chunk.embedding.length === 1536 && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
              Embedded ✓
            </span>
          )}
          <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
            {pageLabel}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
        {chunk.text}
      </p>
      <p className="text-xs text-slate-600 mt-3">
        {chunk.text.split(/\s+/).filter(Boolean).length} words
      </p>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const DocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [document, setDocument] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getDocument(id);
        setDocument(res.data.document);
        setChunks(res.data.chunks || []);
        setTotalChunks(res.data.totalChunks || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load document.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-xl flex items-center justify-center shadow-lg shadow-accentIndigo/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 min-w-0">
              <Link to="/admin/documents" className="hover:text-slate-300 transition-colors whitespace-nowrap">
                Documents
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-300 truncate">
                {document?.title || 'Loading…'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{user?.name}</span>
              <span className="text-xs text-slate-400 capitalize">{user?.role}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium px-4 py-2 rounded-xl transition-all text-sm border border-slate-700/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Documents
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-accentIndigo animate-spin" />
            <p className="text-slate-500 text-sm">Loading document…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && document && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left: Metadata ── */}
            <div className="lg:col-span-1 space-y-6">
              {/* Document card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accentIndigo/10 rounded-full blur-2xl" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accentIndigo to-accentViolet flex items-center justify-center shadow-lg shadow-accentIndigo/20">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-white font-bold text-base leading-tight truncate">
                      {document.title}
                    </h1>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize mt-1 inline-block ${STATUS_COLORS[document.status] || STATUS_COLORS.active}`}>
                      {document.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <MetaRow icon={FileText} label="File Name" value={document.originalFileName} />
                  <MetaRow icon={Building} label="Department" value={document.department} accent="text-accentViolet" />
                  <MetaRow icon={Shield} label="Uploaded By" value={document.uploadedBy?.name || '—'} />
                  <MetaRow icon={Calendar} label="Upload Date" value={fmtDate(document.createdAt)} />
                </div>
              </div>

              {/* Stats card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accentIndigo" /> Document Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Pages', value: document.totalPages },
                    { label: 'Chunks', value: document.totalChunks },
                    { label: 'Embedded Chunks', value: chunks.filter(c => c.embedding && c.embedding.length === 1536).length + (totalChunks > chunks.length && document.status === 'ready' ? totalChunks - chunks.length : 0) },
                    { label: 'Embedding Model', value: 'gemini-embedding-2-preview' },
                    { label: 'Dimensions', value: 1536 },
                    { label: 'Size', value: fmtSize(document.fileSize) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#131b2e]/70 border border-slate-800 rounded-xl p-3 text-center col-span-1">
                      <p className="text-sm font-bold text-white break-words">{value}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Chunk Preview ── */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accentViolet" />
                  Extracted Chunks
                </h2>
                <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
                  Showing {chunks.length} of {totalChunks} chunks
                </span>
              </div>

              {chunks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl gap-3">
                  <BookOpen className="w-10 h-10 text-slate-700" />
                  <p className="text-slate-500 text-sm">No chunks found for this document.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chunks.map((chunk) => (
                    <ChunkCard key={chunk.id || chunk._id} chunk={chunk} />
                  ))}

                  {totalChunks > chunks.length && (
                    <div className="flex items-center justify-center py-4">
                      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-4 text-center">
                        <p className="text-slate-400 text-sm font-medium">
                          {totalChunks - chunks.length} more chunk{totalChunks - chunks.length !== 1 ? 's' : ''} not shown
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          All chunks will be used by the RAG engine in Step 3+
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentDetails;
