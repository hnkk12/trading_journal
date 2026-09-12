import axios from "axios";

// Local dev: unset, so this hits "/api" and Vite's dev-server proxy forwards
// it to the backend (see vite.config.ts). Production (Vercel): set
// VITE_API_URL to the deployed backend's URL, e.g. https://xxx.onrender.com/api
// — there's no dev-server proxy in a static Vercel deploy, so the frontend
// must call the backend directly (backend already has cors() open for this).
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tj_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);
