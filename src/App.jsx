import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Auth & Setup Screens
import AuthScreen from './screens/AuthScreen';
import BusinessProfileScreen from './screens/BusinessProfileScreen';

// Core Business Screens
import DashboardScreen from './screens/DashboardScreen';
import StockScreen from './screens/StockScreen';
import TodaySalesScreen from './screens/TodaySalesScreen';
import ExpensesScreen from './screens/ExpensesScreen';
import AccountantScreen from './screens/AccountantScreen';
import LendersScreen from './screens/LendersScreen';
import CalculationsScreen from './screens/CalculationsScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';

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
        const profile = data.business_profile;
        const needsSetup = !profile || !profile.business_name;

        setAuthState({
          loading: false,
          isAuthenticated: true,
          user: data.user,
          businessProfile: profile,
          needsProfile: needsSetup,
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
        businessProfile: null,
        needsProfile: false,
      });
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthSuccess = (data) => {
    const profile = data.business_profile;
    const needsSetup = Boolean(data.needs_profile || !profile || !profile.business_name);

    setAuthState({
      loading: false,
      isAuthenticated: true,
      user: data.user,
      businessProfile: profile,
      needsProfile: needsSetup,
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
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </ErrorBoundary>
    );
  }

  // 3. Authenticated but first time profile setup needed
  if (authState.needsProfile) {
    return (
      <ErrorBoundary>
        <BusinessProfileScreen
          onProfileComplete={handleProfileComplete}
          initialProfile={authState.businessProfile}
        />
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
        {renderActiveScreen()}
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
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    gap: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#3b82f6',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '500',
  },
};
