export type UUID = string;

export interface AssignmentCreate {
  emp_id: UUID;
  client_id: UUID;
  department_id: UUID;
  pay_rate: number;
}

export interface AssignmentUpdate {
  status?: "active" | "inactive";
  pay_rate?: number;
}

export interface AssignmentResponse {
  assignment_id: UUID;
  emp_id: UUID;
  client_id: UUID;
  department_id: UUID;
  pay_rate: number | string;
  status: "active" | "inactive";
  created_at: string;
}