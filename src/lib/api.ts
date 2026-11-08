/**
 * Single Axios instance for every FoodBridge API call.
 * - baseURL from VITE_API_URL
 * - attaches the JWT from localStorage as a Bearer token
 * - on 401 clears the token and redirects to /login
 * - in mock mode (VITE_USE_MOCK, default on) requests are answered in-browser
 */
import axios, { AxiosError } from "axios";
import { API_URL, TOKEN_KEY, USE_MOCK } from "./config";
import { mockAdapter } from "./mock/adapter";
import type {
  AdminStats,
  AppNotification,
  AuthResponse,
  Donation,
  DonationInput,
  DonationListParams,
  Paginated,
  RegisterPayload,
  User,
} from "./types";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
});

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register"];

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !AUTH_ENDPOINTS.some((p) => url.includes(p))) {
      clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

/** Human-readable message from any API error. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
    if (error.code === "ERR_NETWORK") return "Can't reach the FoodBridge server. Check your connection.";
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function toFormData(input: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null) continue;
    if (v instanceof File) fd.append(k, v);
    else fd.append(k, String(v));
  }
  return fd;
}

// ---------------- Auth ----------------
export const authApi = {
  register: async (payload: RegisterPayload) => {
    const body = payload.role === "ngo" ? toFormData({ ...payload }) : payload;
    return (await api.post<AuthResponse>("/auth/register", body)).data;
  },
  login: async (email: string, password: string) =>
    (await api.post<AuthResponse>("/auth/login", { email, password })).data,
  me: async () => (await api.get<User>("/auth/me")).data,
  /** Profile updates. Not in the original contract; the backend should add PUT /auth/me. */
  updateMe: async (patch: Partial<User>) => (await api.put<User>("/auth/me", patch)).data,
};

// ---------------- Donations ----------------
function donationFormData(input: Partial<DonationInput>) {
  const { image, ...rest } = input;
  const fd = toFormData(rest);
  if (image) fd.append("image", image);
  return fd;
}

export const donationsApi = {
  list: async (params: DonationListParams = {}) =>
    (await api.get<Paginated<Donation>>("/donations", { params })).data,
  get: async (id: string) => (await api.get<Donation>(`/donations/${id}`)).data,
  mine: async () => (await api.get<Donation[]>("/donations/mine")).data,
  create: async (input: DonationInput) =>
    (await api.post<Donation>("/donations", donationFormData(input))).data,
  update: async (id: string, input: Partial<DonationInput>) =>
    (await api.put<Donation>(`/donations/${id}`, donationFormData(input))).data,
  remove: async (id: string) => (await api.delete<{ success: boolean }>(`/donations/${id}`)).data,
  claim: async (id: string, pickupTime?: string | undefined) =>
    (await api.post<Donation>(`/donations/${id}/claim`, { pickupTime })).data,
  updateStatus: async (id: string, status: "collected" | "cancelled", reason?: string | undefined) =>
    (await api.patch<Donation>(`/donations/${id}/status`, { status, reason })).data,
};

export const claimsApi = {
  mine: async () => (await api.get<Donation[]>("/claims/mine")).data,
};

// ---------------- Notifications ----------------
export const notificationsApi = {
  list: async () => (await api.get<AppNotification[]>("/notifications")).data,
  markRead: async (id: string) => (await api.patch<AppNotification>(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await api.patch<{ success: boolean }>("/notifications/read-all")).data,
};

// ---------------- Admin ----------------
export const adminApi = {
  ngos: async (status: "pending" | "verified" | "rejected" | "all" = "pending") =>
    (await api.get<User[]>("/admin/ngos", { params: { status } })).data,
  verifyNgo: async (id: string, action: "approve" | "reject", reason?: string | undefined) =>
    (await api.patch<User>(`/admin/ngos/${id}/verify`, { action, reason })).data,
  stats: async () => (await api.get<AdminStats>("/admin/stats")).data,
  /** User list. Not in the original contract; the backend should add GET /admin/users. */
  users: async () => (await api.get<User[]>("/admin/users")).data,
};
