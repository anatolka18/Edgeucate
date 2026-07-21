import { instance } from "../api/axios.api";
import { ILoginData, IResponseUser, IUser, IRegistrData, ISignUpResponse } from "../types/user";
import { setAccessToken } from "../store/auth-state";

let isRefreshingGlobal = false;
let refreshPromise: Promise<string | null> | null = null;

export const AuthService = {
    async registration(userData: IRegistrData): Promise<ISignUpResponse | undefined> {
        const { data } = await instance.post<{ accessToken: string; username: string }>('auth/signup', userData)
        if (data?.accessToken) {
            setAccessToken(data.accessToken)
        }
        return { username: data.username, token: data.accessToken }
    },
    async login(userData: ILoginData): Promise<IUser | undefined> {
        const { data } = await instance.post<IUser>('auth/login', userData)
        if (data?.accessToken) {
            setAccessToken(data.accessToken)
        }
        if (data.isBlocked) {
            throw new Error(`BLOCKED:${data.blockReason || "Причина не указана"}`);
        }
        return data
    },
    async getProfile() {
        const { data } = await instance.get<IResponseUser>('auth/profile')
        if (data) return data
    },
    async refreshToken(): Promise<string | null> {
        if (isRefreshingGlobal && refreshPromise) {
            return refreshPromise;
        }

        isRefreshingGlobal = true;
        refreshPromise = (async () => {
            try {
                const { data } = await instance.post<{ accessToken: string }>('auth/refresh')
                if (data?.accessToken) {
                    setAccessToken(data.accessToken);
                    return data.accessToken;
                }
                return null;
            } catch {
                setAccessToken(null);
                return null;
            } finally {
                isRefreshingGlobal = false;
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    },
    async logout() {
        await instance.post('auth/logout')
        setAccessToken(null)
    }
}