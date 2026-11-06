/** Runtime configuration read from Vite env vars (all public, VITE_-prefixed). */
export const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL: string = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * Mock mode serves realistic sample data from the browser so every screen works
 * before the Node/Express backend exists. It is ON unless VITE_USE_MOCK is
 * explicitly "false".
 */
export const USE_MOCK: boolean = String(import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

export const TOKEN_KEY = "foodbridge_token";
