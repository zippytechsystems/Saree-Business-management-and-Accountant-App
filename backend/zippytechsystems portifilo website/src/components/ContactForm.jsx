import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, Mail, AlertCircle, Phone } from 'lucide-react';
import { companyData } from '../data/companyData';

export default function ContactForm({ preselectedService = 'Web Development' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: preselectedService,
    details: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please provide your name';
    if (!formData.email.trim()) {
      errs.email = 'Please provide your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.details.trim()) {
      errs.details = 'Please briefly outline your project or requirements';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    // Client-side simulation of secure form submission without exposing private API keys
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 900);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      service: 'Web Development',
      details: ''
    });
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '2.5rem',
        borderRadius: 'var(--radius-xl)',
        position: 'relative'
      }}
    >
      {isSubmitted ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            animation: 'fadeInUp 0.3s ease-out'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}
          >
            <CheckCircle2 size={34} />
          </div>

          <h3 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Enquiry Received!</h3>

          <p style={{ color: 'var(--text-body)', maxWidth: '480px', lineHeight: 1.6 }}>
            Thank you, <strong style={{ color: 'var(--text-main)' }}>{formData.name}</strong>. We have logged your request for{' '}
            <strong style={{ color: 'var(--primary)' }}>{formData.service}</strong>. A technical lead will review your project scope and respond within 24 business hours.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <a
              href={`https://wa.me/916302690251?text=${encodeURIComponent(
                `Hello Lingaswamy, I just submitted an enquiry for ${formData.service} on your website. Name: ${formData.name}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <MessageSquare size={16} />
              <span>Continue on WhatsApp</span>
            </a>

            <button onClick={handleReset} className="btn btn-outline btn-sm">
              Send Another Enquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Name */}
            <div className="form-group">
              <label htmlFor="contact-name" className="form-label">
                <span>Full Name *</span>
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Morgan"
                className="form-input"
                aria-invalid={!!errors.name}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="contact-email" className="form-label">
                <span>Work Email *</span>
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@example.com"
                className="form-input"
                aria-invalid={!!errors.email}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Phone */}
            <div className="form-group">
              <label htmlFor="contact-phone" className="form-label">
                <span>Phone Number</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Optional</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="form-input"
              />
            </div>

            {/* Service Selection */}
            <div className="form-group">
              <label htmlFor="contact-service" className="form-label">
                <span>Service of Interest *</span>
              </label>
              <select
                id="contact-service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Web Development">Web Development</option>
                <option value="App Development">App Development</option>
                <option value="AI Automation">AI Automation</option>
                <option value="Other">Other / Full-Stack Solution</option>
              </select>
            </div>
          </div>

          {/* Project Details */}
          <div className="form-group">
            <label htmlFor="contact-details" className="form-label">
              <span>Project Details & Requirements *</span>
            </label>
            <textarea
              id="contact-details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about what you want to build, target timeline, or current automation bottlenecks..."
              className="form-textarea"
              aria-invalid={!!errors.details}
            />
            {errors.details && <span className="form-error">{errors.details}</span>}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              id="submit-enquiry-btn"
            >
              {isSubmitting ? (
                <span>Submitting Enquiry...</span>
              ) : (
                <>
                  <span>Send Enquiry</span>
                  <Send size={18} />
                </>
              )}
            </button>

            {/* Alternative Instant Channels */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <a
                href={companyData.contact.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-body)',
                  fontSize: '0.9rem',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#34d399')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-body)')}
              >
                <MessageSquare size={16} color="#34d399" />
                <span>WhatsApp Us Direct</span>
              </a>

              <span style={{ color: 'var(--text-dim)' }}>•</span>

              <a
                href={`mailto:${companyData.contact.email}?subject=Project%20Enquiry%20-%20ZippyTechSystems`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-body)',
                  fontSize: '0.9rem',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-body)')}
              >
                <Mail size={16} color="var(--primary)" />
                <span>Email Us Directly</span>
              </a>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
