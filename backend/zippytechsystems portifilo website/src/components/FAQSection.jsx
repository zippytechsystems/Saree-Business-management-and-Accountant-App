import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';
import { useData } from '../context/DataContext';

export default function FAQSection() {
  const { faqsData, loading } = useData();
  const faqs = faqsData && faqsData.length > 0 ? faqsData : content.faqs || [];

  const [activeCategory, setActiveCategory] = useState('All');
  const [openFaqId, setOpenFaqId] = useState(faqs[0]?.id || null);

  const categories = ['All', 'General', 'Web', 'App', 'AI'];

  const filteredFaqs =
    activeCategory === 'All'
      ? faqs
      : faqs.filter((f) => f.category?.toLowerCase() === activeCategory.toLowerCase());

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <section
      id="faq"
      style={{
        padding: '5.5rem 0',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        position: 'relative'
      }}
      aria-labelledby="faq-heading"
    >
      <div className="container">
        {/* Section Heading */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3.5rem auto' }}>
          <span className="badge badge-purple" style={{ marginBottom: '1rem' }}>
            GOT QUESTIONS?
          </span>
          <h2 id="faq-heading" style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Frequently Asked <span style={{ color: '#7a2fd0' }}>Questions</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            Clear, upfront answers about our starting prices, fast turnaround times, payment milestones, and post-delivery support.
          </p>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            marginBottom: '2.5rem'
          }}
          role="tablist"
          aria-label="Filter FAQs by category"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="btn"
                role="tab"
                aria-selected={isActive}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? '1px solid #7a2fd0' : '1px solid var(--border-subtle)',
                  background: isActive ? '#7a2fd0' : 'var(--bg-canvas)',
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cat === 'All' ? 'All Questions' : `${cat} Questions`}
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton */}
        {loading && (!faqs || faqs.length === 0) && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="card skeleton"
                style={{ height: '68px', borderRadius: '12px', opacity: 0.6 }}
              />
            ))}
          </div>
        )}

        {/* Friendly Empty State */}
        {!loading && filteredFaqs.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '550px', margin: '0 auto' }}>
            <HelpCircle size={36} color="#7a2fd0" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Questions in This Category</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
              Have a custom question not covered here? Ask founder Lingaswamy directly on WhatsApp.
            </p>
            <a
              href={buildWhatsAppUrl("Hi Lingaswamy, I have a question about ZippyTechSystems services.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cta-yellow"
            >
              <MessageCircle size={16} />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        )}

        {/* Accordion List */}
        {filteredFaqs.length > 0 && (
          <div
            style={{
              maxWidth: '820px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="card"
                  style={{
                    padding: 0,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: isOpen ? '1px solid rgba(122, 47, 208, 0.4)' : '1px solid var(--border-glass)',
                    transition: 'border-color var(--transition-fast)'
                  }}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      padding: '1.35rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '1.02rem'
                    }}
                  >
                    <span>{faq.question}</span>
                    <div
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--transition-fast)',
                        color: isOpen ? '#7a2fd0' : 'var(--text-dim)',
                        flexShrink: 0
                      }}
                    >
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 1.5rem 1.5rem 1.5rem',
                        fontSize: '0.94rem',
                        color: 'var(--text-body)',
                        lineHeight: 1.65,
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '1.1rem'
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
