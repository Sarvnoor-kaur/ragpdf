import React from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

const DashboardLayout = ({ children, user, logout }) => {
  return (
    <div className="flex min-h-screen bg-mainBg">
      {/* Sidebar */}
      <DashboardSidebar user={user} logout={logout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-64">
        {/* Header */}
        <DashboardHeader user={user} logout={logout} />

        {/* Page Content */}
        <main className="flex-1 px-6 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
