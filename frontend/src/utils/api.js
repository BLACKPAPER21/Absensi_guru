// Central API base URL
// In development: uses http://localhost:5000 (from .env.development)
// In production (Vercel): uses '' (empty string = relative URL, routed via vercel.json)
export const API_BASE = import.meta.env.VITE_API_URL ?? '';
