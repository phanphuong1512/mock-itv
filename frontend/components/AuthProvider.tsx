'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl: string;
  googleId?: string;
  plan?: string;
  credits?: number;
  planExpiredAt?: string;
  createdAt?: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}



const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Google OAuth Client ID
const DEFAULT_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '256548292398-25ualgvnf1ua3qrmkqmi3o51mvtjdk5m.apps.googleusercontent.com';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('mockitv_token');
      const savedUser = localStorage.getItem('mockitv_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        // Validate & refresh user data from /api/auth/me
        fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        })
          .then((res) => {
            if (res.ok) {
              return res.json();
            }
            throw new Error('Session expired');
          })
          .then((data) => {
            if (data.user) {
              setUser(data.user);
              localStorage.setItem('mockitv_user', JSON.stringify(data.user));
            }
          })
          .catch(() => {
            // Token expired or invalid
            localStorage.removeItem('mockitv_token');
            localStorage.removeItem('mockitv_user');
            setToken(null);
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      }
    } catch (e) {
      console.error('Error reading auth storage', e);
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Google authentication failed');
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('mockitv_token', data.token);
      localStorage.setItem('mockitv_user', JSON.stringify(data.user));
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const savedToken = token || localStorage.getItem('mockitv_token');
    if (!savedToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('mockitv_user', JSON.stringify(data.user));
        }
      }
    } catch (e) {
      console.error('Error refreshing user', e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mockitv_token');
    localStorage.removeItem('mockitv_user');
  };

  return (
    <GoogleOAuthProvider clientId={DEFAULT_GOOGLE_CLIENT_ID}>
      <AuthContext.Provider
        value={{
          user,
          token,
          isLoading,
          loginWithGoogle,
          refreshUser,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}



export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
