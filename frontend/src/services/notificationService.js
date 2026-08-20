import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const notificationApi = axios.create({
  baseURL: API_BASE_URL.endsWith("/")
    ? API_BASE_URL
    : `${API_BASE_URL}/`,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("access")
  );
};

notificationApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const notificationService = {
  // =========================================================
  // GET NOTIFICATIONS
  // =========================================================

  getNotifications: async ({
    page = 1,
    type = "all",
    unread = "",
    pageSize = 10,
  } = {}) => {
    const params = {
      page,
      page_size: pageSize,
    };

    if (type && type !== "all") {
      params.type = type;
    }

    if (unread !== "") {
      params.unread = unread;
    }

    const response = await notificationApi.get(
      "notifications/",
      {
        params,
      }
    );

    return response.data;
  },

  // =========================================================
  // GET UNREAD COUNT
  // =========================================================

  getUnreadCount: async () => {
    const response = await notificationApi.get(
      "notifications/unread-count/"
    );

    return response.data;
  },

  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  markAsRead: async (notificationId) => {
    const response = await notificationApi.patch(
      `notifications/${notificationId}/read/`
    );

    return response.data;
  },

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  markAllAsRead: async () => {
    const response = await notificationApi.patch(
      "notifications/mark-all-read/"
    );

    return response.data;
  },

  // =========================================================
  // DELETE NOTIFICATION
  // =========================================================

  deleteNotification: async (notificationId) => {
    const response = await notificationApi.delete(
      `notifications/${notificationId}/`
    );

    return response.data;
  },

  // =========================================================
  // GET NOTIFICATION PREFERENCES
  // =========================================================

  getPreferences: async () => {
    const response = await notificationApi.get(
      "notifications/preferences/"
    );

    return response.data;
  },

  // =========================================================
  // UPDATE NOTIFICATION PREFERENCES
  // =========================================================

  updatePreferences: async (preferences) => {
    const response = await notificationApi.patch(
      "notifications/preferences/",
      preferences
    );

    return response.data;
  },
};

export default notificationService;