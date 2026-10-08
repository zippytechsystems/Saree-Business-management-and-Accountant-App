import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { createEnquiry } from '../lib/api';
import {
  Globe,
  Smartphone,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Send,
  MessageCircle,
  Clock,
  ShieldCheck,
  Check,
  Building,
  Calendar,
  Wallet
} from 'lucide-react';

export default function ServiceSelectionBuilder() {
  const {
    domainsData,
    servicesData,
    getDomainPrice,
    settingsData
  } = useData();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [businessType, setBusinessType] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [timeline, setTimeline] = useState('');
  const [projectNotes, setProjectNotes] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [honeypot, setHoneypot] = useState('');

  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);

  // Group services by domain
  const webServices = servicesData.filter((s) => s.domain === 'web' || s.domain_id === 'web');
  const appServices = servicesData.filter((s) => s.domain === 'app' || s.domain_id === 'app');
  const aiServices = servicesData.filter((s) => s.domain === 'ai' || s.domain_id === 'ai');

  const toggleService = (serviceName) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const validateContact = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Please enter your name.');
      valid = false;
    } else {
      setNameError('');
    }

    const clean = phone.replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!clean || clean.length !== 10 || !mobileRegex.test(clean)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      valid = false;
    } else {
      setPhoneError('');
    }

    return valid;
  };

  const handleNextFromStep1 = () => {
    if (selectedServices.length === 0) {
      alert('Please select at least one service to continue.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    if (validateContact()) {
      setCurrentStep(4);
    }
  };

  const executeSubmission = async (sendToWhatsApp = false) => {
    setIsSubmitting(true);
    const cleanPhone = phone.replace(/\D/g, '');

    const compiledNotes = [
      businessType ? `Business Type: ${businessType}` : '',
      budgetRange ? `Budget Range: ${budgetRange}` : '',
      timeline ? `Expected Timeline: ${timeline}` : '',
      projectNotes ? `Client Notes: ${projectNotes}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const primaryService = selectedServices[0] || 'Custom Project Package';

    const payload = {
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      service: primaryService,
      message: `Project Enquiry for ${selectedServices.length} service(s):\n${selectedServices.join(', ')}\n\n${compiledNotes}`,
      selectedServices,
      notes: compiledNotes,
      source: 'project',
      whatsappOptIn,
      honeypot
    };

    const res = await createEnquiry(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitSuccess(true);
      setSubmissionData(payload);

      if (sendToWhatsApp) {
        const rawWaNumber = settingsData?.whatsappNumber || '6302690251';
        const cleanWa = String(rawWaNumber).replace(/\D/g, '');
        const lines = [
          'Hello Lingaswamy, I selected services on ZippyTechSystems website:',
          '',
          `*Name:* ${name.trim()}`,
          `*Phone:* ${cleanPhone}`,
          email.trim() ? `*Email:* ${email.trim()}` : '',
          businessType ? `*Business:* ${businessType}` : '',
          budgetRange ? `*Budget:* ${budgetRange}` : '',
          timeline ? `*Timeline:* ${timeline}` : '',
          '',
          '*Selected Services:*',
          ...selectedServices.map((s) => `• ${s}`),
          '',
          projectNotes ? `*Notes:* ${projectNotes}` : '',
          '',
          'Please share detailed pricing and next steps.'
        ].filter(Boolean);

        const waUrl = `https://wa.me/91${cleanWa}?text=${encodeURIComponent(lines.join('\n'))}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      alert(res.error || 'Failed to submit enquiry. Please try again or reach us directly on WhatsApp.');
    }
  };

  const responseTime = settingsData?.responseTimeText || '24 hours';

  return (
    <section id="services-builder" className="section-builder" style={{ padding: '5rem 0', background: 'var(--bg-surface)' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.25rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(29, 92, 240, 0.1)', color: '#1d5cf0', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <CheckCircle2 size={16} /> Interactive Project Configurator
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Tell Us What You Need
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
            Choose services across Web, App &amp; AI to get an instant scope breakdown. We will review your requirements and respond within {responseTime}.
          </p>
        </div>

        {/* Progress Stepper */}
        {!submitSuccess && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '18px', left: '10%', right: '10%', height: '3px', background: 'var(--border-glass)', zIndex: 0 }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #1d5cf0, #12a150)',
                  width: `${((currentStep - 1) / 3) * 100}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            {[
              { num: 1, label: 'Choose Services' },
              { num: 2, label: 'Project Scope' },
              { num: 3, label: 'Your Contact' },
              { num: 4, label: 'Review & Send' }
            ].map((st) => (
              <div key={st.num} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: currentStep >= st.num ? '#1d5cf0' : 'var(--bg-main)',
                    border: currentStep >= st.num ? '2px solid #1d5cf0' : '2px solid var(--border-glass)',
                    color: currentStep >= st.num ? '#ffffff' : 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    boxShadow: currentStep === st.num ? '0 0 14px rgba(29, 92, 240, 0.45)' : 'none'
                  }}
                >
                  {currentStep > st.num ? <Check size={18} /> : st.num}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: currentStep === st.num ? 700 : 500, color: currentStep >= st.num ? 'var(--text-main)' : 'var(--text-dim)' }}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: CHOOSE SERVICES */}
        {currentStep === 1 && !submitSuccess && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Step 1: Select Your Services</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Tick all the features you need. You can pick services from any or all domains.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Domain 1: Web Development */}
              <div style={{ border: '1px solid rgba(29, 92, 240, 0.25)', borderRadius: '12px', padding: '1.25rem', background: 'rgba(29, 92, 240, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1d5cf0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                      <Globe size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Web Development</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Modern, mobile-responsive, Google-optimized</span>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(29, 92, 240, 0.15)', color: '#1d5cf0', border: '1px solid rgba(29, 92, 240, 0.3)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>
                    Starting from {getDomainPrice('web')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {webServices.map((s) => {
                    const isChecked = selectedServices.includes(s.name);
                    return (
                      <label
                        key={s.id || s.name}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(29, 92, 240, 0.12)' : 'var(--bg-surface)',
                          border: isChecked ? '1px solid #1d5cf0' : '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(s.name)}
                          style={{ marginTop: '3px', accentColor: '#1d5cf0', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: isChecked ? 700 : 600, color: isChecked ? '#1d5cf0' : 'var(--text-main)' }}>
                            {s.name}
                          </div>
                          {s.type === 'main' && (
                            <span style={{ fontSize: '0.68rem', color: '#1d5cf0', background: 'rgba(29, 92, 240, 0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                              Main Service
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Domain 2: App Development */}
              <div style={{ border: '1px solid rgba(18, 161, 80, 0.25)', borderRadius: '12px', padding: '1.25rem', background: 'rgba(18, 161, 80, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#12a150', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>App Development</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Billing, Accounting &amp; Shop Management</span>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(18, 161, 80, 0.15)', color: '#12a150', border: '1px solid rgba(18, 161, 80, 0.3)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>
                    Starting from {getDomainPrice('app')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {appServices.map((s) => {
                    const isChecked = selectedServices.includes(s.name);
                    return (
                      <label
                        key={s.id || s.name}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(18, 161, 80, 0.12)' : 'var(--bg-surface)',
                          border: isChecked ? '1px solid #12a150' : '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(s.name)}
                          style={{ marginTop: '3px', accentColor: '#12a150', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: isChecked ? 700 : 600, color: isChecked ? '#12a150' : 'var(--text-main)' }}>
                            {s.name}
                          </div>
                          {s.type === 'main' && (
                            <span style={{ fontSize: '0.68rem', color: '#12a150', background: 'rgba(18, 161, 80, 0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                              Main Service
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Domain 3: AI Automation */}
              <div style={{ border: '1px solid rgba(122, 47, 208, 0.25)', borderRadius: '12px', padding: '1.25rem', background: 'rgba(122, 47, 208, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#7a2fd0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                      <Cpu size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>AI Automation</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>24/7 WhatsApp &amp; Voice Assistants</span>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(122, 47, 208, 0.15)', color: '#7a2fd0', border: '1px solid rgba(122, 47, 208, 0.3)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>
                    Starting from {getDomainPrice('ai')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {aiServices.map((s) => {
                    const isChecked = selectedServices.includes(s.name);
                    return (
                      <label
                        key={s.id || s.name}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(122, 47, 208, 0.12)' : 'var(--bg-surface)',
                          border: isChecked ? '1px solid #7a2fd0' : '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(s.name)}
                          style={{ marginTop: '3px', accentColor: '#7a2fd0', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: isChecked ? 700 : 600, color: isChecked ? '#7a2fd0' : 'var(--text-main)' }}>
                            {s.name}
                          </div>
                          {s.type === 'main' && (
                            <span style={{ fontSize: '0.68rem', color: '#7a2fd0', background: 'rgba(122, 47, 208, 0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                              Main Service
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                Selected: <strong style={{ color: '#1d5cf0' }}>{selectedServices.length}</strong> service(s)
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNextFromStep1}
                disabled={selectedServices.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
              >
                Continue to Scope <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROJECT DETAILS */}
        {currentStep === 2 && !submitSuccess && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Step 2: Tell Us About Your Business</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Optional details to help us provide an accurate quotation and delivery timeline.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} /> Business or Shop Type
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Retail grocery, Clinic, Real estate, School"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={15} /> Estimated Budget Range (Optional)
                </label>
                <select
                  className="form-input"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                >
                  <option value="">Select your budget preference</option>
                  <option value="Under ₹10,000">Under ₹10,000 (Low Budget)</option>
                  <option value="₹10,000 - ₹20,000">₹10,000 - ₹20,000 (Standard)</option>
                  <option value="₹20,000 - ₹40,000">₹20,000 - ₹40,000 (Growth)</option>
                  <option value="₹40,000+">₹40,000+ (Full Custom Enterprise)</option>
                  <option value="Flexible / Discuss">Flexible / Need Lingaswamy advice</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} /> Expected Timeline (Optional)
                </label>
                <select
                  className="form-input"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                >
                  <option value="">When do you need it ready?</option>
                  <option value="Immediate (3-5 days)">Immediate (3-5 days)</option>
                  <option value="Within 2 weeks">Within 2 weeks</option>
                  <option value="Within 1 month">Within 1 month</option>
                  <option value="Flexible / Planning stage">Flexible / Planning stage</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Specific Needs or Questions (Optional)</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Mention any specific features, competitors, or questions you have..."
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentStep(1)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNextFromStep2}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
              >
                Continue to Contact <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONTACT DETAILS */}
        {currentStep === 3 && !submitSuccess && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Step 3: Your Contact Details</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              We will contact you within {responseTime} with your personalized proposal.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {/* Anti-spam honeypot */}
              <input
                type="text"
                name="website_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="form-group">
                <label className="form-label">Your Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  style={{ borderColor: nameError ? '#ef4444' : undefined }}
                />
                {nameError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{nameError}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">10-Digit Mobile / WhatsApp Number <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex' }}>
                  <span style={{ padding: '0.75rem 1rem', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    className="form-input"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhone(val);
                      if (phoneError) setPhoneError('');
                    }}
                    style={{ borderRadius: '0 8px 8px 0', borderColor: phoneError ? '#ef4444' : undefined }}
                  />
                </div>
                {phoneError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{phoneError}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional, for receiving official quote PDF)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. ramesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#12a150', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  I agree to be contacted on WhatsApp regarding this project enquiry
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentStep(2)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNextFromStep3}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
              >
                Review Summary <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {currentStep === 4 && !submitSuccess && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Step 4: Review Your Enquiry</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Please review your selected services before sending.
            </p>

            {/* Selected Services Breakdown */}
            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Selected Services ({selectedServices.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {selectedServices.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(29, 92, 240, 0.1)',
                      color: '#1d5cf0',
                      border: '1px solid rgba(29, 92, 240, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>

              {/* Price Transparency Callout */}
              <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  Domain Starting Tiers: Web from {getDomainPrice('web')}, App from {getDomainPrice('app')}, AI from {getDomainPrice('ai')}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#12a150', fontWeight: 700, background: 'rgba(18, 161, 80, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  Final price depends on your requirements
                </span>
              </div>
            </div>

            {/* Customer Details Recap */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '1.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>CLIENT NAME</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>MOBILE NUMBER</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>+91 {phone}</div>
              </div>
              {email && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>EMAIL ADDRESS</div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{email}</div>
                </div>
              )}
              {businessType && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>BUSINESS</div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{businessType}</div>
                </div>
              )}
            </div>

            {/* 24-Hour Promise Notice */}
            <div style={{ background: 'rgba(255, 229, 0, 0.08)', border: '1px solid rgba(255, 229, 0, 0.3)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
              <Clock size={20} color="#b45309" />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <strong>Prompt Service Commitment:</strong> We will review your selections and contact you within <strong>{responseTime}</strong>.
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentStep(3)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => executeSubmission(false)}
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', fontWeight: 700 }}
                >
                  <Send size={16} /> {isSubmitting ? 'Saving...' : 'Submit Enquiry'}
                </button>

                <button
                  type="button"
                  className="btn btn-cta-yellow"
                  onClick={() => executeSubmission(true)}
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
                >
                  <MessageCircle size={18} /> Send on WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMISSION SUCCESS CONFIRMATION */}
        {submitSuccess && (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(18, 161, 80, 0.15)',
                color: '#12a150',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Enquiry Received Successfully!
            </h3>

            <div style={{ background: 'rgba(29, 92, 240, 0.08)', border: '1px solid rgba(29, 92, 240, 0.25)', borderRadius: '12px', padding: '1.25rem', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#1d5cf0' }}>
                Thank you! We have received your enquiry. We will contact you within {responseTime}.
              </p>
              <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                ధన్యవాదాలు! మీ విచారణ మాకు అందింది. మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.
              </p>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                धन्यवाद! हमें आपकी पूछताछ प्राप्त हो गई है। हम 24 घंटे के भीतर आपसे संपर्क करेंगे।
              </p>
            </div>

            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 2rem' }}>
              Founder <strong>Lingaswamy</strong> will personally review your {selectedServices.length} selected service(s) and prepare an affordable, high-value proposal.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/91${String(settingsData?.whatsappNumber || '6302690251').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-cta-yellow"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
              >
                <MessageCircle size={18} /> Chat with Lingaswamy
              </a>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSubmitSuccess(false);
                  setCurrentStep(1);
                  setSelectedServices([]);
                  setName('');
                  setPhone('');
                  setEmail('');
                  setBusinessType('');
                  setProjectNotes('');
                }}
              >
                Configure Another Project
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
