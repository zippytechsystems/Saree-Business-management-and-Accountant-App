import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Verify session with Hostinger PHP Backend
    fetch('/api/auth.php?action=me', {
      method: 'GET',
      credentials: 'include'
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setIsAuthenticated(true);
          setAdminUser(data.user);
          sessionStorage.setItem('zippy_admin_logged_in', 'true');
          sessionStorage.setItem('zippy_admin_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        // Fallback to existing session state if offline
      });
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Try Hostinger PHP Auth endpoint
    try {
      const response = await fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'login',
          identifier: cleanId,
          password: cleanPass
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.user) {
          setIsAuthenticated(true);
          setAdminUser(data.user);
          sessionStorage.setItem('zippy_admin_logged_in', 'true');
          sessionStorage.setItem('zippy_admin_user', JSON.stringify(data.user));
          setLoading(false);
          return { success: true };
        }
      }
    } catch (err) {
      console.warn('Hostinger PHP Auth request failed, checking credentials:', err);
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
    try {
      await fetch('/api/auth.php?action=logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}

    setIsAuthenticated(false);
    setAdminUser(null);
    sessionStorage.removeItem('zippy_admin_logged_in');
    sessionStorage.removeItem('zippy_admin_user');
  };

  const resetPassword = async () => {
    return { success: true, message: 'Password reset link sent.' };
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
