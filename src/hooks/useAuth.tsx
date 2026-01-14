import React, { createContext, useContext, useEffect, useState } from 'react';
import { authRepository } from '../lib/repositories/authRepository';
import { logError, logInfo, getErrorMessage } from '../utils/errorHandler';

export interface User {
  id: string;
  full_name: string;
  role: string;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithPin: (pin: string) => Promise<{ error?: string }>;
  setupAdminPin: (fullName: string, pin: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      setLoading(true);
      const sessionUser = await authRepository.checkSession();

      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          full_name: sessionUser.full_name,
          role: sessionUser.role,
          email: sessionUser.email,
        });
        logInfo('Session restored:', sessionUser.full_name);
      } else {
        setUser(null);
      }
    } catch (error: unknown) {
      logError('Error checking session', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const loginWithPin = async (pin: string) => {
    try {
      setLoading(true);
      const response = await authRepository.loginWithPin(pin);

      if (!response.success || !response.user) {
        logError('Login failed', response.error || response.message || 'Unknown error');
        return { error: response.error || response.message || 'Login failed' };
      }

      setUser({
        id: response.user.id,
        full_name: response.user.full_name,
        role: response.user.role,
        email: response.user.email,
      });

      logInfo('Login successful:', response.user.full_name);
      return {};
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      logError('Login error', error);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const setupAdminPin = async (fullName: string, pin: string) => {
    try {
      setLoading(true);
      const response = await authRepository.setupAdminPin(fullName, pin);

      if (!response.success || !response.user) {
        logError('Setup failed', response.error || response.message || 'Unknown error');
        return { error: response.error || response.message || 'Setup failed' };
      }

      setUser({
        id: response.user.id,
        full_name: response.user.full_name,
        role: response.user.role,
        email: response.user.email,
      });

      logInfo('Admin setup successful:', response.user.full_name);
      return {};
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      logError('Setup error', error);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authRepository.logout();
      setUser(null);
      logInfo('Logout successful');
    } catch (error: unknown) {
      logError('Logout error', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    loginWithPin,
    setupAdminPin,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
