import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/gamification/",
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

// =========================================================
// PROGRESS ANALYTICS OVERVIEW
// =========================================================
// Uses the existing backend overview endpoint.
// This already contains:
// profile
// xp_history
// badges
// earned_badges
// rewards
// user_rewards

export const getProgressAnalyticsAPI = async () => {
  const response = await API.get("overview/");
  return response.data;
};

// =========================================================
// XP HISTORY
// =========================================================
// This endpoint is paginated by Django DRF.

export const getProgressXPHistoryAPI = async (page = 1) => {
  const response = await API.get(`xp-history/?page=${page}`);
  return response.data;
};

// =========================================================
// ALL BADGES
// =========================================================

export const getProgressBadgesAPI = async () => {
  const response = await API.get("badges/");
  return response.data;
};

// =========================================================
// USER BADGES
// =========================================================

export const getProgressMyBadgesAPI = async () => {
  const response = await API.get("my-badges/");
  return response.data;
};

// =========================================================
// ALL ACTIVE REWARDS
// =========================================================

export const getProgressRewardsAPI = async () => {
  const response = await API.get("rewards/");
  return response.data;
};

// =========================================================
// USER REWARDS
// =========================================================

export const getProgressMyRewardsAPI = async () => {
  const response = await API.get("my-rewards/");
  return response.data;
};

export default API;