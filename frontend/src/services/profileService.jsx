import API from "./authService"; // ya wahi axios instance import karein

export const getProfileAPI = async () => {
  const response = await API.get("profile/");
  return response.data;
};

export const updateProfileAPI = async (profileData) => {
  const response = await API.put("profile/", profileData);
  return response.data;
};  