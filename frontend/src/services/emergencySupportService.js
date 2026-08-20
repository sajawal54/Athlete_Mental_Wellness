import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const emergencyApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

emergencyApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const emergencyService = {
  getContacts: async (region = "") => {
    const response = await emergencyApi.get("emergency/contacts/", {
      params: region ? { region } : {},
    });

    return response.data;
  },

  getCounselors: async () => {
    const response = await emergencyApi.get("emergency/counselors/");
    return response.data;
  },

  getCrisisInformation: async () => {
    const response = await emergencyApi.get("emergency/crisis/");
    return response.data;
  },

  getBreathingExercises: async () => {
    const response = await emergencyApi.get("emergency/breathing/");
    return response.data;
  },

  createCallbackRequest: async (data) => {
    const response = await emergencyApi.post(
      "emergency/callbacks/",
      data
    );

    return response.data;
  },

  getCallbackHistory: async () => {
    const response = await emergencyApi.get(
      "emergency/callbacks/history/"
    );

    return response.data;
  },
};