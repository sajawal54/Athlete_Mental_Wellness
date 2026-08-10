import axios from 'axios';

// Base API configuration for Mood Endpoints
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/mood/',
});

// Interceptor: Requests se pehle accessToken attach karega
API.interceptors.request.use(
  (config) => {
    // Exact key from your localStorage
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Access Token Attached successfully!');
    } else {
      console.warn('Access Token not found im localStorage');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const moodService = {
  // 1. Fetch history/all logged mood entries
  getMoods: async () => {
    const response = await API.get('moods/');
    return response.data;
  },

  // 2. Submit/Save new check-in entry
  addMood: async (data) => {
    const response = await API.post('moods/', data);
    return response.data;
  },

  // 3. Delete a log entry by ID
  deleteMood: async (id) => {
    const response = await API.delete(`moods/${id}/`);
    return response.data;
  },

  
};

export default API;