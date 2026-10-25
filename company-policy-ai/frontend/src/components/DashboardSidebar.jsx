import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  FolderOpen,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const DashboardSidebar = ({ user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      active: location.pathname === '/dashboard',
    },
    {
      name: 'AI Policy Assistant',
      icon: MessageSquare,
      path: '/chat',
      active: location.pathname === '/chat',
    },
    {
      name: 'My Profile',
      icon: User,
      path: '/profile',
      active: location.pathname === '/profile',
    },
  ];

  // Add Policy Library for admin/hr
  if (user?.role === 'admin' || user?.role === 'hr') {
    navigationItems.push({
      name: 'Policy Library',
      icon: FolderOpen,
      path: '/admin/documents',
      active: location.pathname === '/admin/documents',
    });
  }

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const NavContent = () => (
    <>
      {/* Logo and Brand */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primaryAccent to-secondaryAccent rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-primaryText tracking-tight">
              Company Policy AI
            </h1>
            <p className="text-xs text-secondaryText">Assistant Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${item.active
                ? 'bg-primaryAccent text-white shadow-sm'
                : 'text-secondaryText hover:bg-border hover:text-primaryText'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Account Section */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-mainBg">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primaryAccent to-secondaryAccent flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primaryText truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-secondaryText capitalize truncate">
              {user?.role || 'Employee'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-secondaryText hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-border"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-primaryText" />
        ) : (
          <Menu className="w-5 h-5 text-primaryText" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-border flex flex-col z-40 transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <NavContent />
      </aside>
    </>
  );
};

export default DashboardSidebar;
