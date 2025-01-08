import axios from "axios";
import { getTokenFromLocalStorage } from "../helpers/localstorage.helper";

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