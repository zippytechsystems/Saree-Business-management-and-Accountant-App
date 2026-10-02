import React, { useState } from 'react';
import { ExternalLink, MessageCircle, ArrowUpRight } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'All Projects' },
    { id: 'web', label: 'Web Development' },
    { id: 'app', label: 'App Development' },
    { id: 'ai', label: 'AI Automation' }
  ];

  const filteredProjects =
    activeFilter === 'all'
      ? content.projects
      : content.projects.filter((p) => p.domain === activeFilter);

  return (
    <section id="projects" style={{ padding: '5rem 0', background: 'var(--bg-surface)' }} aria-labelledby="portfolio-heading">
      <div className="container">
        
        {/* Section Heading */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem auto' }}>
          <span className="badge badge-web" style={{ marginBottom: '1rem' }}>
            PROVEN WORK &amp; CASE STUDIES
          </span>
          <h2 id="portfolio-heading" style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Selected <span style={{ color: '#12a150' }}>Projects &amp; Solutions</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            Real-world systems delivered for retail shops, clinics, manufacturers, and growing SMBs across India.
            Easily customizable for your own business workflow.
          </p>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            marginBottom: '3rem'
          }}
          role="tablist"
          aria-label="Filter projects by domain"
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className="btn"
                role="tab"
                aria-selected={isActive}
                style={{
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? '1px solid var(--brand-blue)' : '1px solid var(--border-subtle)',
                  background: isActive ? 'var(--brand-blue)' : 'var(--bg-canvas)',
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? '0 4px 14px var(--domain-web-glow)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Projects Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}
        >
          {filteredProjects.map((project) => {
            const isWeb = project.domain === 'web';
            const isApp = project.domain === 'app';
            const isAI = project.domain === 'ai';
            const tagClass = isWeb ? 'badge-web' : isApp ? 'badge-app' : 'badge-ai';

            const projectInquiryUrl = buildWhatsAppUrl(
              `Hi Lingaswamy, I saw the "${project.title}" project on your portfolio. Can you build a similar solution for my business?`
            );

            return (
              <article
                key={project.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {/* Visual Image Preview */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 10',
                    background: 'var(--bg-surface-elevated)',
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />

                  {/* Domain Tag Overlay */}
                  <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                    <span className={`badge ${tagClass}`} style={{ backdropFilter: 'blur(8px)' }}>
                      {project.domainLabel}
                    </span>
                  </div>

                  {/* Impact Metric Pill */}
                  {project.metrics && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(7, 12, 30, 0.85)',
                        color: '#ffe500',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(255, 229, 0, 0.3)',
                        backdropFilter: 'blur(6px)'
                      }}
                    >
                      ⚡ {project.metrics}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 0 auto'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.35rem'
                    }}
                  >
                    {project.clientCategory}
                  </span>

                  <h3
                    style={{
                      fontSize: '1.25rem',
                      marginBottom: '0.75rem',
                      fontWeight: 700,
                      lineHeight: 1.3
                    }}
                  >
                    {project.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.92rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.5,
                      marginBottom: '1.25rem',
                      flex: '1 0 auto'
                    }}
                  >
                    {project.shortDescription}
                  </p>

                  {/* Technology Tags */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      marginBottom: '1.5rem'
                    }}
                  >
                    {project.technologies.slice(0, 4).map((tech, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-glass-subtle)',
                          color: 'var(--text-body)',
                          border: '1px solid var(--border-subtle)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* WhatsApp Action Button */}
                  <a
                    href={projectInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      fontSize: '0.9rem',
                      justifyContent: 'center'
                    }}
                  >
                    <MessageCircle size={16} color="#12a150" />
                    <span>Inquire About Similar Build</span>
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
