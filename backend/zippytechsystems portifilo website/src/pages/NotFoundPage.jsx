import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main style={{ paddingTop: 'calc(var(--navbar-height) + 4rem)', paddingBottom: '8rem', textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(29, 92, 240, 0.1)',
            color: '#1d5cf0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}
        >
          <Compass size={32} />
        </div>

        <div style={{ fontSize: '4rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#1d5cf0', lineHeight: 1 }}>
          404
        </div>

        <h1 style={{ fontSize: '2rem', marginTop: '1rem', marginBottom: '1rem' }}>
          Page Not Found
        </h1>

        <p style={{ color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '2rem' }}>
          The page or route you requested does not exist or has been moved.
        </p>

        <Link to="/" className="btn btn-cta-yellow">
          <ArrowLeft size={16} />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </main>
  );
}
