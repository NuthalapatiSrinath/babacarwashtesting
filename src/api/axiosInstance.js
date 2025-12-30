import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "http://3.29.249.5:3000/api",
  timeout: 15000,
});

const forceLogout = (message) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  toast.error(message);

  window.location.replace("/login");
};

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (!token) {
      forceLogout("Session expired. Please login again.");
      return Promise.reject("Missing auth token");
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (res) => res,

  (error) => {
    const status = error?.response?.status;
    const path = window.location.pathname;

    if (path === "/login") {
      return Promise.reject(error);
    }

    // AUTH FAILURE
    if (status === 401 || status === 403) {
      forceLogout("Session expired. Please login again.");
      return Promise.reject(error);
    }

    // SERVER DOWN / NETWORK / CORS / TIMEOUT
    if (
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED"
    ) {
      forceLogout("Server unreachable. Please login again.");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
