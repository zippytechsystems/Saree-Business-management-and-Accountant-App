import React, { memo, useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Receipt,
  BookOpenCheck,
  HandCoins,
  Calculator,
  FileSpreadsheet,
  Settings,
  Store,
  MoreHorizontal,
} from 'lucide-react';
import Modal from '../common/Modal';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'today-sales', label: 'Today Sales', icon: TrendingUp },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'accountant', label: 'Accountant', icon: BookOpenCheck },
  { id: 'lenders', label: 'Lenders', icon: HandCoins },
  { id: 'calculations', label: 'Calculations', icon: Calculator },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Primary 4 tabs for mobile bottom navigation bar
export const MOBILE_PRIMARY_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'today-sales', label: 'Sales', icon: TrendingUp },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
];

export const DesktopSidebar = memo(function DesktopSidebar({ activeTab, onSelectTab }) {
  const activeIndex = NAV_ITEMS.findIndex((item) => item.id === activeTab);

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Store size={20} />
        </div>
        <div>
          <div className="brand-title">Saree Business ERP</div>
          <div className="brand-subtitle">Management &amp; Accountant App</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main Navigation">
        <div className="sidebar-nav-inner">
          {/* Sliding active pill indicator (transform only) */}
          {activeIndex !== -1 && (
            <div
              className="sidebar-active-pill"
              style={{
                transform: `translateY(${activeIndex * 48}px)`,
              }}
              aria-hidden="true"
            />
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
});

export const MobileBottomNav = memo(function MobileBottomNav({ activeTab, onSelectTab }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMoreActive = !MOBILE_PRIMARY_TABS.some((tab) => tab.id === activeTab);

  const secondaryTabs = NAV_ITEMS.filter(
    (item) => !MOBILE_PRIMARY_TABS.some((primary) => primary.id === item.id)
  );

  const handleSelectMoreTab = (tabId) => {
    onSelectTab(tabId);
    setIsMoreOpen(false);
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        {MOBILE_PRIMARY_TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon-box">
                <Icon size={20} />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
              {isActive && <div className="bottom-nav-dot" aria-hidden="true" />}
            </button>
          );
        })}

        {/* 5th Tab: More Button */}
        <button
          type="button"
          className={`bottom-nav-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => setIsMoreOpen(true)}
          aria-label="More options"
          aria-expanded={isMoreOpen}
        >
          <div className="bottom-nav-icon-box">
            <MoreHorizontal size={20} />
          </div>
          <span className="bottom-nav-label">More</span>
          {isMoreActive && <div className="bottom-nav-dot" aria-hidden="true" />}
        </button>
      </nav>

      {/* More Options Bottom-Sheet Modal */}
      <Modal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="More Management Options"
      >
        <div className="more-menu-grid">
          {secondaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`more-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectMoreTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="more-menu-icon">
                  <Icon size={22} />
                </div>
                <span className="more-menu-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
});
