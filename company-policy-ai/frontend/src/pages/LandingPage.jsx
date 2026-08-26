import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Brain, Menu, X, ArrowRight, ChevronDown, Bot, FileText, Search,
  Shield, MessageSquare, Zap, CheckCircle, Lock, Users, Building,
  BookOpen, Star, Database, Cpu, ChevronRight, BarChart3, Clock,
  GitBranch, Award, FlaskConical, LayoutGrid
} from 'lucide-react';

// ─── Utility hook: intersection observer for scroll-in animations ────────────
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Security', href: '#security' },
    { label: 'Use Cases', href: '#use-cases' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-slate-800/70 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0b0f19]/98 backdrop-blur-md shadow-lg shadow-black/30'
          : 'bg-[#0b0f19]/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-xl flex items-center justify-center shadow-lg shadow-accentIndigo/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-tight font-display">
            Company Policy <span className="text-accentIndigo">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-gradient-to-r from-accentIndigo to-accentViolet text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accentIndigo/25"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800/50 transition-all"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-gradient-to-r from-accentIndigo to-accentViolet text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accentIndigo/25"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0b0f19]/98 backdrop-blur-md border-t border-slate-800 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-slate-300 hover:text-white hover:bg-slate-800/60 px-3 py-2.5 rounded-xl text-sm transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 space-y-2 border-t border-slate-800/60">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center text-slate-300 border border-slate-700 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold py-2.5 rounded-xl text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// ─── HERO SECTION ────────────────────────────────────────────────────────────
const Hero = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0b0f19] pt-16">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accentIndigo/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accentViolet/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — Copy */}
        <div className="animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accentIndigo/10 border border-accentIndigo/25 text-accentIndigo text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Enterprise Knowledge
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Turn your documents into an{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-accentIndigo to-accentViolet bg-clip-text text-transparent">
                intelligent knowledge base
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-accentIndigo/50 to-accentViolet/50" />
            </span>
            .
          </h1>

          {/* Subheading */}
          <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
            Upload company documents, ask questions in natural language, and get accurate answers grounded in your organization's knowledge — with full citation of the source.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link
              to={isAuthenticated ? '/chat' : '/register'}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-accentIndigo/25 text-sm"
            >
              Start Asking Questions <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 text-slate-300 border border-slate-700/70 bg-slate-800/40 hover:bg-slate-800 hover:text-white font-medium px-6 py-3.5 rounded-xl transition-all text-sm"
            >
              See How It Works <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Micro trust */}
          <p className="text-slate-600 text-xs flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Secure document access</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Source citations included</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Role-based access control</span>
          </p>
        </div>

        {/* Right — Chat UI mockup */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative">
            {/* Glow behind card */}
            <div className="absolute -inset-4 bg-gradient-to-r from-accentIndigo/20 to-accentViolet/20 rounded-3xl blur-2xl" />

            {/* Chat card */}
            <div className="relative bg-[#0f172a] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
              {/* Titlebar */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/80 bg-[#131b2e]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex items-center gap-2 mx-auto">
                  <div className="w-5 h-5 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-md flex items-center justify-center">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">AI Policy Assistant</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* User question */}
                <div className="flex justify-end">
                  <div className="bg-accentIndigo/20 border border-accentIndigo/25 text-slate-200 text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%]">
                    What is the annual leave policy for employees?
                  </div>
                </div>

                {/* RAG steps indicator */}
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap">Searching 3 documents...</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {/* AI answer */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-accentIndigo/25">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed">
                      Full-time employees are entitled to{' '}
                      <span className="text-accentIndigo font-semibold">20 annual leave days</span>{' '}
                      per calendar year, accruing monthly.
                    </div>

                    {/* Sources */}
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest px-1">Sources</p>
                      <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/40 px-3 py-2 rounded-xl text-xs text-slate-400 hover:border-accentIndigo/30 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-accentIndigo shrink-0" />
                        <span>Company Leave Policy</span>
                        <span className="ml-auto text-slate-600">Page 1</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/40 px-3 py-2 rounded-xl text-xs text-slate-400 hover:border-accentIndigo/30 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-accentViolet shrink-0" />
                        <span>HR Policy Handbook</span>
                        <span className="ml-auto text-slate-600">Page 4</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-4 py-2.5 rounded-xl">
                  <span className="text-slate-600 text-xs flex-1">Ask a follow-up question...</span>
                  <div className="w-7 h-7 bg-accentIndigo/20 rounded-lg flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-accentIndigo" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-bounce-slow">
              ✓ Grounded Answer
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-4 -left-4 bg-[#0f172a] border border-slate-700/60 rounded-xl px-4 py-3 shadow-xl">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Access Filter</p>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-accentIndigo" />
                <span className="text-xs text-slate-200 font-medium">Role-based protection active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-4 h-4 text-slate-700" />
      </div>
    </section>
  );
};

// ─── TRUST BAR ───────────────────────────────────────────────────────────────
const TrustBar = () => {
  const [ref, inView] = useInView();
  const items = [
    { icon: Zap, label: 'Semantic Search', desc: 'Find by meaning, not just keywords' },
    { icon: Lock, label: 'Secure Access', desc: 'Role & department-based filtering' },
    { icon: BookOpen, label: 'Grounded Answers', desc: 'No AI hallucinations — context only' },
    { icon: Search, label: 'Source Citations', desc: 'See the exact document and page' },
  ];

  return (
    <section className="bg-[#0d1424] border-y border-slate-800/60">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className={`text-center text-slate-500 text-sm mb-8 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Built for teams that need instant answers from their own knowledge
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ icon: Icon, label, desc }, i) => (
            <div
              key={label}
              className={`flex flex-col items-center text-center p-5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-300 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 bg-accentIndigo/10 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-accentIndigo" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{label}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── PROBLEM SECTION ─────────────────────────────────────────────────────────
const ProblemSection = () => {
  const [ref, inView] = useInView();
  const problems = [
    {
      icon: GitBranch,
      title: 'Scattered Information',
      desc: 'Critical policies and documents are buried across PDFs, folders, and email threads. Finding a single answer takes too long.',
    },
    {
      icon: Clock,
      title: 'Slow Knowledge Retrieval',
      desc: 'Employees waste hours manually searching through documents for simple policy questions that should take seconds.',
    },
    {
      icon: Shield,
      title: 'Sensitive Information Risk',
      desc: 'Not everyone should access every document. Sharing incorrectly can expose confidential HR, legal, or financial data.',
    },
  ];

  return (
    <section className="bg-[#0b0f19] py-24">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accentIndigo text-sm font-semibold uppercase tracking-widest mb-3">The Problem</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Stop searching through documents manually.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Your organization's knowledge is already there — it's just trapped inside files no one can efficiently search.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {problems.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className={`relative p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-red-500/20 hover:bg-slate-900/70 transition-all duration-300 group ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-500/15 transition-colors">
                <Icon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Solution bridge */}
        <div className={`relative rounded-2xl border border-accentIndigo/20 bg-gradient-to-br from-accentIndigo/5 to-accentViolet/5 p-8 text-center transition-all duration-700 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '400ms' }}>
          <div className="w-12 h-12 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accentIndigo/30">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-3">One intelligent layer over your organization's knowledge.</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
            Company Policy AI combines semantic search, vector retrieval, and generative AI to turn your organization's documents into an interactive knowledge base — with built-in access control.
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const [ref, inView] = useInView();
  const steps = [
    { num: '01', icon: FileText, label: 'Upload', title: 'Upload Documents', desc: 'Upload your organization\'s PDF policy documents. Set department and role-based access controls.' },
    { num: '02', icon: Cpu, label: 'Understand', title: 'Semantic Processing', desc: 'Documents are extracted, chunked, and converted into 1536-dimensional semantic embeddings using Gemini.' },
    { num: '03', icon: Database, label: 'Retrieve', title: 'Vector Retrieval', desc: 'MongoDB Atlas Vector Search finds the most semantically relevant authorized chunks for any question.' },
    { num: '04', icon: Bot, label: 'Answer', title: 'Grounded Response', desc: 'Gemini generates a precise answer using only retrieved context, and cites the source document and page.' },
  ];

  return (
    <section id="how-it-works" className="bg-[#0d1424] py-24">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accentIndigo text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            From document to answer in seconds.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            A four-step pipeline that turns static PDFs into an interactive, secure knowledge base.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ num, icon: Icon, label, title, desc }, i) => (
            <div
              key={num}
              className={`relative p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-accentIndigo/30 hover:bg-slate-900/80 transition-all duration-300 group ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="text-5xl font-extrabold text-slate-800/80 font-display absolute top-4 right-5 leading-none group-hover:text-accentIndigo/20 transition-colors">
                {num}
              </span>
              <div className="w-11 h-11 bg-gradient-to-tr from-accentIndigo/20 to-accentViolet/20 border border-accentIndigo/20 rounded-xl flex items-center justify-center mb-5 group-hover:from-accentIndigo/30 group-hover:to-accentViolet/30 transition-all">
                <Icon className="w-5 h-5 text-accentIndigo" />
              </div>
              <p className="text-accentIndigo text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
              <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              {i < steps.length - 1 && (
                <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── RAG ARCHITECTURE ────────────────────────────────────────────────────────
const RAGArchitecture = () => {
  const [ref, inView] = useInView(0.1);
  const flow = [
    { label: 'User Question', icon: MessageSquare, color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30', text: 'text-blue-400' },
    { label: 'Gemini Embedding', icon: Brain, color: 'from-accentIndigo/20 to-accentIndigo/10 border-accentIndigo/30', text: 'text-accentIndigo' },
    { label: 'Atlas Vector Search', icon: Database, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30', text: 'text-emerald-400' },
    { label: 'Top Relevant Chunks', icon: FileText, color: 'from-amber-500/20 to-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
    { label: 'Gemini LLM', icon: Cpu, color: 'from-accentViolet/20 to-accentViolet/10 border-accentViolet/30', text: 'text-accentViolet' },
    { label: 'Grounded Answer + Citations', icon: CheckCircle, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30', text: 'text-emerald-400' },
  ];

  return (
    <section className="bg-[#0b0f19] py-24">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accentViolet text-sm font-semibold uppercase tracking-widest mb-3">AI Architecture</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Built on Retrieval-Augmented Generation.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Instead of asking AI to guess, the system first retrieves relevant passages from your documents and then uses that grounded context to generate its response — eliminating hallucinations.
          </p>
        </div>

        <div className="flex flex-col items-center gap-0 max-w-sm mx-auto lg:max-w-none lg:flex-row lg:items-stretch lg:gap-0 lg:justify-center">
          {flow.map(({ label, icon: Icon, color, text }, i) => (
            <div key={label} className={`flex flex-col lg:flex-row items-center ${inView ? 'opacity-100' : 'opacity-0'} transition-all duration-500`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className={`flex flex-col items-center p-4 rounded-xl border bg-gradient-to-br ${color} min-w-[130px] text-center hover:scale-105 transition-transform cursor-default`}>
                <div className={`w-8 h-8 rounded-lg bg-slate-900/60 flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${text}`} />
                </div>
                <span className={`text-xs font-semibold ${text} leading-tight`}>{label}</span>
              </div>
              {i < flow.length - 1 && (
                <div className="flex flex-col lg:flex-row items-center">
                  <div className="w-px h-6 lg:w-6 lg:h-px bg-gradient-to-b lg:bg-gradient-to-r from-slate-700 to-slate-600" />
                  <ChevronDown className="w-4 h-4 text-slate-600 lg:hidden" />
                  <ChevronRight className="w-4 h-4 text-slate-600 hidden lg:block" />
                  <div className="w-px h-6 lg:w-6 lg:h-px bg-gradient-to-b lg:bg-gradient-to-r from-slate-600 to-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={`mt-12 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 max-w-2xl mx-auto transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300/80 text-sm leading-relaxed">
            <span className="font-semibold text-amber-300">Zero data leakage:</span> Access filtering happens before the AI model receives any context. Unauthorized chunks are never passed to Gemini.
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── SECURITY SECTION ────────────────────────────────────────────────────────
const SecuritySection = () => {
  const [ref, inView] = useInView();

  return (
    <section id="security" className="bg-[#0d1424] py-24">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <p className="text-accentIndigo text-sm font-semibold uppercase tracking-widest mb-3">Security</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-5">
              AI answers. Your permissions stay in control.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Users only retrieve information from documents they are authorized to access. Role and department rules are enforced at the database level — before any document content reaches the AI.
            </p>
            <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300/80 text-sm leading-relaxed">
                <span className="font-semibold text-red-300">Zero leakage guarantee:</span> Unauthorized document content is filtered before it reaches the AI model. Gemini never sees content the user isn't allowed to access.
              </p>
            </div>
          </div>

          {/* Access control diagram */}
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '200ms' }}>
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 space-y-4">
              {/* User pill */}
              <div className="flex items-center justify-center">
                <div className="bg-accentIndigo/10 border border-accentIndigo/30 rounded-xl px-5 py-3 text-center">
                  <Users className="w-5 h-5 text-accentIndigo mx-auto mb-1" />
                  <p className="text-white text-sm font-semibold">Engineering Employee</p>
                  <p className="text-slate-500 text-xs">Role: employee • Dept: Engineering</p>
                </div>
              </div>

              <div className="flex justify-center"><ChevronDown className="w-5 h-5 text-slate-700" /></div>

              {/* Filter box */}
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 text-center">
                <Shield className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-amber-300 text-sm font-semibold">Access Control Filter</p>
                <p className="text-slate-500 text-xs">Enforced at MongoDB Vector Search</p>
              </div>

              <div className="flex justify-center"><ChevronDown className="w-5 h-5 text-slate-700" /></div>

              {/* Document results */}
              <div className="space-y-2">
                {[
                  { label: 'Engineering Policy Guide', dept: 'Engineering', allowed: true },
                  { label: 'Company Leave Policy', dept: 'General', allowed: true },
                  { label: 'Confidential HR Salary Data', dept: 'HR', allowed: false },
                  { label: 'Finance Restricted Reports', dept: 'Finance', allowed: false },
                ].map(({ label, dept, allowed }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                      allowed
                        ? 'bg-emerald-500/8 border-emerald-500/25 text-emerald-300'
                        : 'bg-slate-800/30 border-slate-700/40 text-slate-600'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${allowed ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                      {allowed ? '✓' : '✕'}
                    </span>
                    <span className="flex-1">{label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${allowed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                      {dept}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center"><ChevronDown className="w-5 h-5 text-slate-700" /></div>

              <div className="bg-gradient-to-r from-accentIndigo/10 to-accentViolet/10 border border-accentIndigo/20 rounded-xl px-4 py-3 text-center">
                <Bot className="w-5 h-5 text-accentIndigo mx-auto mb-1" />
                <p className="text-accentIndigo text-sm font-semibold">Grounded AI Answer</p>
                <p className="text-slate-500 text-xs">Only from authorized content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── FEATURES ────────────────────────────────────────────────────────────────
const Features = () => {
  const [ref, inView] = useInView(0.1);
  const features = [
    { icon: MessageSquare, title: 'AI Document Q&A', desc: 'Ask questions in plain English instead of manually searching through PDF pages.' },
    { icon: Search, title: 'Semantic Search', desc: 'Find information based on meaning and intent, not just exact keyword matches.' },
    { icon: FileText, title: 'Source Citations', desc: 'Every answer references the exact document title and page number that supports it.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Control which users and roles can access which documents across the platform.' },
    { icon: Building, title: 'Department Access', desc: 'Segment document access by organizational department for precise data governance.' },
    { icon: MessageSquare, title: 'Persistent Chat History', desc: 'Return to previous conversations anytime. All history is preserved and searchable.' },
    { icon: LayoutGrid, title: 'Admin Management', desc: 'Upload, organize, and manage organizational documents through the admin interface.' },
    { icon: FlaskConical, title: 'Grounded Responses', desc: 'Gemini generates answers strictly from retrieved document context — zero hallucination.' },
  ];

  return (
    <section id="features" className="bg-[#0b0f19] py-24">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accentIndigo text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Everything you need for intelligent document search.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className={`p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-accentIndigo/30 hover:bg-slate-800/50 transition-all duration-300 group cursor-default ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 bg-accentIndigo/10 group-hover:bg-accentIndigo/15 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <Icon className="w-5 h-5 text-accentIndigo" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── USE CASES ───────────────────────────────────────────────────────────────
const UseCases = () => {
  const [ref, inView] = useInView();
  const cases = [
    {
      icon: Users,
      dept: 'HR',
      color: 'from-rose-500/10 to-rose-600/5 border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
      desc: 'Instantly answer questions about employee policies, leave, benefits, onboarding procedures, and internal HR rules.',
    },
    {
      icon: Cpu,
      dept: 'Engineering',
      color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      desc: 'Search technical documentation, coding standards, development guides, and engineering processes without digging through wikis.',
    },
    {
      icon: BarChart3,
      dept: 'Finance',
      color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      desc: 'Find budget policies, expense procedures, financial reporting rules, and reimbursement processes in seconds.',
    },
    {
      icon: Star,
      dept: 'Management',
      color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      desc: 'Quickly retrieve organizational policies, operational procedures, and strategic documentation for leadership.',
    },
  ];

  return (
    <section id="use-cases" className="bg-[#0d1424] py-24">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accentIndigo text-sm font-semibold uppercase tracking-widest mb-3">Use Cases</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Built for every team.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cases.map(({ icon: Icon, dept, color, iconBg, iconColor, desc }, i) => (
            <div
              key={dept}
              className={`p-6 rounded-2xl border bg-gradient-to-br ${color} transition-all duration-300 group cursor-default ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <h3 className="text-white font-bold text-base mb-3">{dept}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── ANSWER DEMO ─────────────────────────────────────────────────────────────
const AnswerDemo = () => {
  const [ref, inView] = useInView();

  return (
    <section className="bg-[#0b0f19] py-24">
      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accentIndigo text-sm font-semibold uppercase tracking-widest mb-3">See It In Action</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            Grounded answers, not guesses.
          </h2>
        </div>

        <div className={`grid md:grid-cols-2 gap-6 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
          {/* Question */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-4">Employee Question</p>
            <div className="bg-accentIndigo/10 border border-accentIndigo/20 rounded-xl px-4 py-4 text-slate-200 text-sm leading-relaxed">
              What is the company's annual leave allowance for full-time employees?
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">Processing</p>
              {['Generating embedding...', 'Searching 12 documents...', 'Found 2 relevant chunks', 'Generating answer...'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-500 text-xs">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Answer */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">AI Answer</p>
              <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                ✓ Grounded Answer
              </span>
            </div>
            <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-slate-200 text-sm leading-relaxed mb-4">
              Full-time employees are entitled to <span className="text-accentIndigo font-semibold">20 annual leave days</span> per calendar year. Leave accrues at a rate of 1.67 days per month and must be approved by line management.
            </div>
            <div>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-2">Sources</p>
              <div className="space-y-2">
                {[
                  { name: 'Company Leave Policy.pdf', page: 1 },
                  { name: 'HR Policy Handbook.pdf', page: 4 },
                ].map(({ name, page }) => (
                  <div key={name} className="flex items-center gap-2.5 bg-accentIndigo/8 border border-accentIndigo/20 rounded-xl px-3 py-2.5">
                    <FileText className="w-4 h-4 text-accentIndigo shrink-0" />
                    <span className="text-slate-300 text-xs flex-1 font-medium">{name}</span>
                    <span className="text-xs text-slate-600 shrink-0">Page {page}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── METRICS SECTION ─────────────────────────────────────────────────────────
const Metrics = () => {
  const [ref, inView] = useInView();
  const stats = [
    { value: '1,536', label: 'Vector Dimensions', sub: 'per document chunk' },
    { value: '< 2s', label: 'Average Response', sub: 'from question to answer' },
    { value: '8+', label: 'Departments', sub: 'supported by access control' },
    { value: '4', label: 'Role Levels', sub: 'admin, hr, manager, employee' },
  ];

  return (
    <section className="bg-[#0d1424] border-y border-slate-800/60 py-16">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className={`text-center text-slate-600 text-xs uppercase tracking-widest mb-8 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          Platform capabilities
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label, sub }, i) => (
            <div
              key={label}
              className={`text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <p className="font-display text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-accentIndigo to-accentViolet bg-clip-text text-transparent mb-1">
                {value}
              </p>
              <p className="text-white font-semibold text-sm">{label}</p>
              <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CTA SECTION ─────────────────────────────────────────────────────────────
const CTA = () => {
  const { isAuthenticated } = useAuth();
  const [ref, inView] = useInView();

  return (
    <section className="bg-[#0b0f19] py-24">
      <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={`relative transition-all duration-700 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="absolute -inset-8 bg-gradient-to-r from-accentIndigo/10 via-accentViolet/8 to-accentIndigo/10 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-700/50 rounded-3xl p-12">
            <div className="w-14 h-14 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accentIndigo/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Your documents already contain the answers.
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Give your team a faster, smarter way to access organizational knowledge — with full security and source citations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={isAuthenticated ? '/chat' : '/register'}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accentIndigo to-accentViolet text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-accentIndigo/30"
              >
                Start Using AI Assistant <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 text-slate-300 border border-slate-700 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800 font-medium px-7 py-3.5 rounded-xl transition-all"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-[#080c14] border-t border-slate-800/60">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm font-display">Company Policy AI</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">AI-powered organizational knowledge. Ask anything, get grounded answers.</p>
        </div>

        {/* Product */}
        <div>
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-3">Product</p>
          <ul className="space-y-2">
            {[{ label: 'Features', href: '#features' }, { label: 'Security', href: '#security' }, { label: 'How It Works', href: '#how-it-works' }, { label: 'Use Cases', href: '#use-cases' }].map(({ label, href }) => (
              <li key={label}><a href={href} className="text-slate-600 hover:text-slate-300 text-sm transition-colors">{label}</a></li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-3">Account</p>
          <ul className="space-y-2">
            {[{ label: 'Login', to: '/login' }, { label: 'Register', to: '/register' }, { label: 'Dashboard', to: '/dashboard' }, { label: 'Chat', to: '/chat' }].map(({ label, to }) => (
              <li key={label}><Link to={to} className="text-slate-600 hover:text-slate-300 text-sm transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Tech stack */}
        <div>
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-3">Built With</p>
          <ul className="space-y-2 text-slate-600 text-sm">
            {['React + Vite', 'Node.js + Express', 'MongoDB Atlas', 'Gemini AI', 'Vector Search'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accentIndigo/60 rounded-full" />{t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-700 text-xs">© 2026 Company Policy AI. All rights reserved.</p>
        <p className="text-slate-700 text-xs">Powered by Gemini AI + MongoDB Atlas Vector Search</p>
      </div>
    </div>
  </footer>
);

// ─── MAIN LANDING PAGE ───────────────────────────────────────────────────────
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <ProblemSection />
        <HowItWorks />
        <RAGArchitecture />
        <SecuritySection />
        <Features />
        <UseCases />
        <AnswerDemo />
        <Metrics />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
