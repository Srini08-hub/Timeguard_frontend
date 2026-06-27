import axiosInstance from "../../../lib/auth";
import type { AssignmentResponse ,AssignmentCreate,AssignmentUpdate } from "../types/index"
import {ASSIGNMENT_ENDPOINTS} from "../../../config/constant"

export const assignmentService = {
  createAssignment: async (assignment: AssignmentCreate[]): Promise<AssignmentResponse> => {
    const response = await axiosInstance.post(ASSIGNMENT_ENDPOINTS.CREATE_ASSIGNMENT, assignment);
    return response.data;
  },
  getAssignmentsByDepartment: async (departmentId: string): Promise<AssignmentResponse[]> => {
    const response = await axiosInstance.get(ASSIGNMENT_ENDPOINTS.GET_ASSIGNMENTS_BY_DEPARTMENT(departmentId));
    return response.data;
  },
//   updateAssignment: async (assignmentId: string, assignment: AssignmentUpdate): Promise<AssignmentResponse> => {
//     const response = await axiosInstance.patch(`/assignments/${assignmentId}`, assignment);
//     return response.data;
//   },
  deleteAssignment: async (assignmentId: string): Promise<void> => {
    await axiosInstance.delete(ASSIGNMENT_ENDPOINTS.DELETE_ASSIGNMENT(assignmentId));
  }
};