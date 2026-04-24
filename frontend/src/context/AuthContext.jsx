import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('Checking auth status...');
      const token = localStorage.getItem('token');
      console.log('Token found:', !!token);
      
      if (token) {
        try {
          const res = await api.get('/auth/me');
          console.log('Auth response:', res.data);
          
          // Handle both response formats: { user: {...} } or direct user object
          const userData = res.data.user || res.data;
          console.log('User data:', userData);
          
          // MongoDB uses '_id' but we also accept 'id'
          if (userData && (userData._id || userData.id)) {
            setUser(userData);
            console.log('User set successfully');
          } else {
            console.error('Invalid user data received');
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (err) {
          console.error('Authentication failed', err);
          console.error('Error response:', err.response?.data);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log('No token found, skipping auth check');
      }
      setLoading(false);
      console.log('Loading set to false');
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
