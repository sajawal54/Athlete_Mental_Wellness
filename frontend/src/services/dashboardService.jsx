import API from "./authService"; // Tumhara Interceptor wala Axios instance

// Aggregated Dashboard Data fetch karne ke liye
export const getDashboardDataAPI = async () => {
  try {
    const response = await API.get("dashboard/overview/"); // Backend ka aggregated endpoint
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    throw error;
  }
};