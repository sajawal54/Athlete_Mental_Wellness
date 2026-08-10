import API from "./authService"; // Aapka standard Axios Instance

export const getProfileAPI = async () => {
  const response = await API.get("profile/");
  return response.data;
};

export const updateProfileAPI = async (formData) => {
  // Multipart header zaroori hai taake avatar/image handle ho sake
  const response = await API.put("profile/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};