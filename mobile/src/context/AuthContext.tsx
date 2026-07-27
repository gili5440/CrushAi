import React, { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError, clearToken, getToken, setToken } from "../api/client";

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean | null;
  signup: (data: { email: string; password: string; birthDate: string; acceptedTerms: true }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  markProfileComplete: () => void;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    getToken().then((token) => {
      setIsAuthenticated(!!token);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasProfile(null);
      return;
    }
    api
      .getMyProfile()
      .then(() => setHasProfile(true))
      .catch((err) => setHasProfile(err instanceof ApiError && err.status === 404 ? false : true));
  }, [isAuthenticated]);

  async function signup(data: { email: string; password: string; birthDate: string; acceptedTerms: true }) {
    const result = await api.signup(data);
    await setToken(result.token);
    setIsAuthenticated(true);
  }

  async function login(data: { email: string; password: string }) {
    const result = await api.login(data);
    await setToken(result.token);
    setIsAuthenticated(true);
  }

  async function logout() {
    await clearToken();
    setIsAuthenticated(false);
  }

  function markProfileComplete() {
    setHasProfile(true);
  }

  async function deleteAccount() {
    await api.deleteMyAccount();
    await clearToken();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{ isLoading, isAuthenticated, hasProfile, signup, login, logout, markProfileComplete, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
