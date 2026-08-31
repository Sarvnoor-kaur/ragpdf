import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Briefcase, Building, ShieldAlert, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('Engineering');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !role || !department) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await register(name, email, password, role, department);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] relative overflow-hidden px-4 py-12">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accentIndigo/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accentViolet/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-accentIndigo to-accentViolet rounded-2xl shadow-lg shadow-accentIndigo/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-display bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-slate-400 text-sm">Register to access the Company Policy AI Assistant</p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-950/40 border border-red-800/60 p-4 rounded-xl text-red-200 text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  data-testid="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-800 focus:border-accentIndigo/60 focus:ring-1 focus:ring-accentIndigo/60 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-all text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  data-testid="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-800 focus:border-accentIndigo/60 focus:ring-1 focus:ring-accentIndigo/60 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-all text-sm"
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  data-testid="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#131b2e] border border-slate-800 focus:border-accentIndigo/60 focus:ring-1 focus:ring-accentIndigo/60 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    value={role}
                    data-testid="register-role"
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-800 focus:border-accentIndigo/60 focus:ring-1 focus:ring-accentIndigo/60 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 outline-none transition-all text-sm cursor-pointer"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Building className="w-4 h-4" />
                  </div>
                  <select
                    value={department}
                    data-testid="register-department"
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-800 focus:border-accentIndigo/60 focus:ring-1 focus:ring-accentIndigo/60 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 outline-none transition-all text-sm cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              data-testid="register-submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-accentBlue via-accentIndigo to-accentViolet text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-sm mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <p className="text-center mt-6 text-slate-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-accentIndigo hover:text-accentViolet hover:underline font-semibold transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
