import React from 'react';
import { Sliders, Cpu, Layout, Layers, Sparkles, ShieldCheck } from 'lucide-react';

const iconMap = {
  Sliders: Sliders,
  Cpu: Cpu,
  Layout: Layout,
  Layers: Layers,
  Sparkles: Sparkles,
  ShieldCheck: ShieldCheck
};

export default function WhyUsCard({ item, index }) {
  const IconComponent = iconMap[item.icon] || Cpu;

  return (
    <div
      className="glass-card"
      style={{
        padding: '2rem 1.75rem',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
      }}
    >
      <div>
        {/* Icon & Index */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <IconComponent size={22} />
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--text-dim)',
              fontWeight: '600'
            }}
          >
            0{index + 1}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            marginBottom: '0.75rem',
            color: 'var(--text-main)',
            fontWeight: '700'
          }}
        >
          {item.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--text-body)',
            lineHeight: 1.6
          }}
        >
          {item.description}
        </p>
      </div>
    </div>
  );
}
