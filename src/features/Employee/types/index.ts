export interface EmployeeCreate {
  name: string;
  email:string
  created_by?: string | null;
}

export interface EmployeeUpdate {
  name?: string;
  email?: string;
  
  // created_by?: string | null;
}

export interface EmployeeResponse {
  empId: string;
  name: string;
  email: string;
  isActive: boolean;
  isAssigned: boolean;
  clientId?: string | null;
  departmentId?: string | null;
  createdAt: string;
  // createdBy?: string | null;
}

export interface EmployeeApiResponse {
  emp_id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_assigned: boolean;
  client_id?: string | null;
  clientId?: string | null;
  assigned_client_id?: string | null;
  department_id?: string | null;
  departmentId?: string | null;
  assigned_department_id?: string | null;
  assignment?: {
    client_id?: string | null;
    clientId?: string | null;
    department_id?: string | null;
    departmentId?: string | null;
  } | null;
  client?: {
    client_id?: string | null;
    clientId?: string | null;
  } | null;
  department?: {
    client_id?: string | null;
    clientId?: string | null;
    department_id?: string | null;
    departmentId?: string | null;
  } | null;
  created_at: string;
  // created_by?: string | null;
}
