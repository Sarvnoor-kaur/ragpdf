import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload, FileText, Trash2, Eye, AlertCircle, CheckCircle2,
  Loader2, Building, FolderOpen, Cpu, LogOut, X, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadDocument, getDocuments, deleteDocument, generateEmbeddings } from '../services/documentService';

const DEPARTMENTS = ['HR', 'IT', 'Finance', 'Engineering', 'Marketing', 'Management', 'Sales', 'General'];
const ALL_ROLES = ['admin', 'hr', 'manager', 'employee'];

const STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  archived: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  ready: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  processing: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  failed: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

// ─── Utility ────────────────────────────────────────────────────────────────
const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', {
  year: 'numeric', month: 'short', day: 'numeric',
});

// ─── Upload Form Component ───────────────────────────────────────────────────
const UploadForm = ({ onSuccess, onClose }) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [allowedRoles, setAllowedRoles] = useState(['admin', 'hr', 'manager', 'employee']);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('PDF file must be smaller than 10 MB.');
      setFile(null);
      return;
    }
    setError('');
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) return setError('Please enter a document title.');
    if (!department) return setError('Please select a department.');
    if (allowedRoles.length === 0) return setError('Please select at least one allowed role.');
    if (!file) return setError('Please choose a PDF file.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('department', department);
    formData.append('allowedRoles', JSON.stringify(allowedRoles));

    setUploading(true);
    setProgress(0);

    try {
      const res = await uploadDocument(formData, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      setSuccess(res.data.message || 'Document uploaded successfully!');
      setTitle('');
      setDepartment('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setProgress(0);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-lg relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Upload Policy Document</h2>
              <p className="text-xs text-slate-500">PDF only · Max 10 MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Leave Policy 2024"
              disabled={uploading}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo/40 transition-all disabled:opacity-50"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Department
            </label>
            <select
              id="doc-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={uploading}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accentIndigo focus:ring-1 focus:ring-accentIndigo/40 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            >
              <option value="" className="text-slate-500">Select department…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Allowed Roles */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Allowed Roles (Access Control)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#131b2e]/50 border border-slate-800 p-3 rounded-xl">
              {ALL_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 text-xs text-slate-300 capitalize cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedRoles.includes(r)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAllowedRoles([...allowedRoles, r]);
                      } else {
                        setAllowedRoles(allowedRoles.filter((role) => role !== r));
                      }
                    }}
                    className="rounded bg-slate-800 border-slate-700 text-accentIndigo focus:ring-0"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              PDF File
            </label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                ${file ? 'border-accentIndigo/60 bg-accentIndigo/5' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'}
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {file ? (
                <>
                  <FileText className="w-8 h-8 text-accentIndigo" />
                  <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-500">{fmtSize(file.size)}</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-600" />
                  <p className="text-sm text-slate-400">Click to choose a PDF</p>
                  <p className="text-xs text-slate-600">Maximum size: 10 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="doc-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </div>

          {/* Progress bar */}
          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accentIndigo to-accentViolet rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="upload-submit"
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload Document</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────
const DeleteConfirm = ({ doc, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#0f172a] border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <Trash2 className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-white font-bold text-lg mb-1">Delete Document?</h3>
      <p className="text-slate-400 text-sm mb-1">
        <span className="text-slate-200 font-semibold">"{doc.title}"</span>
      </p>
      <p className="text-slate-500 text-xs mb-6">
        This will also delete all {doc.totalChunks} associated text chunks. This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          id="confirm-delete"
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const AdminDocuments = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [embeddingDocId, setEmbeddingDocId] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents || []);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteDocument(deleteTarget.id || deleteTarget._id);
      setDeleteTarget(null);
      fetchDocuments();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed.');
      setDeleting(false);
    }
  };

  const handleGenerateEmbeddings = async (id) => {
    setEmbeddingDocId(id);
    setFetchError('');
    try {
      await generateEmbeddings(id);
      fetchDocuments();
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to generate embeddings.');
    } finally {
      setEmbeddingDocId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-xl flex items-center justify-center shadow-lg shadow-accentIndigo/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold tracking-tight text-white text-sm font-display">Company Policy AI</span>
                <span className="text-[10px] text-accentIndigo font-semibold uppercase tracking-wider block -mt-1">Assistant Platform</span>
              </div>
            </Link>
            <span className="text-slate-700 hidden sm:inline">/</span>
            <span className="hidden sm:inline text-sm text-slate-400 font-medium">Documents</span>
          </div>

          <div className="flex items-center gap-3">
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
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mb-1">
              Company Documents
            </h1>
            <p className="text-slate-400 text-sm">
              Upload and manage policy PDFs for the AI knowledge base.
            </p>
          </div>
          <button
            id="open-upload-modal"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-accentIndigo/20 cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Upload New Policy
          </button>
        </div>

        {/* Stats bar */}
        {!loading && !fetchError && documents.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Documents', value: documents.length, icon: FileText },
              { label: 'Active', value: documents.filter(d => d.status === 'active').length, icon: CheckCircle2 },
              { label: 'Total Pages', value: documents.reduce((s, d) => s + (d.totalPages || 0), 0), icon: FolderOpen },
              { label: 'Total Chunks', value: documents.reduce((s, d) => s + (d.totalChunks || 0), 0), icon: Building },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accentIndigo/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-accentIndigo" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{value.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}
        {deleteError && (
          <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{deleteError}</span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-accentIndigo animate-spin" />
            <p className="text-slate-500 text-sm">Loading documents…</p>
          </div>
        ) : documents.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
            <FolderOpen className="w-14 h-14 text-slate-700" />
            <div className="text-center">
              <p className="text-slate-300 font-semibold mb-1">No documents yet</p>
              <p className="text-slate-500 text-sm">Upload your first company policy PDF to get started.</p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-accentIndigo/20 hover:bg-accentIndigo/30 border border-accentIndigo/40 text-accentIndigo font-medium px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload PDF
            </button>
          </div>
        ) : (
          /* Document table */
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Title', 'File Name', 'Department', 'Ver.', 'Pages', 'Chunks', 'Status', 'Upload Date', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {documents.map((doc) => {
                    const docId = doc.id || doc._id;
                    return (
                      <tr key={docId} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                            {doc.title}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 max-w-[180px] truncate">
                          {doc.originalFileName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="bg-slate-800 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-700">
                            {doc.department}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-center">{doc.version}</td>
                        <td className="px-4 py-3.5 text-slate-400 text-center">{doc.totalPages}</td>
                        <td className="px-4 py-3.5 text-slate-400 text-center">{doc.totalChunks}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${STATUS_COLORS[doc.status] || STATUS_COLORS.active}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                          {fmtDate(doc.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              id={`embed-doc-${docId}`}
                              onClick={() => handleGenerateEmbeddings(docId)}
                              disabled={embeddingDocId === docId || doc.status === 'ready'}
                              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                                doc.status === 'ready' 
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 cursor-pointer'
                              }`}
                            >
                              {embeddingDocId === docId ? (
                                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                              ) : doc.status === 'ready' ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> Ready</>
                              ) : (
                                <><Zap className="w-3.5 h-3.5" /> Embed</>
                              )}
                            </button>
                            <button
                              id={`view-doc-${docId}`}
                              onClick={() => navigate(`/documents/${docId}`)}
                              className="flex items-center gap-1.5 text-xs bg-accentIndigo/10 hover:bg-accentIndigo/20 border border-accentIndigo/30 text-accentIndigo font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button
                              id={`delete-doc-${docId}`}
                              onClick={() => { setDeleteError(''); setDeleteTarget(doc); }}
                              className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadForm
          onSuccess={fetchDocuments}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirm
          doc={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default AdminDocuments;
