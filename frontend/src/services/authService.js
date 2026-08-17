import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL; // e.g., 'http://127.0.0.1:8000/api'

const API = axios.create({
  baseURL: BASE_URL,
});

// Request Interceptor: Key 'accessToken' hi use karein
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Key match karein aur loop rokein
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Key same hone chahiye
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Infinite redirect loop se bachne ke liye check
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth Specific Calls (Path explicitly pass karein)
export const registerUser = async (userData) => {
  const response = await API.post("/auth/register/", userData);
  return response.data;
};  

export const loginUser = async (userData) => {
  const response = await API.post("/auth/login/", userData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await API.post("/auth/password-reset/", { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await API.post("/auth/password-reset-confirm/", data);
  return response.data;
};

export default API;