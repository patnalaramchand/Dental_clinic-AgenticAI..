import axios from "axios";
import { AUTH_TOKEN_KEY } from "../components/ProtectedRoute"; // reusing the key constant

// Configure global defaults if needed, or just the interceptor
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Request interceptor: Attach token automatically (optional but good practice)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401s
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ 401 Unauthorized detected. Clearing session.");
      
      // Clear all auth-related keys
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      
      // Optionally force redirect if not already on login
      if (!window.location.pathname.includes("/login")) {
         window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
