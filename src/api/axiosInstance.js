import axios from "axios";
import toast from "react-hot-toast";

// HARDCODED BASE URL
// This forces the request to be relative (e.g., https://your-site.com/api/...)
// It relies entirely on your proxy configuration (vercel.json or vite.config.js)
const baseURL = "/api";

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Debugging logs
    console.log(`[🚀 Request] ${config.method?.toUpperCase()} ${config.url}`);

    if (token) {
      // IMPORTANT — Preserving your logic: RAW token (No Bearer prefix)
      config.headers.Authorization = token;
    }

    return config;
  },
  (error) => {
    console.error("[❌ Request Error]", error);
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    // console.log(`[✅ Success] ${response.config.url}`, response.status);
    return response;
  },

  (error) => {
    console.error(
      `[🔥 Response Error] ${error.config?.url}`,
      error.response?.status,
      error.message
    );

    // Logout ONLY when API returns 401
    if (error.response?.status === 401) {
      console.warn("⚠️ 401 Unauthorized — Logging Out");

      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
