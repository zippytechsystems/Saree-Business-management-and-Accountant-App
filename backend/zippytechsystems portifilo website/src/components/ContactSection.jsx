import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { content, buildEnquiryWhatsAppUrl, buildWhatsAppUrl } from '../data/content';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: 'Web Development (from ₹7,000)',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please provide your name and phone number so Lingaswamy can reply to your quote.');
      return;
    }

    const whatsappUrl = buildEnquiryWhatsAppUrl({
      name: formData.name,
      phone: formData.phone,
      service: formData.service,
      message: formData.message
    });

    setFormSubmitted(true);
    // Open WhatsApp in new tab with prefilled message
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const directWhatsAppUrl = buildWhatsAppUrl(
    'Hi Lingaswamy, I would like to get a quote and discuss a project with ZippyTechSystems.'
  );

  return (
    <section id="contact" style={{ padding: '5rem 0', background: 'var(--bg-canvas)' }} aria-labelledby="contact-heading">
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
          <span className="badge badge-yellow" style={{ marginBottom: '1rem' }}>
            START YOUR PROJECT TODAY
          </span>
          <h2 id="contact-heading" style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Get an <span style={{ color: '#12a150' }}>Instant WhatsApp Quote</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            Submit the form below to connect directly with founder Lingaswamy.
            Your message will open automatically in WhatsApp with all project specs pre-filled.
          </p>
        </div>

        {/* Contact Container Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            maxWidth: '1060px',
            margin: '0 auto'
          }}
        >
          {/* Left Column: Direct Call & Quick Connect */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>
                Direct Founder Contact
              </h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                Speak directly with <strong style={{ color: 'var(--text-main)' }}>Lingaswamy</strong>, Founder &amp; Chief Architect.
                We respond within minutes on WhatsApp during business hours.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <a
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ padding: '0.9rem', fontSize: '1rem' }}
                >
                  <MessageCircle size={18} />
                  <span>Chat on WhatsApp: {content.founder.phone}</span>
                </a>

                <a
                  href={`tel:${content.founder.phone}`}
                  className="btn btn-outline"
                  style={{ padding: '0.9rem', fontSize: '1rem' }}
                >
                  <Phone size={18} color="#12a150" />
                  <span>Call Directly: {content.founder.phoneFormatted}</span>
                </a>
              </div>
            </div>

            {/* Quick Details Card */}
            <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(29, 92, 240, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="#1d5cf0" />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Phone &amp; WhatsApp</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{content.founder.phoneFormatted}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(18, 161, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color="#12a150" />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Location</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{content.company.location}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(122, 47, 208, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} color="#7a2fd0" />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Turnaround Guarantee</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>48 Hours to 7 Days Delivery</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Zero-Backend Enquiry Form */}
          <div className="card" style={{ padding: '2.25rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Project Enquiry Form
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Fill in your requirement below. Clicking submit opens WhatsApp with your prefilled details.
            </p>

            {formSubmitted && (
              <div
                style={{
                  background: 'rgba(18, 161, 80, 0.12)',
                  border: '1px solid #12a150',
                  color: '#12a150',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Opening WhatsApp chat with Lingaswamy...</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="contact-name" className="form-label">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-phone" className="form-label">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-service" className="form-label">
                  Service Needed *
                </label>
                <select
                  id="contact-service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Web Development (from ₹7,000)">Web Development (from ₹7,000)</option>
                  <option value="App Development (from ₹10,000)">App Development (from ₹10,000)</option>
                  <option value="AI Automation (from ₹6,000)">AI Automation (from ₹6,000)</option>
                  <option value="Complete Web + App + AI Package">Complete Web + App + AI Package</option>
                  <option value="Other / Custom Software Consulting">Other / Custom Software Consulting</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contact-message" className="form-label">
                  Project Details / Requirements
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows="3"
                  placeholder="Tell us about your business, what you want to build, or your timeline..."
                  value={formData.message}
                  onChange={handleChange}
                  className="form-textarea"
                />
              </div>

              <button
                type="submit"
                className="btn btn-cta-yellow"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  marginTop: '0.5rem'
                }}
              >
                <Send size={18} />
                <span>Send Enquiry on WhatsApp</span>
              </button>

              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  textAlign: 'center',
                  marginTop: '0.85rem',
                  marginBottom: 0
                }}
              >
                ⚡ No backend or database required — opens directly in your WhatsApp app or web.
              </p>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
}
