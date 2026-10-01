import React, { memo } from 'react';
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
} from 'lucide-react';

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

export const DesktopSidebar = memo(function DesktopSidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Store size={20} />
        </div>
        <div>
          <div className="brand-title">Business ERP</div>
          <div className="brand-subtitle">V1.0 • Production</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
});

export const MobileBottomNav = memo(function MobileBottomNav({ activeTab, onSelectTab }) {
  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
            aria-label={item.label}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
});

