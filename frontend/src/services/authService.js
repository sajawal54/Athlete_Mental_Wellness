import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/auth/",
});

// Register User
export const registerUser = async (userData) => {
  const response = await API.post("register/", userData);
  return response.data;
};

// Login User
export const loginUser = async (userData) => {
  const response = await API.post("login/", userData);
  return response.data;
};

// Forgot Password
export const forgotPassword = async (email) => {
  const response = await API.post("password-reset/", {
    email,
  });

  return response.data;
};

// Reset Password
export const resetPassword = async (data) => {
  const response = await API.post("password-reset-confirm/", data);

  return response.data;
};

export default API;