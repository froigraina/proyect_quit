"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  api,
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
  type AuthMePayload,
  type AuthSessionPayload,
  type AuthUser
} from "@/lib/api";

type SessionStatus = "loading" | "authenticated" | "anonymous";

type SessionContextValue = {
  status: SessionStatus;
  user: AuthUser | null;
  onboardingCompleted: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { displayName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function toSessionState(payload: AuthSessionPayload | AuthMePayload) {
  return {
    status: "authenticated" as const,
    user: payload.user,
    onboardingCompleted: payload.onboardingCompleted
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  async function refresh() {
    const token = getStoredAuthToken();
    if (!token) {
      setStatus("anonymous");
      setUser(null);
      setOnboardingCompleted(false);
      return;
    }

    try {
      const next = await api.me();
      const session = toSessionState(next);
      setStatus(session.status);
      setUser(session.user);
      setOnboardingCompleted(session.onboardingCompleted);
    } catch {
      clearStoredAuthToken();
      setStatus("anonymous");
      setUser(null);
      setOnboardingCompleted(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function login(payload: { email: string; password: string }) {
    const next = await api.login(payload);
    setStoredAuthToken(next.token);
    const session = toSessionState(next);
    setStatus(session.status);
    setUser(session.user);
    setOnboardingCompleted(session.onboardingCompleted);
  }

  async function register(payload: { displayName: string; email: string; password: string }) {
    const next = await api.register(payload);
    setStoredAuthToken(next.token);
    const session = toSessionState(next);
    setStatus(session.status);
    setUser(session.user);
    setOnboardingCompleted(session.onboardingCompleted);
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // Intentional: local logout should still proceed.
    }
    clearStoredAuthToken();
    setStatus("anonymous");
    setUser(null);
    setOnboardingCompleted(false);
  }

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      onboardingCompleted,
      login,
      register,
      logout,
      refresh
    }),
    [status, user, onboardingCompleted]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
