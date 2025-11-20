import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services';
import { User, LoginRequest } from '../types';

interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage and validate token
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getCurrentUser();
      const token = authService.getToken();

      if (storedUser && token) {
        // Check if token is expired
        if (authService.isTokenExpired()) {
          console.log('Token expired on initialization, clearing auth state');
          authService.logout();
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Set user immediately from localStorage for faster UI
        setUser(storedUser);

        // Start automatic token refresh
        authService.startTokenRefresh();

        // Verify token is still valid in background
        try {
          const verifyResult = await authService.verifyToken();

          if (verifyResult.success && verifyResult.data?.valid) {
            // Token is valid, update user data if provided
            if (verifyResult.data.user) {
              setUser(verifyResult.data.user);
              // Update stored user data
              localStorage.setItem('user', JSON.stringify(verifyResult.data.user));
            }
          } else {
            // Token is invalid or expired, clear auth state
            console.log('Token validation failed, clearing auth state');
            authService.logout();
            setUser(null);
          }
        } catch (error) {
          // If verification fails (network error, etc), keep user logged in
          // They will be logged out when they try to make an authenticated request
          console.warn('Token verification failed, keeping user logged in:', error);
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // Cleanup: stop token refresh on unmount
    return () => {
      authService.stopTokenRefresh();
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        // Update user state immediately after successful login
        setUser(response.data.user);
        // Clear cache on authentication state change
        authService.clearAuthCache();
      } else {
        throw new Error('Login failed - invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (data: SignupRequest): Promise<void> => {
    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        // Signup successful - user needs to login
        // Don't automatically log them in, let them use the login flow
        console.log('Signup successful for user:', response.data.username);
      } else {
        throw new Error('Signup failed - invalid response from server');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      // Clear cache on authentication state change
      authService.clearAuthCache();
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
      setUser(null);
      authService.clearAuthCache();
    }
  };

  const refreshUser = (): void => {
    const storedUser = authService.getCurrentUser();
    setUser(storedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
