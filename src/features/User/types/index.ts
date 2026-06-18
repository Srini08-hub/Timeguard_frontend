export type UserRole = 'OpsAdmin' | 'reviewer'
export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: UserRole
}
export interface UserInfo{
    user_id: string
    name: string
    email: string
    role: UserRole
}
export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
  role?: UserRole
}
