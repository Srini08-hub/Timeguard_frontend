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
  createdAt: string;
  // createdBy?: string | null;
}

export interface EmployeeApiResponse {
  emp_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  // created_by?: string | null;
}
