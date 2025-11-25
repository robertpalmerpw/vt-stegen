import { useState, useEffect } from 'react';

const AUTH_KEY = 'pingis_auth_level'; // 'admin' | 'user' | null

export const useAdmin = () => {
  const [authLevel, setAuthLevel] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_KEY);
  });

  useEffect(() => {
    const handleStorage = () => {
      setAuthLevel(localStorage.getItem(AUTH_KEY));
    };

    // Lyssna på ändringar både från andra flikar och samma flik
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-change', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-change', handleStorage);
    };
  }, []);

  const verifyPassword = (password: string): boolean => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    const sitePassword = import.meta.env.VITE_SITE_PASSWORD;

    // Kontrollera admin-lösenord
    if (adminPassword && password === adminPassword) {
      localStorage.setItem(AUTH_KEY, 'admin');
      setAuthLevel('admin');
      window.dispatchEvent(new Event('auth-change'));
      return true;
    }

    // Kontrollera sajt-lösenord
    if (sitePassword && password === sitePassword) {
      // Om vi redan är admin, nedgradera inte
      if (authLevel !== 'admin') {
        localStorage.setItem(AUTH_KEY, 'user');
        setAuthLevel('user');
        window.dispatchEvent(new Event('auth-change'));
      }
      return true;
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthLevel(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  const isAdmin = authLevel === 'admin';
  const isAuthenticated = !!authLevel;

  return { isAdmin, isAuthenticated, verifyPassword, logout };
};
