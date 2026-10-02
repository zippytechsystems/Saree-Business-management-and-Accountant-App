import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Heart, Shield } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <footer
      style={{
        background: '#070b1a',
        color: '#f8fafc',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '4.5rem',
        paddingBottom: '2.5rem'
      }}
    >
      <div className="container">
        
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem'
          }}
        >
          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0b1b4a 0%, #1d5cf0 100%)',
                  border: '1px solid rgba(255, 229, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: '#ffe500',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem'
                }}
              >
                Z
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                  ZippyTech<span style={{ color: '#1d5cf0' }}>Systems</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Pvt. Ltd.
                </div>
              </div>
            </Link>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              {content.company.positioning}
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-yellow" style={{ fontSize: '0.78rem' }}>
                {content.company.tagline}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
              Founder: <strong>{content.founder.name}</strong>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Services &amp; Pricing
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {content.footerLinks.services.map((item, idx) => (
                <a
                  key={idx}
                  href={item.path}
                  style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                    transition: 'color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#ffe500')}
                  onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Quick Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {content.footerLinks.quickLinks.map((item, idx) => (
                <a
                  key={idx}
                  href={item.path}
                  style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                    transition: 'color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#1d5cf0')}
                  onMouseLeave={(e) => (e.target.style.color = '#94a3b8')}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact Direct */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Connect Directly
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  fontSize: '0.92rem',
                  color: '#ffffff'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(18, 161, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={16} color="#12a150" />
                </div>
                <span>WhatsApp: {content.founder.phone}</span>
              </a>

              <a
                href={`tel:${content.founder.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  fontSize: '0.92rem',
                  color: '#ffffff'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(29, 92, 240, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={16} color="#1d5cf0" />
                </div>
                <span>Call: {content.founder.phoneFormatted}</span>
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.88rem', color: '#94a3b8' }}>
                <MapPin size={16} color="#ffe500" />
                <span>{content.company.location}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.85rem',
            color: '#64748b'
          }}
        >
          <div>
            &copy; {currentYear} {content.company.name}. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Engineered with pride in India for Indian Businesses
            </span>
            <Link to="/privacy" style={{ color: '#94a3b8' }}>Privacy</Link>
            <Link to="/terms" style={{ color: '#94a3b8' }}>Terms</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
