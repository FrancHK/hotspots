import axios from "axios";
import { getToken, clearSession } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_URL });

// Attach the JWT to every request when present.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the session so the app can redirect to login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  },
);

// Normalises an axios error into a human message from the backend.
export function apiError(err: unknown, fallback = "Hitilafu imetokea"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Array<{ message: string }> }
      | undefined;
    if (data?.errors?.length) return data.errors[0].message;
    if (data?.message) return data.message;
  }
  return fallback;
}
