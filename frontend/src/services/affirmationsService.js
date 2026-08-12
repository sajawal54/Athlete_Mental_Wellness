import axios from "axios";

// Direct read from environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
  baseURL: `${BASE_URL}/affirmations/`,
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

// Generate a new AI affirmation
export const generateAffirmation = async (category) => {
  const response = await API.post("generate/", {
    category,
  });

  return response.data;
};

// Get paginated affirmation history
export const getAffirmationHistory = async (page = 1) => {
  const response = await API.get(`history/?page=${page}`);
  return response.data;
};

// Toggle favorite
export const toggleFavorite = async (id) => {
  const response = await API.patch(`${id}/favorite/`);
  return response.data;
};

// Clear all affirmation history
export const clearAffirmationHistory = async () => {
  const response = await API.delete("delete/");
  return response.data;
};

export default API;