import axiosInstance from '../../../lib/auth'
import type { CreateUserRequest, UserInfo } from '../types/index'
import { USER_ENDPOINTS } from '../../../config/constant'


const userService = {
    createUser: async (userData: CreateUserRequest): Promise<UserInfo> => {
        const response = await axiosInstance.post(USER_ENDPOINTS.CREATE_USER, userData)
        return response.data
    },
}

export default userService