import axios from 'axios';

// Directly read base URL from environment variables
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 1. Create a dedicated Axios instance for your API
const api = axios.create({
  baseURL: API_BASE,
});

// 2. Use an interceptor to inject the SimpleJWT Bearer token dynamically
api.interceptors.request.use(
  (config) => {
    // Make sure your login system saves the access token under this exact key name
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Clean and streamlined service object
export const goalService = {
  // Fetch today's goals
  getDailyGoals: async () => {
    const response = await api.get('goals/daily/');
    return response.data;
  },

  // Toggle completion (PATCH request)
  toggleGoalComplete: async (goalId) => {
    const response = await api.patch(`goals/${goalId}/toggle/`, {});
    return response.data;
  },

  // Create Custom Goal (POST request)
  addGoal: async (goalData) => {
    const response = await api.post('goals/daily/', goalData);
    return response.data;
  },

  // Delete Goal (DELETE request)
  deleteGoal: async (goalId) => {
    const response = await api.delete(`goals/${goalId}/`);
    return response.data;
  }
};