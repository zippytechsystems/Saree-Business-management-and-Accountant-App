import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { content, buildEnquiryWhatsAppUrl, buildWhatsAppUrl } from '../data/content';
import { useData } from '../context/DataContext';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Web Development (from ₹7,000)',
    message: '',
    whatsappOptIn: true,
    honeypot: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const { saveEnquiry, settingsData, domainsData, formatINR } = useData();

  const rawPhone = settingsData?.phone || content.founder.phone || '6302690251';
  const cleanActivePhone = String(rawPhone).replace(/[^0-9]/g, '').replace(/^91/, '');
  const activePhoneFormatted = cleanActivePhone.length === 10
    ? `+91 ${cleanActivePhone.slice(0, 5)} ${cleanActivePhone.slice(5)}`
    : (settingsData?.phoneFormatted || content.founder.phoneFormatted || `+91 ${cleanActivePhone}`);

  const rawWhatsApp = settingsData?.whatsappNumber || content.founder.whatsappNumber || '6302690251';
  const cleanDigitsWa = String(rawWhatsApp).replace(/[^0-9]/g, '');
  const activeWhatsApp = cleanDigitsWa.startsWith('91') ? cleanDigitsWa : `91${cleanDigitsWa}`;
  const responseTime = settingsData?.responseTimeText || '24 hours';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter your name.');
      return;
    }

    const cleanDigits = formData.phone.replace(/[^0-9]/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!cleanDigits || cleanDigits.length !== 10 || !mobileRegex.test(cleanDigits)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    // 1. Save to Supabase (or local fallback)
    try {
      await saveEnquiry({
        name: formData.name.trim(),
        phone: cleanDigits,
        email: formData.email.trim(),
        service: formData.service,
        message: formData.message.trim(),
        source: 'contact',
        whatsappOptIn: formData.whatsappOptIn,
        honeypot: formData.honeypot
      });
    } catch (err) {
      console.warn('Error saving enquiry to database:', err);
    }

    // 2. Open WhatsApp with prefilled message
    const waNumber = activeWhatsApp.startsWith('91') ? activeWhatsApp : `91${activeWhatsApp}`;
    const prefillText = encodeURIComponent(`*New Project Enquiry — ZippyTechSystems*
-----------------------------
👤 *Name:* ${formData.name.trim()}
📱 *Phone:* ${cleanDigits}
${formData.email.trim() ? `✉️ *Email:* ${formData.email.trim()}\n` : ''}🛠️ *Service Needed:* ${formData.service}
💬 *Project Details:* ${formData.message.trim() || 'I would like more information and a price quote.'}
-----------------------------
(Sent from zippytechsystems.com portfolio website)`);

    const whatsappUrl = `https://wa.me/${waNumber}?text=${prefillText}`;

    setFormSubmitted(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const founderName = settingsData?.founderName || 'Lingaswamy Maddeboina';
  const founderFirstName = founderName.split(' ')[0];

  const directWhatsAppUrl = `https://wa.me/${activeWhatsApp.startsWith('91') ? activeWhatsApp : `91${activeWhatsApp}`}?text=${encodeURIComponent(
    `Hi ${founderFirstName}, I would like to get a quote and discuss a project with ZippyTechSystems.`
  )}`;

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
            Submit the form below to connect directly with founder {founderName}.
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
                Speak directly with <strong style={{ color: 'var(--text-main)' }}>{founderName}</strong>, Founder &amp; Chief Architect.
                We respond within minutes on WhatsApp during business hours.
              </p>

              {/* Action Buttons: WhatsApp, Call, Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <a
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{ padding: '0.9rem', fontSize: '1rem' }}
                >
                  <MessageCircle size={18} />
                  <span>Chat on WhatsApp: {activePhoneFormatted}</span>
                </a>

                <a
                  href={`tel:+91${cleanActivePhone}`}
                  className="btn btn-outline"
                  style={{ padding: '0.9rem', fontSize: '1rem' }}
                >
                  <Phone size={18} color="#12a150" />
                  <span>Call Directly: {activePhoneFormatted}</span>
                </a>

                {settingsData?.email && settingsData.email.trim() && (
                  <a
                    href={`mailto:${settingsData.email.trim()}?subject=Project%20Enquiry%20-%20ZippyTechSystems`}
                    className="btn btn-outline"
                    style={{ padding: '0.9rem', fontSize: '1rem' }}
                  >
                    <Mail size={18} color="#1d5cf0" />
                    <span>Email us: {settingsData.email.trim()}</span>
                  </a>
                )}
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
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{activePhoneFormatted}</div>
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

            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.9rem'
                }}
              >
                {formError}
              </div>
            )}

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

              {/* Anti-spam honeypot */}
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleChange}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="form-group">
                <label htmlFor="contact-email" className="form-label">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  placeholder="e.g. ramesh@example.com (for quote PDF)"
                  value={formData.email}
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
                  {domainsData && domainsData.length > 0 ? (
                    domainsData.map((d) => (
                      <option key={d.key || d.id} value={`${d.name} (${d.price_label || 'from'} ${formatINR(d.starting_price)})`}>
                        {d.name} ({d.price_label || 'from'} {formatINR(d.starting_price)})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Web Development (from ₹7,000)">Web Development (from ₹7,000)</option>
                      <option value="App Development (from ₹10,000)">App Development (from ₹10,000)</option>
                      <option value="AI Automation (from ₹6,000)">AI Automation (from ₹6,000)</option>
                    </>
                  )}
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1.25rem' }}>
                <input
                  type="checkbox"
                  name="whatsappOptIn"
                  checked={formData.whatsappOptIn}
                  onChange={handleChange}
                  style={{ width: '16px', height: '16px', accentColor: '#12a150', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  I agree to be contacted on WhatsApp about my enquiry
                </span>
              </label>

              <button
                type="submit"
                className="btn btn-cta-yellow"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  marginTop: '0.25rem'
                }}
              >
                <Send size={18} />
                <span>Send Enquiry on WhatsApp</span>
              </button>

              <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(29, 92, 240, 0.06)', borderRadius: '8px', border: '1px solid rgba(29, 92, 240, 0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1d5cf0' }}>
                  ⚡ We will contact you within {responseTime}.
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Saved to database and opens directly in WhatsApp for instant verification.
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
}
