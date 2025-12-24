import axios from "axios";

// 1. Create the Axios Instance
const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor (Automatically adds Token to every request)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get token from storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach it
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (Handle Global Errors like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, logout user automatically
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
