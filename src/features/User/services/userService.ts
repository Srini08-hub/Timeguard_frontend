import axiosInstance from '../../../lib/auth'
import type { CreateUserRequest, UserInfo } from '../types/index'
import { USER_ENDPOINTS } from '../../../config/constant'


const userService = {
    createUser: async (userData: CreateUserRequest): Promise<UserInfo> => {
        const response = await axiosInstance.post(USER_ENDPOINTS.CREATE_USER, userData)
        return response.data
    },
    getUsers: async (): Promise<UserInfo[]> => {
        const response = await axiosInstance.get(USER_ENDPOINTS.GET_USERS)
        return response.data
    },
    updateUser: async (userId: string, userData: CreateUserRequest): Promise<UserInfo> => {
        const response = await axiosInstance.patch(USER_ENDPOINTS.UPDATE_USER(userId), userData)
        return response.data
    },
    deleteUser: async (userId: string): Promise<void> => {
        await axiosInstance.delete(USER_ENDPOINTS.DELETE_USER(userId))
    },

}

export default userService