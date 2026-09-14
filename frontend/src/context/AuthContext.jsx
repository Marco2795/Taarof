import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('taarof_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        setOnboardingComplete(data.onboardingComplete);
      })
      .catch(() => {
        localStorage.removeItem('taarof_token');
      })
      .finally(() => setLoading(false));
  }, []);

  function applySession(data) {
    localStorage.setItem('taarof_token', data.token);
    setUser(data.user);
    setOnboardingComplete(!!data.user?.onboardingComplete);
  }

  async function signup(name, email, password) {
    const { data } = await api.post('/auth/signup', { name, email, password });
    applySession(data);
    return data;
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data);
    return data;
  }

  async function loginWithGoogle(credential) {
    const { data } = await api.post('/auth/google', { credential });
    applySession(data);
    return data;
  }

  function updateUser(partial) {
    setUser((prev) => ({ ...prev, ...partial }));
    if (partial.onboardingComplete !== undefined) {
      setOnboardingComplete(partial.onboardingComplete);
    }
  }

  function logout() {
    localStorage.removeItem('taarof_token');
    setUser(null);
    setOnboardingComplete(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        onboardingComplete,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateUser,
        setOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
