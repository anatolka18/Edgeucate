import axios from "axios";
import { accessToken } from "../store/auth-state";
import { AuthService } from "../services/auth.service";

export const apiUrl = import.meta.env.VITE_API_URL || "";

export const instance = axios.create({
    baseURL: `${apiUrl}/api`,
    withCredentials: true,
});

instance.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url?.includes('auth/refresh')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (
                originalRequest.url?.includes('auth/login') ||
                originalRequest.url?.includes('auth/signup')
            ) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                const newToken = await AuthService.refreshToken();
                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return instance(originalRequest);
                } else {
                    throw new Error('Refresh token failed');
                }
            } catch {
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);