import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// When running on a physical device/emulator, localhost refers to the device itself,
// not your dev machine. Android emulator uses 10.0.2.2 to reach the host machine.
// __DEV__ is false in production (published) builds, so those talk to the real backend instead.
const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
export const API_BASE_URL = __DEV__ ? `http://${HOST}:4000` : "https://crushai-backend.onrender.com";

const TOKEN_KEY = "crushai_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(body?.error || `request_failed_${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body;
}

export function resolveMediaUrl(storageUrl: string | null | undefined): string | undefined {
  if (!storageUrl) return undefined;
  return storageUrl.startsWith("http") ? storageUrl : `${API_BASE_URL}${storageUrl}`;
}

export const api = {
  signup: (data: { email: string; password: string; birthDate: string; acceptedTerms: true }) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  getMe: () => request("/auth/me"),

  getMyProfile: () => request("/profile/me"),

  updateMyProfile: (data: Record<string, unknown>) =>
    request("/profile/me", { method: "PUT", body: JSON.stringify(data) }),

  uploadProfilePhoto: (uri: string) => {
    const form = new FormData();
    form.append("photo", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
    return request("/profile/me/photos", { method: "POST", body: form });
  },

  searchVisual: (uri: string, filters: { minAge?: number; maxAge?: number; gender?: string }) => {
    const form = new FormData();
    form.append("photo", { uri, name: "inspiration.jpg", type: "image/jpeg" } as any);
    if (filters.minAge) form.append("minAge", String(filters.minAge));
    if (filters.maxAge) form.append("maxAge", String(filters.maxAge));
    if (filters.gender) form.append("gender", filters.gender);
    return request("/search/visual", { method: "POST", body: form });
  },

  getSearchResults: (searchId: string, page = 0) =>
    request(`/search/results/${searchId}?page=${page}`),

  searchTraits: (answers: Record<string, unknown>) =>
    request("/search/traits", { method: "POST", body: JSON.stringify(answers) }),

  deleteMyAccount: () => request("/auth/me", { method: "DELETE" }),

  getMatches: () => request("/matches"),

  createMatch: (targetProfileId: string) =>
    request("/matches", { method: "POST", body: JSON.stringify({ targetProfileId }) }),

  getMessages: (matchId: string) => request(`/matches/${matchId}/messages`),

  sendMessage: (matchId: string, content: string) =>
    request(`/matches/${matchId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),

  getSubscription: () => request("/subscriptions/me"),

  purchaseSubscription: (plan: "weekly" | "monthly" | "yearly") =>
    request("/subscriptions/me/purchase", { method: "POST", body: JSON.stringify({ plan }) }),
};
