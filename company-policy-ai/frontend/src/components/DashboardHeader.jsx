import React from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

const DashboardHeader = ({ user }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="bg-white border-b border-border px-6 py-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Side - Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-secondaryText">Dashboard</span>
          <ChevronRight className="w-4 h-4 text-secondaryText" />
          <span className="text-primaryText font-medium">Overview</span>
        </div>

        {/* Right Side - Status and User */}
        <div className="flex items-center gap-4">
          {/* System Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">All systems operational</span>
          </div>

          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primaryAccent to-secondaryAccent flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
