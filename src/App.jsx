import React, { useState, useEffect, Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import PageTransition from './components/common/PageTransition';
import Skeleton from './components/common/Skeleton';

// Lazy-loaded Auth & Setup Screens
const AuthScreen = lazy(() => import('./screens/AuthScreen'));
const BusinessProfileScreen = lazy(() => import('./screens/BusinessProfileScreen'));

// Lazy-loaded Core Business Screens (split into dedicated on-demand chunks)
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const StockScreen = lazy(() => import('./screens/StockScreen'));
const TodaySalesScreen = lazy(() => import('./screens/TodaySalesScreen'));
const ExpensesScreen = lazy(() => import('./screens/ExpensesScreen'));
const AccountantScreen = lazy(() => import('./screens/AccountantScreen'));
const LendersScreen = lazy(() => import('./screens/LendersScreen'));
const CalculationsScreen = lazy(() => import('./screens/CalculationsScreen'));
const ReportsScreen = lazy(() => import('./screens/ReportsScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
import { useGlobalRipple } from './hooks/useGlobalRipple';

function AppInner() {
  useGlobalRipple();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    user: null,
    businessProfile: null,
    needsProfile: false,
  });

  // Verify and restore authenticated session on app launch
  const checkSession = async () => {
    // Read from sessionStorage ONLY for maximum privacy.
    // When the browser tab/app is closed, session is cleared automatically!
    const token = sessionStorage.getItem('auth_token');
    // Wipe legacy localStorage token to prevent unauthorized access
    localStorage.removeItem('auth_token');

    if (!token) {
      setAuthState({
        loading: false,
        isAuthenticated: false,
        user: null,
        businessProfile: null,
        needsProfile: false,
      });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const profile = data.business_profile || {
          business_name: `${data.user?.username || 'Owner'} Business`,
          business_nickname: data.user?.username || 'Owner',
          business_address: 'Main Store',
        };

        setAuthState({
          loading: false,
          isAuthenticated: true,
          user: data.user,
          businessProfile: profile,
          needsProfile: false, // Never block existing session with business profile setup
        });
      } else {
        // Invalid or expired token
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token');
        setAuthState({
          loading: false,
          isAuthenticated: false,
          user: null,
          businessProfile: null,
          needsProfile: false,
        });
      }
    } catch (err) {
      // In case of network failure during offline use, if a token exists, allow offline access with cached state
      console.warn('[Session] Network offline or check failed:', err.message);
      setAuthState({
        loading: false,
        isAuthenticated: true,
        user: { id: 1, username: 'owner' },
        businessProfile: { business_name: 'Saree Business ERP', business_nickname: 'Saree Business', business_address: 'Main Store' },
        needsProfile: false,
      });
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthSuccess = (data) => {
    const profile = data.business_profile || {
      business_name: `${data.user?.username || 'Saree'} Business ERP`,
      business_nickname: data.user?.username || 'Saree Shop',
      business_address: 'Main Store',
    };

    // When logging in, never ask for business details - go DIRECTLY to dashboard!
    // Only on brand-new initial signup without any profile, allow setup
    const isNewSignUp = Boolean(data.is_signup && data.needs_profile);

    setAuthState({
      loading: false,
      isAuthenticated: true,
      user: data.user,
      businessProfile: profile,
      needsProfile: isNewSignUp,
    });
    setActiveTab('dashboard');
  };

  const handleProfileComplete = (profileData) => {
    setAuthState((prev) => ({
      ...prev,
      businessProfile: profileData,
      needsProfile: false,
    }));
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    setAuthState({
      loading: false,
      isAuthenticated: false,
      user: null,
      businessProfile: null,
      needsProfile: false,
    });
    setActiveTab('dashboard');
  };

  const handleProfileUpdate = (updatedProfile) => {
    setAuthState((prev) => ({
      ...prev,
      businessProfile: updatedProfile,
    }));
  };

  // Prefetch frequent operational screens when browser is idle to ensure instant tab switches
  useEffect(() => {
    if (authState.isAuthenticated) {
      const prefetch = () => {
        import('./screens/TodaySalesScreen');
        import('./screens/ExpensesScreen');
        import('./screens/StockScreen');
      };
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(prefetch);
      } else {
        setTimeout(prefetch, 1200);
      }
    }
  }, [authState.isAuthenticated]);

  // 1. Session Loading Splash
  if (authState.loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <div style={styles.loadingText}>Loading Business Management...</div>
      </div>
    );
  }

  // 2. Unauthenticated: Show Login / Sign Up
  if (!authState.isAuthenticated) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<Skeleton.Screen />}>
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 3. Authenticated but first time profile setup needed
  if (authState.needsProfile) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<Skeleton.Screen />}>
          <BusinessProfileScreen
            onProfileComplete={handleProfileComplete}
            initialProfile={authState.businessProfile}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 4. Authenticated with profile: Show main application
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setActiveTab} />;
      case 'stock':
        return <StockScreen />;
      case 'today-sales':
        return <TodaySalesScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'accountant':
        return <AccountantScreen />;
      case 'lenders':
        return <LendersScreen />;
      case 'calculations':
        return <CalculationsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return (
          <SettingsScreen
            businessProfile={authState.businessProfile}
            user={authState.user}
            onLogout={handleLogout}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      default:
        return <DashboardScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        businessProfile={authState.businessProfile}
        user={authState.user}
        onLogout={handleLogout}
      >
        <Suspense fallback={<Skeleton.Screen />}>
          <PageTransition activeKey={activeTab}>
            {renderActiveScreen()}
          </PageTransition>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'Inter, system-ui, sans-serif',
    gap: '16px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-blue)',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
};

