import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import ScrollToTop from './components/ScrollToTop';
import QuoteModal from './components/QuoteModal';

import HomePage from './pages/HomePage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteDefaultService, setQuoteDefaultService] = useState('Web Development');

  const handleOpenQuoteModal = (service = 'Web Development') => {
    setQuoteDefaultService(service);
    setIsQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setIsQuoteModalOpen(false);
  };

  return (
    <ThemeProvider>
      <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ScrollToTop />
        <Navbar onOpenQuoteModal={() => handleOpenQuoteModal('Web Development')} />

        <div style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route
              path="/"
              element={<HomePage onOpenQuoteModal={() => handleOpenQuoteModal('Web Development')} />}
            />
            <Route
              path="/services/:slug"
              element={<ServiceDetailPage />}
            />
            <Route
              path="/about"
              element={<AboutPage />}
            />
            <Route
              path="/projects"
              element={<ProjectsPage />}
            />
            <Route
              path="/contact"
              element={<ContactPage />}
            />
            <Route
              path="/privacy"
              element={<PrivacyPage />}
            />
            <Route
              path="/terms"
              element={<TermsPage />}
            />
            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Routes>
        </div>

        <Footer />

        {/* Floating WhatsApp CTA button on EVERY page */}
        <FloatingWhatsApp />

        {/* Fast Quote Modal */}
        <QuoteModal
          isOpen={isQuoteModalOpen}
          onClose={handleCloseQuoteModal}
          defaultService={quoteDefaultService}
        />
      </div>
    </ThemeProvider>
  );
}
