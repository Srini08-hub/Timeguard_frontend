export interface DepartmentCreate {
  client_id: string; // UUID
  department_name: string;
}

export interface DepartmentUpdate {
  department_name?: string | null;
}

export interface DepartmentResponse {
  department_id: string; // UUID
  client_id: string; // UUID
  department_name: string;
  created_at: string; // ISO datetime string
}