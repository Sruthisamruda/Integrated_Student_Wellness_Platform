/**
 * API helper: base URL and fetch wrapper that adds JWT and handles JSON.
 * Use getToken() from AuthContext to pass the token (or read from localStorage).
 */

// Use env var, or default to /api so Vite proxy (vite.config.js) can forward to backend
const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export function getStoredToken() {
  return localStorage.getItem('token');
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
