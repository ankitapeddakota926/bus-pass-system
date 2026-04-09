import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('busPassUserInfo');
    if (userInfo) setUser(JSON.parse(userInfo));
    setLoading(false);
  }, []);

  const getAuthConfig = () => user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};

  const login = async (email, password, role) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('busPassUserInfo', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const register = async (name, email, password, phone, address, role) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/register`, { name, email, password, phone, address, role });
      localStorage.setItem('busPassUserInfo', JSON.stringify(data));
      setUser(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const logout = () => { localStorage.removeItem('busPassUserInfo'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getAuthConfig }}>
      {children}
    </AuthContext.Provider>
  );
};
