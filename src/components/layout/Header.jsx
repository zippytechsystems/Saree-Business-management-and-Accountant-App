import React, { useState, useEffect, memo } from 'react';
import { Store, Calendar, Lock, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header = memo(function Header({ businessProfile, user, onLogout }) {
  const { isDark, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  // Smooth shrink and elevated shadow on scroll
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 12);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const nickname = businessProfile?.business_nickname || user?.username || 'Owner';
  const businessName = businessProfile?.business_name || 'Business Management App';

  return (
    <header className={`top-header ${isScrolled ? 'top-header-scrolled' : ''}`}>
      <div className="header-brand">
        <div className="brand-icon">
          <Store size={20} />
        </div>
        <div className="header-brand-info">
          <div className="brand-title">Welcome back, {nickname}</div>
          <div className="brand-subtitle">Business: {businessName}</div>
        </div>
      </div>

      <div className="header-meta">
        <div className="badge-date">
          <Calendar size={13} />
          <span>{currentDate}</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="btn-theme-toggle"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {onLogout && (
          <button
            type="button"
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
});

export default Header;
