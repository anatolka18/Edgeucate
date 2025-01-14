import { useAppSelector } from "../store/hooks"
import { IUser } from "../types/user"

export const useMyProfile = (): IUser | null => {
    const user = useAppSelector((state) => state.user.user)
    return user
}