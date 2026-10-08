import React, { useState } from 'react';
import { companyData } from '../data/companyData';
import { Compass, FileCode2, Hammer, ShieldCheck, Rocket } from 'lucide-react';

const stepIcons = [Compass, FileCode2, Hammer, ShieldCheck, Rocket];

export default function ProcessTimeline() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div style={{ position: 'relative' }}>
      {/* Horizontal connector line for large screens */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          position: 'relative'
        }}
      >
        {companyData.processSteps.map((step, idx) => {
          const IconComp = stepIcons[idx] || Compass;
          const isSelected = activeStep === idx;

          return (
            <div
              key={step.number}
              onClick={() => setActiveStep(idx)}
              className="glass-card"
              style={{
                padding: '2rem 1.5rem',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--border-accent-cyan)' : 'var(--border-glass)',
                backgroundColor: isSelected ? 'rgba(22, 32, 53, 0.9)' : 'var(--bg-card)',
                boxShadow: isSelected ? '0 10px 30px rgba(0, 242, 254, 0.15)' : 'var(--shadow-card)',
                transition: 'all var(--transition-normal)'
              }}
            >
              {/* Step number badge & icon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: isSelected ? 'var(--primary)' : 'var(--text-dim)'
                  }}
                >
                  {step.number}
                </span>

                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  <IconComp size={18} />
                </div>
              </div>

              {/* Title */}
              <h4
                style={{
                  fontSize: '1.15rem',
                  marginBottom: '0.5rem',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  fontWeight: '700'
                }}
              >
                {step.title}
              </h4>

              {/* Summary */}
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-body)',
                  lineHeight: 1.55,
                  marginBottom: '1rem'
                }}
              >
                {step.summary}
              </p>

              {/* Extended Details */}
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-dim)',
                  lineHeight: 1.5,
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {step.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
