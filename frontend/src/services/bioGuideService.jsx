import axios from "axios";


const BIO_GUIDE_API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/bio-guide/",
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

    const response = await BIO_GUIDE_API.get(
        "conversations/"
    );

    return response.data;
};


export const createConversation = async (message) => {

    const response = await BIO_GUIDE_API.post(
        "conversations/",
        {
            message: message,
        }
    );

    return response.data;
};


export const sendMessage = async (
    conversationId,
    message
) => {

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
