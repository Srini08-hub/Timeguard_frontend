export type UUID = string;

export interface AssignmentCreate {
  emp_id: UUID;
  client_id: UUID;
  department_id: UUID;
}

export interface AssignmentUpdate {
  status?: "active" | "inactive" ;
}

export interface AssignmentResponse {
  assignment_id: UUID;
  emp_id: UUID;
  client_id: UUID;
  department_id: UUID;
  status: "active" | "inactive";
  created_at: string;
}