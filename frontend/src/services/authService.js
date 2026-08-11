import axios from "axios";

// Environment variable se directly base URL read ho raha hai
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
  baseURL: `${BASE_URL}/auth/`,
});

// Request Interceptor to attach Bearer token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Register User
export const registerUser = async (userData) => {
  const response = await API.post("register/", userData);
  return response.data;
};  

// Login User
export const loginUser = async (userData) => {
  const response = await API.post("login/", userData);
  return response.data;
};

// Forgot Password
export const forgotPassword = async (email) => {
  const response = await API.post("password-reset/", { email });
  return response.data;
};

// Reset Password
export const resetPassword = async (data) => {
  const response = await API.post("password-reset-confirm/", data);
  return response.data;
};

export default API;