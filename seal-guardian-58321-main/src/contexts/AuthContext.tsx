import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

export type UserRole = "customer" | "vendor" | "admin";

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
  register: (data: RegisterData) => Promise<{ userId: string; requiresOTP: boolean }>;
  verifyOTP: (userId: string, otp: string) => Promise<{ token?: string; user?: User }>;
  login: (email: string, role: UserRole) => Promise<{ userId: string; requiresOTP: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ userId: string; requiresOTP: boolean }> => {
    const response = await api.post("/auth/register", data);
    if (!response.data.success) {
      throw new Error(response.data.error || "Registration failed");
    }
    return {
      userId: response.data.userId,
      requiresOTP: response.data.requiresOTP
    };
  };

  const verifyOTP = async (userId: string, otp: string): Promise<{ token?: string; user?: User }> => {
    const response = await api.post("/auth/verify-otp", { userId, otp });
    if (!response.data.success) {
      throw new Error(response.data.error || "OTP verification failed");
    }

    // If token exists, set it and update user state
    if (response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
      setUser(response.data.user);
    }

    return {
      token: response.data.token,
      user: response.data.user
    };
  };

  const login = async (email: string, role: UserRole): Promise<{ userId: string; requiresOTP: boolean }> => {
    const response = await api.post("/auth/login", { email, role });

    if (!response.data.success) {
      throw new Error(response.data.error || "Login failed");
    }

    return {
      userId: response.data.userId,
      requiresOTP: response.data.requiresOTP
    };
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, verifyOTP, login, logout, refreshUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};