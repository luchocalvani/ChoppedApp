import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { preloadLeaflet } from '../services/mapPreload';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (mounted) setAuthReady(true);
        return;
      }

      try {
        const meResponse = await api.get('/auth/me');
        if (mounted) setMe(meResponse.data);
        preloadLeaflet();
      } catch {
        localStorage.removeItem('accessToken');
        if (mounted) setMe(null);
      } finally {
        if (mounted) setAuthReady(true);
      }
    };

    bootstrapAuth();

    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      const meResponse = await api.get('/auth/me');
      setMe(meResponse.data);
      preloadLeaflet();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message;
      const errorMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo iniciar sesión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/users', { name, email, password });
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      const meResponse = await api.get('/auth/me');
      setMe(meResponse.data);
      preloadLeaflet();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message;
      const errorMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo registrar';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token) => {
    setLoading(true);
    try {
      localStorage.setItem('accessToken', token);
      const meResponse = await api.get('/auth/me');
      setMe(meResponse.data);
      preloadLeaflet();
      return { success: true };
    } catch (err) {
      localStorage.removeItem('accessToken');
      const msg = err?.response?.data?.message;
      const errorMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'Error al iniciar sesión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setMe(null);
    setError('');
  };

  const deleteMyAccount = async () => {
    setError('');
    try {
      await api.delete(`/users/${me.userId}`);
      logout();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message;
      const errorMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'Error al eliminar cuenta';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const value = {
    me,
    setMe,
    error,
    setError,
    loading,
    authReady,
    login,
    register,
    loginWithToken,
    logout,
    deleteMyAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
