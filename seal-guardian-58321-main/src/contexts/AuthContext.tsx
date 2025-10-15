import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

export type UserRole = "customer" | "vendor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber: string;
  isValidated?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOTP: boolean; userId?: string }>;
  verifyOTP: (userId: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and fetch user data
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    const response = await api.post('/auth/register', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Registration failed');
    }
  };

  const login = async (email: string, password: string): Promise<{ requiresOTP: boolean; userId?: string }> => {
    const response = await api.post('/auth/login', { email, password });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed');
    }

    return {
      requiresOTP: response.data.requiresOTP,
      userId: response.data.userId
    };
  };

  const verifyOTP = async (userId: string, otp: string): Promise<void> => {
    const response = await api.post('/auth/verify-otp', { userId, otp });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'OTP verification failed');
    }

    // Store token
    localStorage.setItem('auth_token', response.data.token);
    
    // Set user
    setUser(response.data.user);
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOTP, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};