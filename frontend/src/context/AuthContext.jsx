
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import {
  loginUser as apiLogin,
  registerUser as apiRegister
} from '../api/auth';

import { getUserProfile } from '../api/users';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('token')
  );

  const [loading, setLoading] = useState(true);

  // Synchronize the logged-in user's profile
  useEffect(() => {
    let cancelled = false;

    const fetchCurrentProfile = async () => {
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getUserProfile();

        if (!data?.user) {
          throw new Error('User profile not found');
        }

        if (!cancelled) {
          setUser(data.user);
          localStorage.setItem(
            'user',
            JSON.stringify(data.user)
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to sync profile', err);

          // Clear the session if the token is rejected.
          const status = err.response?.status;

          if (status === 401 || status === 403) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchCurrentProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Same login function for students and administrators
  const login = async (credentials) => {
    const data = await apiLogin(credentials);

    if (!data?.token || !data?.user) {
      throw new Error(
        'Invalid login response from server'
      );
    }

    // Store the authenticated session
    localStorage.setItem('token', data.token);
    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

    setUser(data.user);
    setToken(data.token);

    // LoginPage uses this result for role-based navigation.
    return data;
  };

  // Register a normal student account
  const register = async (userData) => {
    return await apiRegister(userData);
  };

  // Log out the current user
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Update user details in context and local storage
  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      if (!prev) return prev;

      const merged = {
        ...prev,
        ...updatedUserData
      };

      localStorage.setItem(
        'user',
        JSON.stringify(merged)
      );

      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};