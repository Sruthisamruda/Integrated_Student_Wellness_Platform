/**
 * Auth context: holds user, token, loading state; provides login, signup, logout.
 * Token is persisted in localStorage so the user stays logged in on refresh.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getStoredToken } from '../api';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: if we have a stored token, fetch current user
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiRequest('/auth/me')
      .then((data) => {
        setUser(data.user);
        localStorage.setItem('token', token);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (email, password, name) => {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
