import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Heart, Shield, Instagram, Youtube, Mail, Facebook, Linkedin } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';
import { useData } from '../context/DataContext';
import { useQualityTier } from '../context/QualityTierContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { settingsData } = useData() || {};
  const { tier, toggleReducedMotion } = useQualityTier();


  const rawPhone = settingsData?.phone || content.founder.phone || '6302690251';
  const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '').replace(/^91/, '');
  const phoneFormatted = cleanPhone.length === 10
    ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
    : (settingsData?.phoneFormatted || content.founder.phoneFormatted || `+91 ${cleanPhone}`);

  const rawWa = settingsData?.whatsappNumber || content.founder.whatsappNumber || '6302690251';
  const cleanWa = String(rawWa).replace(/[^0-9]/g, '');
  const whatsappNumber = cleanWa.startsWith('91') ? cleanWa : `91${cleanWa}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    settingsData?.defaultWhatsAppMessage || 'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.'
  )}`;

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
                {settingsData?.tagline || content.company.tagline}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
              Founder: <strong>{settingsData?.founderName || content.founder.name || 'Lingaswamy Maddeboina'}</strong>
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
                <span>WhatsApp: {phoneFormatted}</span>
              </a>

              <a
                href={`tel:+91${cleanPhone}`}
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
                <span>Call: {phoneFormatted}</span>
              </a>

              {settingsData?.email && (
                <a
                  href={`mailto:${settingsData.email}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontSize: '0.92rem',
                    color: '#ffffff'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 229, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={16} color="#ffe500" />
                  </div>
                  <span>Email: {settingsData.email}</span>
                </a>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.88rem', color: '#94a3b8' }}>
                <MapPin size={16} color="#ffe500" />
                <span>{settingsData?.location || content.company.location}</span>
              </div>

              {/* Social links (only shown if present in settings) */}
              {(settingsData?.instagramUrl || settingsData?.youtubeUrl || settingsData?.facebookUrl || settingsData?.linkedinUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                  {settingsData?.instagramUrl && (
                    <a
                      href={settingsData.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#e1306c')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      title="Follow on Instagram"
                      aria-label="Instagram"
                    >
                      <Instagram size={18} strokeWidth={1.75} />
                      <span>Instagram</span>
                    </a>
                  )}

                  {settingsData?.youtubeUrl && (
                    <a
                      href={settingsData.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ff0000')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      title="Subscribe on YouTube"
                      aria-label="YouTube"
                    >
                      <Youtube size={18} strokeWidth={1.75} />
                      <span>YouTube</span>
                    </a>
                  )}

                  {settingsData?.facebookUrl && (
                    <a
                      href={settingsData.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#1877f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      title="Follow on Facebook"
                      aria-label="Facebook"
                    >
                      <Facebook size={18} strokeWidth={1.75} />
                      <span>Facebook</span>
                    </a>
                  )}

                  {settingsData?.linkedinUrl && (
                    <a
                      href={settingsData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0a66c2')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      title="Connect on LinkedIn"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={18} strokeWidth={1.75} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              )}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Engineered with pride in India for Indian Businesses
            </span>
            <Link to="/privacy" style={{ color: '#94a3b8' }}>Privacy</Link>
            <Link to="/terms" style={{ color: '#94a3b8' }}>Terms</Link>

            {/* Accessible Motion Toggle */}
            <button
              onClick={toggleReducedMotion}
              type="button"
              aria-label={`Motion is currently ${tier === 'reduced' ? 'reduced' : 'active'}. Click to toggle.`}
              title="Toggle animations and motion"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.78rem',
                color: tier === 'reduced' ? '#ffe500' : '#94a3b8',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: tier === 'reduced' ? '#94a3b8' : '#12a150',
                  display: 'inline-block'
                }}
              />
              <span>Motion: {tier === 'reduced' ? 'Off' : 'On'}</span>
            </button>

            {/* Subtle bottom social icons */}
            {settingsData?.instagramUrl && (
              <a
                href={settingsData.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e1306c')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            )}
            {settingsData?.youtubeUrl && (
              <a
                href={settingsData.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ff0000')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            )}
            {settingsData?.facebookUrl && (
              <a
                href={settingsData.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1877f2')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            )}
            {settingsData?.linkedinUrl && (
              <a
                href={settingsData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0a66c2')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            )}

            {/* Discreet Admin link */}
            <Link
              to="/admin"
              style={{
                color: '#475569',
                fontSize: '0.68rem',
                textDecoration: 'none',
                opacity: 0.3,
                transition: 'opacity 0.2s ease',
                letterSpacing: '0.02em',
                userSelect: 'none',
                padding: '2px 4px'
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.target.style.opacity = '0.3')}
              title="Admin Portal"
            >
              admin
            </Link>
          </div>
        </div>

        {/* Tiny subtle right-side anchor for owner convenience without drawing public attention */}
        <Link
          to="/admin"
          style={{
            position: 'fixed',
            right: '6px',
            bottom: '6px',
            fontSize: '9px',
            color: '#94a3b8',
            opacity: 0.18,
            textDecoration: 'none',
            zIndex: 40,
            userSelect: 'none',
            letterSpacing: '0.02em'
          }}
          onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.target.style.opacity = '0.18')}
          aria-label="Admin"
        >
          admin
        </Link>
      </div>
    </footer>
  );
}
