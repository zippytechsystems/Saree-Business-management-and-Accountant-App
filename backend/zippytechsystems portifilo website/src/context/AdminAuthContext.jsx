import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AdminAuthContext = createContext();

const ADMIN_CREDENTIALS = {
  username: 'lingaswamymaddeboina',
  email: 'lingaswamymaddeboina@gmail.com',
  password: 'linga@123'
};

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('zippy_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('zippy_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check Supabase session if configured
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsAuthenticated(true);
          setAdminUser(session.user);
          sessionStorage.setItem('zippy_admin_logged_in', 'true');
          sessionStorage.setItem('zippy_admin_user', JSON.stringify(session.user));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setIsAuthenticated(true);
          setAdminUser(session.user);
          sessionStorage.setItem('zippy_admin_logged_in', 'true');
          sessionStorage.setItem('zippy_admin_user', JSON.stringify(session.user));
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
          sessionStorage.removeItem('zippy_admin_logged_in');
          sessionStorage.removeItem('zippy_admin_user');
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Try Supabase Auth first if configured
    if (isSupabaseConfigured && supabase && cleanId.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password: cleanPass
        });
        if (!error && data?.session) {
          setIsAuthenticated(true);
          setAdminUser(data.user);
          sessionStorage.setItem('zippy_admin_logged_in', 'true');
          sessionStorage.setItem('zippy_admin_user', JSON.stringify(data.user));
          setLoading(false);
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase auth attempt failed, checking local credentials:', err);
      }
    }

    // 2. Validate standard admin credentials (lingaswamymaddeboina / linga@123)
    const matchesUser =
      cleanId === ADMIN_CREDENTIALS.username ||
      cleanId === ADMIN_CREDENTIALS.email ||
      cleanId === 'lingaswamy';

    const matchesPass = cleanPass === ADMIN_CREDENTIALS.password;

    if (matchesUser && matchesPass) {
      const userObj = {
        name: 'Lingaswamy',
        username: ADMIN_CREDENTIALS.username,
        email: ADMIN_CREDENTIALS.email,
        role: 'Administrator'
      };
      setIsAuthenticated(true);
      setAdminUser(userObj);
      sessionStorage.setItem('zippy_admin_logged_in', 'true');
      sessionStorage.setItem('zippy_admin_user', JSON.stringify(userObj));
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return {
      success: false,
      error: 'Invalid admin username or password. Please check your credentials.'
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setIsAuthenticated(false);
    setAdminUser(null);
    sessionStorage.removeItem('zippy_admin_logged_in');
    sessionStorage.removeItem('zippy_admin_user');
  };

  const resetPassword = async (email) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const targetEmail = (email || ADMIN_CREDENTIALS.email).trim().toLowerCase();
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: `${window.location.origin}/admin`
        });
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        adminUser,
        loading,
        login,
        logout,
        resetPassword
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
