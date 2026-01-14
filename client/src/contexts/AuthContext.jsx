import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 [AuthContext] Checking user - Token exists:', !!token);

      if (token) {
        console.log('🔐 [AuthContext] Token found, fetching profile...');
        const response = await authAPI.getProfile();
        console.log('🔐 [AuthContext] Profile response:', response);

        if (response.user) {
          console.log('✅ [AuthContext] User authenticated:', response.user.email);
          setUser(response.user);
        } else {
          console.log('⚠️ [AuthContext] No user in response, removing token');
          localStorage.removeItem('token');
        }
      } else {
        console.log('ℹ️ [AuthContext] No token found');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Check user error:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
      console.log('🔐 [AuthContext] Check user complete');
    }
  };

  const register = async (email, password, fullName) => {
    try {
      console.log('📝 [AuthContext] Starting registration for:', email);
      setError(null);
      const response = await authAPI.register(email, password, fullName);
      console.log('📝 [AuthContext] Registration response:', response);

      if (response.error) {
        console.log('❌ [AuthContext] Registration error:', response.error);
        setError(response.error);
        return { error: response.error };
      }

      console.log('✅ [AuthContext] Registration successful, storing token');
      localStorage.setItem('token', response.token);
      setUser(response.user);
      console.log('✅ [AuthContext] User set:', response.user.email);
      return { user: response.user };
    } catch (error) {
      console.error('❌ [AuthContext] Registration error (caught):', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔑 [AuthContext] Starting login for:', email);
      setError(null);
      const response = await authAPI.login(email, password);
      console.log('🔑 [AuthContext] Login response:', response);

      if (response.error) {
        console.log('❌ [AuthContext] Login error:', response.error);
        setError(response.error);
        return { error: response.error };
      }

      console.log('✅ [AuthContext] Login successful, storing token');
      console.log('🔑 [AuthContext] Token:', response.token?.substring(0, 20) + '...');
      localStorage.setItem('token', response.token);
      setUser(response.user);
      console.log('✅ [AuthContext] User set:', response.user.email);
      return { user: response.user };
    } catch (error) {
      console.error('❌ [AuthContext] Login error (caught):', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
