import React from 'react';
import { Store, Calendar, Lock } from 'lucide-react';

export default function Header({ businessProfile, user, onLogout }) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const nickname = businessProfile?.business_nickname || user?.username || 'Owner';
  const businessName = businessProfile?.business_name || 'Business Management App';

  return (
    <header className="top-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Store size={20} />
        </div>
        <div>
          <div className="brand-title">Welcome back, {nickname}</div>
          <div className="brand-subtitle">Business: {businessName}</div>
        </div>
      </div>

      <div className="header-meta">
        <div className="badge-date">
          <Calendar size={13} />
          <span>{currentDate}</span>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="btn-lock-header"
            title="Lock & Logout (లాగౌట్ - సీక్రెట్ మోడ్)"
            aria-label="Lock App"
          >
            <Lock size={13} />
            <span>Lock</span>
          </button>
        )}
      </div>
    </header>
  );
}
