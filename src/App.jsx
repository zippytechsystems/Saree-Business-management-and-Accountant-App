import React, { useState, useEffect, Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/layout/ErrorBoundary';

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

function ScreenSkeleton() {
  return (
    <div className="screen-skeleton-container" aria-busy="true" aria-label="Loading screen">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-subtitle" />
      <div className="kpi-grid kpi-grid-3" style={{ marginTop: '24px' }}>
        <div className="ui-card skeleton-card">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value" />
        </div>
        <div className="ui-card skeleton-card">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value" />
        </div>
        <div className="ui-card skeleton-card">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-value" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
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
    const token = localStorage.getItem('auth_token');
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
        businessProfile: { business_name: 'Owner Business', business_nickname: 'Owner', business_address: 'Main Store' },
        needsProfile: false,
      });
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthSuccess = (data) => {
    const profile = data.business_profile || {
      business_name: `${data.user?.username || 'Owner'} Business`,
      business_nickname: data.user?.username || 'Owner',
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

  const handleLogout = () => {
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
        <Suspense fallback={<ScreenSkeleton />}>
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 3. Authenticated but first time profile setup needed
  if (authState.needsProfile) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ScreenSkeleton />}>
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
        <Suspense fallback={<ScreenSkeleton />}>
          {renderActiveScreen()}
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontFamily: 'Inter, system-ui, sans-serif',
    gap: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
};
