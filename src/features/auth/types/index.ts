export type UserRole = 'admin' | 'OpsAdmin' | 'reviewer'

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserInfo {
  user_id: string
  name: string,
  email: string,
  role: UserRole
}

export interface AuthResponse {
  user_id: string,
  name: string,
  email: string,
  role: UserRole,
}

export interface RefreshTokenRequest {
  refresh_token: string
}
