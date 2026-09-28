import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('safetrip_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    localStorage.setItem('safetrip_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    localStorage.setItem('safetrip_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('safetrip_token');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  const updateEmergencyContact = async (name, phone) => {
    const updated = await authApi.updateEmergencyContact({ name, phone });
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        authModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
        setAuthMode,
        updateUserProfile,
        updateEmergencyContact,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
