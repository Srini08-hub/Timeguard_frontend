export const AUTH_KEYS = {
    TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
  }
  
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  USER_ME: '/users/me',
} as const

export const USER_ENDPOINTS = {
  GET_USERS: '/users',
  CREATE_USER: '/users',
  UPDATE_USER: (userId: string) => `/users/${userId}`,
} as const