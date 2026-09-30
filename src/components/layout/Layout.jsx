import React from 'react';
import Header from './Header';
import { DesktopSidebar, MobileBottomNav } from './Navigation';

export default function Layout({ activeTab, onSelectTab, businessProfile, user, onLogout, children }) {
  return (
    <div className="app-container">
      <DesktopSidebar activeTab={activeTab} onSelectTab={onSelectTab} />
      
      <div className="main-content">
        <Header businessProfile={businessProfile} user={user} onLogout={onLogout} />
        <main className="page-container">{children}</main>
        <MobileBottomNav activeTab={activeTab} onSelectTab={onSelectTab} />
      </div>
    </div>
  );
}
