import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Building,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Calendar,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout user={user} logout={logout}>
      {/* Welcome Hero Section */}
      <div className="mb-8">
        <div className="mb-2">
          <span className="text-xs font-semibold text-primaryAccent uppercase tracking-wider">
            YOUR WORKSPACE
          </span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-primaryText mb-2">
          {getGreeting()}, {user?.name} 👋
        </h1>
        <p className="text-secondaryText text-base">
          Your intelligent workspace for company policies, compliance, and organizational knowledge.
        </p>
      </div>

      {/* Main AI Assistant Hero Card */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-8 lg:p-10 overflow-hidden shadow-sm">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primaryAccent/10 to-secondaryAccent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-full blur-2xl" />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 mb-4">
                <Sparkles className="w-4 h-4 text-primaryAccent" />
                <span className="text-xs font-semibold text-primaryAccent">AI-POWERED</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold text-primaryText mb-3">
                Your Company Policy Assistant
              </h2>

              <p className="text-secondaryText text-base mb-6 leading-relaxed">
                Get clear, reliable answers from your organization's policies, powered by AI.
              </p>

              {/* Example Question Preview */}
              <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-secondaryText mb-2 uppercase tracking-wide">
                  Try asking:
                </p>
                <p className="text-sm text-primaryText italic">
                  "What is our remote work policy?"
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/chat')}
                  data-testid="go-to-chat"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primaryAccent to-secondaryAccent text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primaryAccent/25 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Open AI Assistant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm text-primaryAccent font-semibold rounded-xl border border-purple-200 hover:bg-white transition-all"
                >
                  <span>Explore your workspace</span>
                </button>
              </div>

              {/* Source Grounding Indicator */}
              <div className="mt-6 flex items-center gap-2 text-xs text-secondaryText">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Answers reference company documents and policies</span>
              </div>
            </div>

            {/* Right Decorative Visual */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-primaryAccent to-secondaryAccent rounded-3xl opacity-10 blur-2xl animate-pulse" />
                <div className="absolute inset-8 bg-gradient-to-br from-primaryAccent to-secondaryAccent rounded-2xl opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-24 h-24 text-primaryAccent opacity-30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Account Role Card */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-primaryText">Account Role</h3>
          </div>
          <p className="text-2xl font-bold text-primaryText capitalize">{user?.role || 'Employee'}</p>
          <p className="text-xs text-secondaryText mt-1">Platform access level</p>
        </div>

        {/* Department Card */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-primaryText">Department</h3>
          </div>
          <p className="text-2xl font-bold text-primaryText">{user?.department || 'N/A'}</p>
          <p className="text-xs text-secondaryText mt-1">Your organizational unit</p>
        </div>

        {/* Security Access Card */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-primaryText">Security Access</h3>
          </div>
          <p className="text-2xl font-bold text-primaryText">RBAC & ABAC</p>
          <p className="text-xs text-secondaryText mt-1">Active security controls</p>
        </div>

        {/* Workspace Status Card */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-primaryText">Workspace Status</h3>
          </div>
          <p className="text-2xl font-bold text-primaryText">Day 12 Complete</p>
          <p className="text-xs text-secondaryText mt-1">Development progress</p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primaryAccent to-secondaryAccent flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-primaryText">{user?.name || 'User'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-1 bg-primaryAccent/10 text-primaryAccent text-xs font-semibold rounded-lg border border-primaryAccent/20 capitalize">
                {user?.role || 'Employee'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Mail className="w-5 h-5 text-secondaryText mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-1">
                Email Address
              </p>
              <p className="text-sm font-medium text-primaryText break-all">
                {user?.email || 'N/A'}
              </p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Building className="w-5 h-5 text-secondaryText mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-1">
                Department
              </p>
              <p className="text-sm font-medium text-primaryText">
                {user?.department || 'N/A'}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Shield className="w-5 h-5 text-secondaryText mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-1">
                Platform Role
              </p>
              <p className="text-sm font-medium text-primaryText capitalize">
                {user?.role || 'Employee'}
              </p>
            </div>
          </div>

          {/* Registration Date */}
          <div className="flex items-start gap-3 p-4 bg-mainBg rounded-lg">
            <Calendar className="w-5 h-5 text-secondaryText mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-1">
                Registered On
              </p>
              <p className="text-sm font-medium text-primaryText">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Information Section */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-primaryText mb-3">Account & Security</h3>
          <div className="flex items-center justify-between p-4 bg-mainBg rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-medium text-primaryText">Security Status</p>
                <p className="text-xs text-secondaryText">RBAC & ABAC authentication active</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
