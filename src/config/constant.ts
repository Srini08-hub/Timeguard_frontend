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
  DELETE_USER: (userId: string) => `/users/${userId}`,
} as const

export const EMAIL_ENDPOINTS = {
  GET_TIMESHEET_EMAILS: '/emails/timesheet-emails',
  GET_NON_TIMESHEET_EMAILS: '/emails/non-timesheet-emails',
  GET_ATTACHMENT_INFO: (emailId: string) => `/emails/${emailId}/attachments`,
} as const

export const TIMESHEET_ENDPOINTS = {
  GET_PENDING_TIMESHEETS: '/timesheet/pending',
} as const

export const EMPLOYEE_ENDPOINTS = {
  GET_EMPLOYEES: '/employees',
  GET_EMPLOYEE: (empId: string) => `/employees/${empId}`,
  CREATE_EMPLOYEE: '/employees',
  GET_UNASSIGNED_EMPLOYEES: '/employees/unassigned',
  UPDATE_EMPLOYEE: (empId: string) => `/employees/${empId}`,
  DELETE_EMPLOYEE: (empId: string) => `/employees/${empId}`,
} as const
export const CLIENT_ENDPOINTS = {
  GET_CLIENTS: '/clients',
  CREATE_CLIENT: '/clients',
  UPDATE_CLIENT: (clientId: string) => `/clients/${clientId}`,
  DELETE_CLIENT: (clientId: string) => `/clients/${clientId}`,
} as const

export const DEPARTMENT_ENDPOINTS = {
  GET_DEPARTMENTS_BY_CLIENT: (clientId: string) => `/departments/client/${clientId}`,
  CREATE_DEPARTMENT: '/departments',
  UPDATE_DEPARTMENT: (departmentId: string) => `/departments/${departmentId}`,
  DELETE_DEPARTMENT: (departmentId: string) => `/departments/${departmentId}`,
} as const
export const ASSIGNMENT_ENDPOINTS = {
  GET_ASSIGNMENTS: '/assignments',
  CREATE_ASSIGNMENT: '/assignments',
  GET_ASSIGNMENTS_BY_DEPARTMENT: (departmentId: string) => `/assignments/department/${departmentId}`,
  UPDATE_ASSIGNMENT: (assignmentId: string) => `/assignments/${assignmentId}`,
  DELETE_ASSIGNMENT: (assignmentId: string) => `/assignments/${assignmentId}`,
} as const