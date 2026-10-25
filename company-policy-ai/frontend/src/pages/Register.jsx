import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Briefcase, Building, ShieldAlert, ArrowRight, Sparkles, Zap, Users } from 'lucide-react';

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
    <div className="min-h-screen flex bg-mainBg">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-primaryAccent to-secondaryAccent rounded-2xl shadow-lg mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primaryText mb-2">
              Create Account
            </h1>
            <p className="text-secondaryText text-sm">Register to access the Company Policy AI Assistant</p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-primaryText mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondaryText">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    data-testid="register-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-mainBg border border-border focus:border-primaryAccent focus:ring-2 focus:ring-primaryAccent/20 rounded-xl pl-11 pr-4 py-2.5 text-primaryText placeholder-secondaryText outline-none transition-all text-sm"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

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
                    data-testid="register-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-mainBg border border-border focus:border-primaryAccent focus:ring-2 focus:ring-primaryAccent/20 rounded-xl pl-11 pr-4 py-2.5 text-primaryText placeholder-secondaryText outline-none transition-all text-sm"
                    placeholder="john@company.com"
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
                    data-testid="register-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-mainBg border border-border focus:border-primaryAccent focus:ring-2 focus:ring-primaryAccent/20 rounded-xl pl-11 pr-4 py-2.5 text-primaryText placeholder-secondaryText outline-none transition-all text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Selection Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primaryText mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondaryText">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                      value={role}
                      data-testid="register-role"
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-mainBg border border-border focus:border-primaryAccent focus:ring-2 focus:ring-primaryAccent/20 rounded-xl pl-9 pr-3 py-2.5 text-primaryText outline-none transition-all text-sm cursor-pointer"
                    >
                      <option value="employee">Employee</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primaryText mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondaryText">
                      <Building className="w-4 h-4" />
                    </div>
                    <select
                      value={department}
                      data-testid="register-department"
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-mainBg border border-border focus:border-primaryAccent focus:ring-2 focus:ring-primaryAccent/20 rounded-xl pl-9 pr-3 py-2.5 text-primaryText outline-none transition-all text-sm cursor-pointer"
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
                className="w-full bg-gradient-to-r from-primaryAccent to-secondaryAccent text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-sm mt-2 disabled:opacity-50"
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
          <p className="text-center mt-6 text-secondaryText text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primaryAccent hover:text-secondaryAccent font-semibold transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-50 to-purple-50 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-secondaryAccent/10 to-primaryAccent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-indigo-100/50 to-transparent rounded-full blur-2xl" />

        <div className="relative z-10 max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primaryText mb-4">
              Join Your Team Today
            </h2>
            <p className="text-secondaryText text-lg leading-relaxed">
              Get started with instant access to all company policies and AI-powered assistance.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primaryAccent" />
              </div>
              <div>
                <h3 className="font-semibold text-primaryText mb-1">Quick Setup</h3>
                <p className="text-sm text-secondaryText">Get started in less than 2 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primaryAccent" />
              </div>
              <div>
                <h3 className="font-semibold text-primaryText mb-1">Team Collaboration</h3>
                <p className="text-sm text-secondaryText">Work seamlessly with your organization</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primaryAccent" />
              </div>
              <div>
                <h3 className="font-semibold text-primaryText mb-1">AI-Powered Insights</h3>
                <p className="text-sm text-secondaryText">Smart answers from your documents</p>
              </div>
            </div>
          </div>

          {/* Decorative Pattern */}
          <div className="absolute -bottom-12 -left-12 w-64 h-64 opacity-20">
            <div className="w-full h-full bg-gradient-to-tl from-secondaryAccent to-primaryAccent rounded-3xl -rotate-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
