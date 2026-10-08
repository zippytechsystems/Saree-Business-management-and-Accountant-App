import React from 'react';
import { Layers, Terminal, Database, Cloud, Cpu } from 'lucide-react';

const categoryIcons = {
  'Frontend Engineering': Layers,
  'Backend & APIs': Terminal,
  'Database & Storage': Database,
  'Cloud & Deployment': Cloud,
  'AI & Automation Tools': Cpu
};

export default function TechnologyCard({ group }) {
  const IconComp = categoryIcons[group.category] || Layers;

  return (
    <div
      className="glass-card"
      style={{
        padding: '2rem',
        borderRadius: 'var(--radius-xl)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        {/* Category Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: `${group.accent}15`,
                border: `1px solid ${group.accent}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: group.accent
              }}
            >
              <IconComp size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                {group.category}
              </h3>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                {group.tag}
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
          {group.description}
        </p>

        {/* Tech Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {group.items.map((tech, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)')}
            >
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  {tech.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                  {tech.description}
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: group.accent,
                  background: `${group.accent}12`,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  marginLeft: '0.75rem'
                }}
              >
                {tech.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
