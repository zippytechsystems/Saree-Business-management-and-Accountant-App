import React from 'react';
import Hero from '../components/Hero';
import ServicesSection from '../components/ServicesSection';
import PortfolioSection from '../components/PortfolioSection';
import WhyChooseUs from '../components/WhyChooseUs';
import AboutSection from '../components/AboutSection';
import ContactSection from '../components/ContactSection';

export default function HomePage({ onOpenQuoteModal }) {
  const handleExploreServices = () => {
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main>
      {/* 1. Hero with one tasteful motion & WhatsApp CTA */}
      <Hero
        onOpenQuoteModal={onOpenQuoteModal}
        onExploreServices={handleExploreServices}
      />

      {/* 2. Services Overview with domain colors & ₹7k, ₹10k, ₹6k starting prices */}
      <ServicesSection />

      {/* 3. Portfolio with domain filtering */}
      <PortfolioSection />

      {/* 4. Why Choose Us / Value Proposition for Indian SMBs */}
      <WhyChooseUs />

      {/* 5. About Story & Founder Lingaswamy */}
      <AboutSection />

      {/* 6. Final Contact CTA & Zero-Backend WhatsApp Enquiry Form */}
      <ContactSection />
    </main>
  );
}
