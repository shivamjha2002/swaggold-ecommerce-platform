import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services';
import { User, LoginRequest } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
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
        // Verify token is still valid
        const verifyResult = await authService.verifyToken();
        
        if (verifyResult.success && verifyResult.data?.valid) {
          // Token is valid, update user data if provided
          if (verifyResult.data.user) {
            setUser(verifyResult.data.user);
            // Update stored user data
            localStorage.setItem('user', JSON.stringify(verifyResult.data.user));
          } else {
            setUser(storedUser);
          }
        } else {
          // Token is invalid or expired, clear auth state
          console.log('Token validation failed, clearing auth state');
          authService.logout();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
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

  const logout = (): void => {
    authService.logout();
    setUser(null);
    // Clear cache on authentication state change
    authService.clearAuthCache();
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
