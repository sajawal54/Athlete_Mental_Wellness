import axios from "axios";

// Directly read base URL from environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BIO_GUIDE_API = axios.create({
  baseURL: `${BASE_URL}/bio-guide/`,
});

BIO_GUIDE_API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getConversations = async () => {
  const response = await BIO_GUIDE_API.get("conversations/");
  return response.data;
};

export const createConversation = async (message) => {
  const response = await BIO_GUIDE_API.post("conversations/", {
    message: message,
  });

  return response.data;
};

export const sendMessage = async (conversationId, message) => {
  const response = await BIO_GUIDE_API.post(
    `conversations/${conversationId}/message/`,
    {
      message: message,
    }
  );

  return response.data;
};

export const deleteConversation = async (conversationId) => {
  const response = await BIO_GUIDE_API.delete(
    `conversations/${conversationId}/`
  );

  return response.data;
};

export default BIO_GUIDE_API;