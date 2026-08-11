import axios from "axios";

// Environment-aware Base URL directly from env (Strict Audit Compliance)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const dashboardAPI = axios.create({
  baseURL: `${API_BASE_URL}/dashboard/`,
});

// Attach JWT access token automatically
dashboardAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch Dashboard Overview Data
export const getDashboardDataAPI = async () => {
  try {
    const response = await dashboardAPI.get("overview/");
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch dashboard overview:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export default dashboardAPI;