import axios from "axios";

// ==========================================
// SOUND THERAPY API
// ==========================================

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// ==========================================
// AUTH TOKEN
// ==========================================

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

// ==========================================
// GET ALL SOUND TRACKS
// ==========================================

export const getSoundTracks = async (category = null) => {
  try {
    const params = {};

    if (category) {
      params.category = category;
    }

    const response = await API.get("sound-therapy/sounds/", {
      params,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch sound tracks:", error);
    throw error;
  }
};

// ==========================================
// GET SOUNDS BY CATEGORY
// ==========================================

export const getSoundsByCategory = async (category) => {
  try {
    const response = await API.get("sound-therapy/sounds/", {
      params: {
        category,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${category} sounds:`, error);
    throw error;
  }
};

// ==========================================
// GET SINGLE SOUND
// ==========================================

export const getSoundTrack = async (trackId) => {
  try {
    const response = await API.get(
      `sound-therapy/sounds/${trackId}/`
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch sound track:", error);
    throw error;
  }
};

export default API;