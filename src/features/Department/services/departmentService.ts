import axios from "axios";
import axiosInstance from "../../../lib/auth";
import type { DepartmentCreate, DepartmentUpdate, DepartmentResponse } from "../types";
import { DEPARTMENT_ENDPOINTS } from "../../../config/constant";

const getApiErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as {
            detail?: string;
            error_type?: string;
            message?: string;
        } | undefined;

        const detail = responseData?.detail ?? responseData?.message;
        if (detail) {
            return responseData?.error_type ? `${responseData.error_type}: ${detail}` : detail;
        }

        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Department operation failed";
};

const departmentService = {
    createDepartment: async (department: DepartmentCreate): Promise<DepartmentResponse> => {
        try {
            const response = await axiosInstance.post(DEPARTMENT_ENDPOINTS.CREATE_DEPARTMENT, department);
            return response.data;
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    updateDepartment: async (departmentId: string, department: DepartmentUpdate): Promise<DepartmentResponse> => {
        try {
            const response = await axiosInstance.patch(DEPARTMENT_ENDPOINTS.UPDATE_DEPARTMENT(departmentId), department);
            return response.data;
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    deleteDepartment: async (departmentId: string): Promise<void> => {
        try {
            await axiosInstance.delete(DEPARTMENT_ENDPOINTS.DELETE_DEPARTMENT(departmentId));
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    getDepartmentsByClient: async (clientId: string): Promise<DepartmentResponse[]> => {
        try {
            const response = await axiosInstance.get(DEPARTMENT_ENDPOINTS.GET_DEPARTMENTS_BY_CLIENT(clientId));
            return response.data;
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    }
}

export default departmentService
