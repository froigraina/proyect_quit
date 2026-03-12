export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSessionPayload = {
  token: string;
  user: AuthUser;
  onboardingCompleted: boolean;
};

export type AuthMePayload = {
  user: AuthUser;
  onboardingCompleted: boolean;
};

export type Profile = {
  id: string;
  timezone: string;
  planMode: "QUIT" | "REDUCE";
  baselineDailyConsumption: number;
  dailyGoal: number;
  packPrice: number;
  monthlyFreeDays: number;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  settingsEffectiveFrom: string | null;
  persistenceStatus: string;
};

export type ProfileSettingsSnapshot = {
  effectiveFrom: string;
  planMode: "QUIT" | "REDUCE";
  baselineDailyConsumption: number;
  dailyGoal: number;
  packPrice: number;
  monthlyFreeDays: number;
};

export type DailyEntry = {
  id: string;
  date: string;
  cigarettesSmoked: number;
  dailyGoal: number;
  status: "SUCCESS" | "USED_FREE_DAY" | "FAILED";
  freeDayUsed: boolean;
  moneySaved: number;
  cigarettesAvoided: number;
  smokeFreeHours: number;
  notes?: string | null;
  canEdit?: boolean;
};

export type StatsSummary = {
  smokeFreeDays: number;
  moneySaved: number;
  cigarettesAvoided: number;
  smokeFreeHours: number;
  currentStreak: number;
  bestStreak: number;
  monthlyFreeDaysRemaining: number;
  period?: { year: number; month: number } | null;
  entriesCount?: number;
};

export type Achievement = {
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
  threshold?: number;
  type?: string;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type PeriodParams = {
  year?: number;
  month?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const AUTH_TOKEN_KEY = "pucho.auth.token";

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

function withPeriod(path: string, params?: PeriodParams) {
  if (!params?.year || !params.month) {
    return path;
  }

  const search = new URLSearchParams({
    year: String(params.year),
    month: String(params.month)
  });

  return `${path}?${search.toString()}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let payload: unknown = null;
    let message = `Request failed: ${response.status}`;

    try {
      payload = await response.json();

      if (
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
      ) {
        message = payload.message;
      }
    } catch {
      // Intentional: some responses may not be JSON.
    }

    throw new ApiError(message, response.status, payload);
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { displayName: string; email: string; password: string }) =>
    request<AuthSessionPayload>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthSessionPayload>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request<AuthMePayload>("/auth/me"),
  changePassword: (payload: { currentPassword: string; nextPassword: string }) =>
    request<{ success: boolean }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () =>
    request<{ success: boolean }>("/auth/logout", {
      method: "POST"
    }),
  getProfile: () => request<Profile>("/profile"),
  getProfileSettingsHistory: () => request<ProfileSettingsSnapshot[]>("/profile/settings-history"),
  updateProfile: (
    payload: Partial<
      Pick<
        Profile,
        "planMode" | "baselineDailyConsumption" | "dailyGoal" | "packPrice" | "monthlyFreeDays"
      >
    > & { effectiveFrom?: string }
  ) =>
    request<Profile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  completeOnboarding: (payload: {
    planMode: Profile["planMode"];
    baselineDailyConsumption: number;
    dailyGoal: number;
    packPrice: number;
    monthlyFreeDays: number;
  }) =>
    request<Profile>("/profile/onboarding", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getDailyEntries: (params?: PeriodParams) => request<DailyEntry[]>(withPeriod("/daily-entries", params)),
  upsertDailyEntry: (payload: { date: string; cigarettesSmoked: number; notes?: string }) =>
    request<DailyEntry>("/daily-entries", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getStats: (params?: PeriodParams) => request<StatsSummary>(withPeriod("/stats/summary", params)),
  getAchievements: () => request<Achievement[]>("/achievements")
};
