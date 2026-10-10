import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user: u }) => {
    localStorage.setItem('token', token);
    setUser(u);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveSession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}
