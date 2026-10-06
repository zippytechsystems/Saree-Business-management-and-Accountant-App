import React from 'react';
import Hero from '../components/Hero';
import ServicesSection from '../components/ServicesSection';
import PackagesSection from '../components/PackagesSection';
import PortfolioSection from '../components/PortfolioSection';
import WhyChooseUs from '../components/WhyChooseUs';
import TestimonialsSection from '../components/TestimonialsSection';
import AboutSection from '../components/AboutSection';
import FAQSection from '../components/FAQSection';
import ServiceSelectionBuilder from '../components/ServiceSelectionBuilder';
import ContactSection from '../components/ContactSection';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function HomePage({ onOpenQuoteModal }) {
  useScrollReveal();

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

      {/* 3. Turnkey Solution Packages */}
      <PackagesSection />

      {/* 4. Portfolio with domain filtering */}
      <PortfolioSection />

      {/* 5. Why Choose Us / Value Proposition for Indian SMBs */}
      <WhyChooseUs />

      {/* 6. Real Client Testimonials */}
      <TestimonialsSection />

      {/* 7. About Story & Founder Lingaswamy */}
      <AboutSection />

      {/* 8. Frequently Asked Questions */}
      <FAQSection />

      {/* 9. Interactive "Tell Us What You Need" Step-by-Step Project Builder */}
      <ServiceSelectionBuilder />

      {/* 10. Final Contact CTA & WhatsApp Enquiry Form */}
      <ContactSection />
    </main>
  );
}
