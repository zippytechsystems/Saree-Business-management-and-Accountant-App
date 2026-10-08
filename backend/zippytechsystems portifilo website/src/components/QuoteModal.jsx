import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { content, buildEnquiryWhatsAppUrl } from '../data/content';

export default function QuoteModal({ isOpen, onClose, defaultService = 'Web Development' }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: defaultService,
    details: ''
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, service: defaultService }));
  }, [defaultService]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please fill in your name and phone number.');
      return;
    }

    const whatsappUrl = buildEnquiryWhatsAppUrl({
      name: formData.name,
      phone: formData.phone,
      service: formData.service,
      message: formData.details
    });

    setSubmitted(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(7, 12, 30, 0.75)',
          backdropFilter: 'blur(8px)'
        }}
      />

      {/* Modal Dialog */}
      <div
        className="card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.25rem',
          zIndex: 1,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-glass-hover)'
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '4px'
          }}
          aria-label="Close quote modal"
        >
          <X size={20} />
        </button>

        <span className="badge badge-yellow" style={{ marginBottom: '0.75rem' }}>
          FAST ESTIMATE
        </span>
        <h3 id="modal-title" style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          Request a Project Quote
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Connect directly with founder <strong style={{ color: 'var(--text-main)' }}>Lingaswamy</strong>.
          Submitting opens WhatsApp with your prefilled specifications.
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(18, 161, 80, 0.15)',
                color: '#12a150',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>WhatsApp Chat Initiated!</h4>
            <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              Your requirements have been prefilled in WhatsApp. Lingaswamy will respond shortly.
            </p>
            <button onClick={handleClose} className="btn btn-outline" style={{ width: '100%' }}>
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="modal-name" className="form-label">Your Name *</label>
              <input
                type="text"
                id="modal-name"
                required
                className="form-input"
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modal-phone" className="form-label">Phone / WhatsApp Number *</label>
              <input
                type="tel"
                id="modal-phone"
                required
                className="form-input"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modal-service" className="form-label">Service Domain *</label>
              <select
                id="modal-service"
                className="form-select"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              >
                <option value="Web Development (from ₹6,500)">Web Development (from ₹6,500)</option>
                <option value="App Development (from ₹20,000)">App Development (from ₹20,000)</option>
                <option value="AI Automation (from ₹7,500)">AI Automation (from ₹7,500)</option>
                <option value="Custom Business Software Suite">Custom Business Software Suite</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modal-details" className="form-label">Project Brief (Optional)</label>
              <textarea
                id="modal-details"
                rows="3"
                className="form-textarea"
                placeholder="Describe what features you need or your business type..."
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-cta-yellow"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
            >
              <MessageCircle size={18} />
              <span>Send via WhatsApp</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
