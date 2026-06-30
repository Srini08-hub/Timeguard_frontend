export const AUTH_KEYS = {
  TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const

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
  GET_EMAILS_BY_STATUS: (status: string) => `/emails?status=${status}`,
  GET_TIMESHEET_EMAILS: '/emails/timesheet-emails',
  GET_NON_TIMESHEET_EMAILS: '/emails/non-timesheet-emails',
  GET_ATTACHMENT_INFO: (emailId: string) => `/emails/${emailId}/attachments`,
} as const

export const CONTENT_EXTRACT_ENDPOINTS = {
  GET_CONTENT_EXTRACTS_BY_EMAIL_ID: (emailId: string) => `/content-extracts/email/${emailId}`,
} as const

export const TIMESHEET_ENDPOINTS = {
  GET_UNDER_REVIEW_TIMESHEETS: '/timesheet/under_review',
  GET_PROCESSED_TIMESHEETS: '/timesheet/processed',
  MARK_PROCESSED: (timesheetId: string) => '/timesheet/' + timesheetId + '/processed',
} as const

export const EMPLOYEE_ENDPOINTS = {
  GET_EMPLOYEE: (empId: string) => `/employees/${empId}`,
  GET_ACTIVE_EMPLOYEES: '/employees/active',
  GET_INACTIVE_EMPLOYEES: '/employees/inactive',
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

export const CLIENT_RULE_ENDPOINTS = {
  GET_CLIENT_RULES: '/client-rules',
  GET_CLIENT_RULE: (ruleId: string) => `/client-rules/${ruleId}`,
  GET_CLIENT_RULES_BY_DEPARTMENT: (departmentId: string) => `/client-rules/department/${departmentId}`,
  CREATE_CLIENT_RULE: '/client-rules',
  UPDATE_CLIENT_RULE: (ruleId: string) => `/client-rules/${ruleId}`,
  DELETE_CLIENT_RULE: (ruleId: string) => `/client-rules/${ruleId}`,
} as const

export const TIMECARD_ENDPOINTS = {
  GET_BY_TIMESHEET: (timesheetId: string) => `/timecards/timesheet/${timesheetId}`,
  GET_APPROVED: '/timecards/approved',
  GET_REJECTED: '/timecards/rejected',
  EXPORT_APPROVED: (weekEnding: string) => `/timecards/approved/export?week_ending=${weekEnding}`,
  GET_DETAIL: (timecardId: string) => `/timecards/${timecardId}`,
  RESOLVE: (timecardId: string) => `/timecards/${timecardId}/resolve`,
  APPROVE: (timecardId: string) => `/timecards/${timecardId}/approve`,
  BULK_APPROVE: '/timecards/bulk/approve',
  REJECT: (timecardId: string) => `/timecards/${timecardId}/reject`,
} as const
