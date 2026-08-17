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


// ==============================
// GAMIFICATION OVERVIEW
// ==============================

export const getGamificationOverviewAPI = async () => {
  const response = await API.get("overview/");
  return response.data;
};


// ==============================
// CLAIM REWARD
// ==============================

export const claimRewardAPI = async (rewardId) => {
  const response = await API.post(
    `rewards/${rewardId}/claim/`
  );

  return response.data;
};


// ==============================
// OPTIONAL INDIVIDUAL APIs
// ==============================

export const getBadgesAPI = async () => {
  const response = await API.get("badges/");
  return response.data;
};


export const getMyBadgesAPI = async () => {
  const response = await API.get("my-badges/");
  return response.data;
};


export const getRewardsAPI = async () => {
  const response = await API.get("rewards/");
  return response.data;
};


export const getMyRewardsAPI = async () => {
  const response = await API.get("my-rewards/");
  return response.data;
};


export const getXPHistoryAPI = async () => {
  const response = await API.get("xp-history/");
  return response.data;
};


export default API;