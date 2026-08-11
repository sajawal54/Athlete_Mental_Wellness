import axios from "axios";

// Environment-aware Base URL directly from env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const profileAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth/profile/`,
});

// Interceptor to attach JWT token automatically
profileAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getProfileAPI = async () => {
  const response = await profileAPI.get("");
  return response.data;
};

export const updateProfileAPI = async (formData) => {
  // Multipart header zaroori hai taake avatar/image properly submit ho sake
  const response = await profileAPI.put("", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export default profileAPI;