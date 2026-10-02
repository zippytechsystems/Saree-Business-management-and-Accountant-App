import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Phone, MessageCircle } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onOpenQuoteModal }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleNavClick = (path, e) => {
    if (path.includes('#')) {
      const [pagePath, hash] = path.split('#');
      if (location.pathname === pagePath || (pagePath === '/' && location.pathname === '')) {
        e.preventDefault();
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          setMobileMenuOpen(false);
        }
      } else {
        navigate(path);
        setMobileMenuOpen(false);
      }
    } else {
      navigate(path);
      setMobileMenuOpen(false);
    }
  };

  const whatsappNavUrl = buildWhatsAppUrl(
    'Hi Lingaswamy, I visited ZippyTechSystems website and would like to get a quote for my business.'
  );

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-sticky)',
        height: isScrolled ? '68px' : '78px',
        transition: 'all var(--transition-normal)',
        backgroundColor: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--nav-border)',
        boxShadow: isScrolled ? '0 8px 30px rgba(0, 0, 0, 0.12)' : 'none'
      }}
    >
      <div
        className="container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* Brand Logo / Wordmark */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none'
          }}
          aria-label="ZippyTechSystems Home"
        >
          {/* Glowing Geometric Brand Monogram */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0b1b4a 0%, #1d5cf0 100%)',
              border: '1px solid rgba(255, 229, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(29, 92, 240, 0.25)',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '800',
                fontSize: '1.25rem',
                color: '#ffe500'
              }}
            >
              Z
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '800',
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-main)',
                lineHeight: 1.15
              }}
            >
              ZippyTech<span style={{ color: '#1d5cf0' }}>Systems</span>
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.04em',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              Build • Automate • Grow
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.75rem'
          }}
          className="desktop-nav"
        >
          {content.navLinks.map((link) => {
            const isContact = link.path === '/contact';
            const isAbout = link.path === '/about';
            const isProjects = link.path === '/projects';
            const isActive =
              (link.path === '/' && location.pathname === '/') ||
              (link.path.startsWith('/#') && location.pathname === '/' && location.hash === link.path.replace('/', '')) ||
              (isContact && location.pathname === '/contact') ||
              (isAbout && location.pathname === '/about') ||
              (isProjects && location.pathname === '/projects');

            return (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => handleNavClick(link.path, e)}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.92rem',
                  color: isActive ? '#1d5cf0' : 'var(--text-main)',
                  transition: 'color var(--transition-fast)'
                }}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {/* Quick Call Link (Desktop/Tablet) */}
          <a
            href={`tel:${content.founder.phone}`}
            className="btn btn-outline"
            style={{
              display: 'none',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem'
            }}
            id="nav-call-btn"
            title="Call Lingaswamy"
          >
            <Phone size={14} color="#12a150" />
            <span>{content.founder.phone}</span>
          </a>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-outline"
            style={{
              padding: '0.55rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-main)',
              lineHeight: 1
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={17} color="#ffe500" /> : <Moon size={17} color="#1d5cf0" />}
          </button>

          {/* WhatsApp Direct CTA Button */}
          <a
            href={whatsappNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-cta-yellow"
            style={{
              display: 'none',
              padding: '0.55rem 1.1rem',
              fontSize: '0.88rem'
            }}
            id="nav-whatsapp-cta"
          >
            <MessageCircle size={15} color="#0b1b4a" />
            <span>Chat on WhatsApp</span>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              padding: '0.55rem',
              borderRadius: 'var(--radius-md)'
            }}
            id="mobile-menu-trigger"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: isScrolled ? '68px' : '78px',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-glass)',
            padding: '1.5rem',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
          role="dialog"
          aria-modal="true"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {content.navLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => handleNavClick(link.path, e)}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-main)',
                  padding: '0.5rem 0'
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <a
              href={whatsappNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cta-yellow"
              style={{ width: '100%' }}
            >
              <MessageCircle size={16} />
              <span>Chat on WhatsApp ({content.founder.phone})</span>
            </a>

            <a
              href={`tel:${content.founder.phone}`}
              className="btn btn-outline"
              style={{ width: '100%' }}
            >
              <Phone size={15} color="#12a150" />
              <span>Call Lingaswamy: {content.founder.phoneFormatted}</span>
            </a>
          </div>
        </div>
      )}

      {/* Responsive media query helper for Navbar */}
      <style>{`
        @media (min-width: 860px) {
          .desktop-nav {
            display: flex !important;
          }
          #nav-whatsapp-cta {
            display: inline-flex !important;
          }
          #nav-call-btn {
            display: inline-flex !important;
          }
          #mobile-menu-trigger {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
