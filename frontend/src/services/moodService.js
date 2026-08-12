import axios from "axios";

// Environment variable se API base URL read hoga
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Base API configuration for Mood Endpoints
const API = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT access token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export const moodService = {
  // 1. Fetch paginated mood history
  getMoods: async (page = 1) => {
    const response = await API.get(`moods/?page=${page}`);
    return response.data;
  },

  // 2. Submit new mood check-in
  addMood: async (data) => {
    const response = await API.post("moods/", data);
    return response.data;
  },

  // 3. Delete one mood by ID
  deleteMood: async (id) => {
    const response = await API.delete(`moods/${id}/`);
    return response.data;
  },

  // 4. Clear complete mood history
  clearMoods: async () => {
    const response = await API.delete("moods/delete/");
    return response.data;
  },
};

export default API;