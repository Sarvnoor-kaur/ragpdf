import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, User, Mail, Shield, Building, Cpu,
  MessageSquare, FolderOpen, ArrowRight, Upload,
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col text-slate-100">
      {/* Header / Navigation */}
      <header className="border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-xl flex items-center justify-center shadow-lg shadow-accentIndigo/20">
              <Cpu className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block text-sm sm:text-base font-display">
                Company Policy AI
              </span>
              <span className="text-[10px] text-accentIndigo font-semibold uppercase tracking-wider block -mt-1">
                Assistant Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{user?.name}</span>
              <span className="text-xs text-slate-400 capitalize">{user?.role}</span>
            </div>
            <button
              onClick={logout}
              data-testid="logout-button"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium px-4 py-2 rounded-xl transition-all text-sm border border-slate-700/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mb-1.5">
            Welcome, {user?.name}
          </h2>
          <p className="text-slate-400 text-sm">
            Access and manage company policies using the unified assistant dashboard.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Info Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Visual gradient accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accentIndigo/10 rounded-full blur-2xl"></div>

            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-accentIndigo" />
                <span>User Profile</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-[#131b2e]/50 border border-slate-800/80 p-3 rounded-xl">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Email Address</span>
                    <span className="text-sm font-medium text-slate-200">{user?.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#131b2e]/50 border border-slate-800/80 p-3 rounded-xl">
                  <Shield className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Platform Role</span>
                    <span className="text-sm font-medium text-slate-200 capitalize">{user?.role}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#131b2e]/50 border border-slate-800/80 p-3 rounded-xl">
                  <Building className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Department</span>
                    <span className="text-sm font-medium text-slate-200">{user?.department}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/60 text-center">
              <span className="text-[11px] text-slate-500">
                Registered on: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Right column — stacks vertically */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Document Management Card — visible to admin and hr only */}
            {isAdminOrHr && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-accentIndigo/10 rounded-full blur-3xl" />
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-accentIndigo/15 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-accentIndigo" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Document Management</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Step 2 · PDF Upload &amp; Extraction</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Live
                  </span>
                </div>

                <p className="text-slate-400 text-sm mb-5">
                  Upload company policy PDFs. Text is extracted, chunked, and stored in MongoDB ready for the AI knowledge base.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: Upload, text: 'PDF Upload with validation' },
                    { icon: FolderOpen, text: 'Text extraction (pdf-parse)' },
                    { icon: Cpu, text: 'Sliding window chunking' },
                    { icon: Building, text: 'Department tagging' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-slate-400 bg-[#131b2e]/50 border border-slate-800 rounded-xl px-3 py-2.5">
                      <Icon className="w-3.5 h-3.5 text-accentIndigo shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>

                <button
                  id="go-to-documents"
                  onClick={() => navigate('/admin/documents')}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-accentIndigo/20 cursor-pointer text-sm"
                >
                  <FolderOpen className="w-4 h-4" />
                  Manage Documents
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

            {/* RAG Bot Status Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between flex-1">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accentViolet/10 rounded-full blur-3xl"></div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-accentViolet" />
                  <span>Company Policy AI Assistant</span>
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-6">
                  Interact with your organizational documentation using AI retrieval.
                </p>

                {/* Chat Simulation Area */}
                <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-2xl p-6 min-h-[160px] flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-accentViolet/10 flex items-center justify-center text-accentViolet mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-200 mb-2">AI Policy Chatbot Ready</h4>
                  <p className="text-sm text-slate-400 max-w-md">
                    Ask questions about company policy and get grounded answers with source citations.
                  </p>

                  <button
                    onClick={() => navigate('/chat')}
                    data-testid="go-to-chat"
                    className="mt-5 px-6 py-3 bg-gradient-to-r from-accentIndigo to-accentViolet text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-accentIndigo/20 cursor-pointer flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open AI Policy Assistant (Step 5)
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Status: Day 12 Complete ✓</span>
                <span>RBAC &amp; ABAC Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
