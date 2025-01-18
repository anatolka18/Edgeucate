import axios from "axios";
import { getTokenFromLocalStorage, removeTokenFromLocalStorage } from "../helpers/localstorage.helper";

export const apiUrl = import.meta.env.VITE_API_URL;

export const instance = axios.create({
    baseURL: `${apiUrl}/api`,
});

instance.interceptors.request.use((config) => {
    const token = getTokenFromLocalStorage();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            removeTokenFromLocalStorage('token');
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);