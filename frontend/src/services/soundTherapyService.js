import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
});

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

export const getSoundTracks = async (category = "all") => {
  try {
    const params = {};
    if (category && category !== "all") {
      params.category = category;
    }

    const response = await API.get("sound-therapy/sounds/", { params });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch sound tracks:", error);
    throw error;
  }
};

export const getSoundTrack = async (trackId) => {
  try {
    const response = await API.get(`sound-therapy/sounds/${trackId}/`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch sound track detail:", error);
    throw error;
  }
};

export default API;