import axiosInstance from "../../../lib/auth";
import type { DepartmentCreate,DepartmentUpdate,DepartmentResponse } from "../types";
import { DEPARTMENT_ENDPOINTS } from "../../../config/constant";

const departmentService = {
    createDepartment: async (department: DepartmentCreate): Promise<DepartmentResponse> => {
        const response = await axiosInstance.post(DEPARTMENT_ENDPOINTS.CREATE_DEPARTMENT, department);
        return response.data;
    },
    updateDepartment: async (departmentId: string, department: DepartmentUpdate): Promise<DepartmentResponse> => {
        const response = await axiosInstance.patch(DEPARTMENT_ENDPOINTS.UPDATE_DEPARTMENT(departmentId), department);
        return response.data;
    },
    deleteDepartment: async (departmentId: string): Promise<void> => {
        await axiosInstance.delete(DEPARTMENT_ENDPOINTS.DELETE_DEPARTMENT(departmentId));
    },
    getDepartmentsByClient: async (clientId: string): Promise<DepartmentResponse[]> => {
        const response = await axiosInstance.get(DEPARTMENT_ENDPOINTS.GET_DEPARTMENTS_BY_CLIENT(clientId));
        return response.data;
    }
}

export default departmentService
