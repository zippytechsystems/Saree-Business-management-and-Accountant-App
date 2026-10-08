import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { QualityTierProvider } from './context/QualityTierContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import ScrollProgress from './components/ScrollProgress';
import QuoteModal from './components/QuoteModal';

import HomePage from './pages/HomePage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

const AdminPage = React.lazy(() => import('./pages/AdminPage'));

export default function App() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteDefaultService, setQuoteDefaultService] = useState('Web Development');
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleOpenQuoteModal = (service = 'Web Development') => {
    setQuoteDefaultService(service);
    setIsQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setIsQuoteModalOpen(false);
  };

  return (
    <ThemeProvider>
      <QualityTierProvider>
        <DataProvider>
          <AdminAuthProvider>
            <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <ScrollProgress />
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
                  path="/admin"
                  element={
                    <React.Suspense
                      fallback={
                        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                          Loading Admin Portal...
                        </div>
                      }
                    >
                      <AdminPage />
                    </React.Suspense>
                  }
                />
                <Route
                  path="*"
                  element={<NotFoundPage />}
                />
              </Routes>
            </div>

            <Footer />

            {/* Floating WhatsApp CTA button on public pages (hidden on /admin so it doesn't block admin controls) */}
            {!isAdminRoute && <FloatingWhatsApp />}

            {/* Floating AI Chatbot Assistant on public pages (Bottom-Left, no overlap with WhatsApp) */}
            {!isAdminRoute && <ChatWidget />}

            {/* Fast Quote Modal */}
            <QuoteModal
              isOpen={isQuoteModalOpen}
              onClose={handleCloseQuoteModal}
              defaultService={quoteDefaultService}
            />
          </div>
        </AdminAuthProvider>
      </DataProvider>
    </QualityTierProvider>
  </ThemeProvider>
);

}
