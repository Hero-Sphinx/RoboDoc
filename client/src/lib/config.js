// Single source of truth for the backend URL, used for both REST calls and
// the Socket.io connection. Set VITE_API_URL in the deployed environment
// (e.g. Vercel) to point at the deployed backend; falls back to localhost
// for local development.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
