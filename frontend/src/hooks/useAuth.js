import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.getCurrentUser();
      console.log('Auth refresh - received user data:', data.user);
      setUser(data.user);
    } catch (requestError) {
      console.error('Auth refresh failed:', requestError);
      setUser(null);
      if (requestError.status !== 401) {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await authApi.logout();
    setUser(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refresh,
      login: authApi.startGoogleLogin,
      logout: signOut
    }),
    [user, loading, error]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
