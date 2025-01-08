import { instance } from "../api/axios.api";
import { ILoginData, IResponseUser, IUser, IRegistrData, ISignUpResponse } from "../types/user";

export const AuthService = {
    async registration(userData: IRegistrData): Promise<ISignUpResponse | undefined> {
        const { data } = await instance.post<ISignUpResponse>('auth/signup', userData)
        return data
    },
    async login(userData: ILoginData): Promise<IUser | undefined> {
        const { data } = await instance.post<IUser>('auth/login', userData)
        if (data.isBlocked) {
            throw new Error(`BLOCKED:${data.blockReason || "Причина не указана"}`);
        }
        return data
    },
    async getProfile() {
        const { data } = await instance.get<IResponseUser>('auth/profile')
        if (data) return data
    },
}