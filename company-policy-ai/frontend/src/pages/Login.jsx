import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, ArrowRight, Sparkles, Shield, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex bg-mainBg">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-primaryAccent to-secondaryAccent rounded-2xl shadow-lg mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primaryText mb-2">
              Welcome Back
            </h1>
            <p className="text-secondaryText text-sm">Sign in to your Company Policy AI Assistant</p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-primaryText mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondaryText">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    data-testid="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-mainBg border border-border focus:border-primaryAccent focus:ring-2 focus:ring-primaryAccent/20 rounded-xl pl-11 pr-4 py-3 text-primaryText placeholder-secondaryText outline-none transition-all text-sm"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primaryText mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondaryText">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    data-testid="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-mainBg border border-border focus:border-primaryAccent focus:ring-2 focus:ring-primaryAccent/20 rounded-xl pl-11 pr-4 py-3 text-primaryText placeholder-secondaryText outline-none transition-all text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                data-testid="login-submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primaryAccent to-secondaryAccent text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Navigation */}
          <p className="text-center mt-6 text-secondaryText text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primaryAccent hover:text-secondaryAccent font-semibold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-purple-50 to-indigo-50 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primaryAccent/10 to-secondaryAccent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-full blur-2xl" />

        <div className="relative z-10 max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primaryText mb-4">
              Your AI-Powered Policy Assistant
            </h2>
            <p className="text-secondaryText text-lg leading-relaxed">
              Access company policies, get instant answers, and stay compliant with our intelligent assistant.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primaryAccent" />
              </div>
              <div>
                <h3 className="font-semibold text-primaryText mb-1">Secure & Compliant</h3>
                <p className="text-sm text-secondaryText">Enterprise-grade security with RBAC & ABAC</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primaryAccent" />
              </div>
              <div>
                <h3 className="font-semibold text-primaryText mb-1">AI-Powered Answers</h3>
                <p className="text-sm text-secondaryText">Get accurate answers from your documents</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primaryAccent" />
              </div>
              <div>
                <h3 className="font-semibold text-primaryText mb-1">Always Up-to-Date</h3>
                <p className="text-sm text-secondaryText">Real-time access to latest policies</p>
              </div>
            </div>
          </div>

          {/* Decorative Pattern */}
          <div className="absolute -bottom-12 -right-12 w-64 h-64 opacity-20">
            <div className="w-full h-full bg-gradient-to-br from-primaryAccent to-secondaryAccent rounded-3xl rotate-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;