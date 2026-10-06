import React from 'react';
import { ArrowUpRight, Code, Database, Cpu, Layers } from 'lucide-react';

export default function ProjectCard({ project, onSelectProject }) {
  // Determine badge colors based on project type
  const isDemo = project.type === 'Demo Project';
  const isInternal = project.type === 'Internal Project';

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        height: '100%'
      }}
    >
      <div>
        {/* Project Visual / Interactive Header Canvas */}
        <div
          style={{
            height: '190px',
            background: `radial-gradient(circle at 80% 20%, ${project.accentColor}25 0%, rgba(10, 15, 26, 0.95) 75%)`,
            borderBottom: '1px solid var(--border-glass)',
            position: 'relative',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Grid Pattern Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none'
            }}
          />

          {/* Top Label & Category */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 1
            }}
          >
            <span
              className="badge"
              style={{
                background: isDemo
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isInternal
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'rgba(0, 242, 254, 0.15)',
                color: isDemo ? '#34d399' : isInternal ? '#c4b5fd' : '#38bdf8',
                border: `1px solid ${project.accentColor}40`,
                fontSize: '0.72rem',
                fontWeight: '700'
              }}
            >
              {project.type}
            </span>

            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              {project.filterCategory}
            </span>
          </div>

          {/* Project Center Graphic Concept */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            <div
              style={{
                padding: '0.6rem 1.25rem',
                background: 'rgba(10, 15, 26, 0.95)',
                border: `1px solid ${project.accentColor}40`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px ${project.accentColor}15`
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: project.accentColor,
                  boxShadow: `0 0 8px ${project.accentColor}`
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'var(--text-main)'
                }}
              >
                {project.category}
              </span>
            </div>
          </div>

          {/* Bottom Metatag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 1,
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)'
            }}
          >
            <span>ARCH: MODULAR</span>
            <span>•</span>
            <span>VERIFIED CONCEPT</span>
          </div>
        </div>

        {/* Project Content Body */}
        <div style={{ padding: '1.75rem' }}>
          <h3
            style={{
              fontSize: '1.3rem',
              marginBottom: '0.65rem',
              color: 'var(--text-main)',
              lineHeight: 1.3
            }}
          >
            {project.title}
          </h3>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-body)',
              lineHeight: 1.6,
              marginBottom: '1.5rem'
            }}
          >
            {project.shortDescription}
          </p>

          {/* Technology Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.45rem',
              marginBottom: '1.5rem'
            }}
          >
            {project.technologies.slice(0, 4).map((tech, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-dim)',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-dim)',
                  padding: '0.25rem 0.4rem'
                }}
              >
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div
        style={{
          padding: '0 1.75rem 1.75rem 1.75rem'
        }}
      >
        <button
          onClick={() => onSelectProject(project)}
          className="btn btn-secondary"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <span>View Project Blueprint</span>
          <ArrowUpRight size={16} color={project.accentColor} />
        </button>
      </div>
    </div>
  );
}
