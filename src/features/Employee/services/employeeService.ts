import axios from 'axios';
import { EMPLOYEE_ENDPOINTS } from '../../../config/constant';
import axiosInstance from '../../../lib/auth';
import type {
  EmployeeApiResponse,
  EmployeeCreate,
  EmployeeResponse,
  EmployeeUpdate,
} from '../types/index';

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

    return 'Employee operation failed';
};

const toEmployeeResponse = (employee: EmployeeApiResponse): EmployeeResponse => ({
  empId: employee.emp_id,
  email: employee.email,
  name: employee.name,
  isActive: employee.is_active,
  isAssigned: employee.is_assigned,
  clientId:
    employee.client_id ??
    employee.clientId ??
    employee.assigned_client_id ??
    employee.assignment?.client_id ??
    employee.assignment?.clientId ??
    employee.client?.client_id ??
    employee.client?.clientId ??
    employee.department?.client_id ??
    employee.department?.clientId ??
    null,
  departmentId:
    employee.department_id ??
    employee.departmentId ??
    employee.assigned_department_id ??
    employee.assignment?.department_id ??
    employee.assignment?.departmentId ??
    employee.department?.department_id ??
    employee.department?.departmentId ??
    null,
  createdAt: employee.created_at,
//   createdBy: employee.created_by,
});

export const employeeService = {
    getActiveEmployees: async (): Promise<EmployeeResponse[]> => {
        try {
            const response = await axiosInstance.get<EmployeeApiResponse[]>(
                EMPLOYEE_ENDPOINTS.GET_ACTIVE_EMPLOYEES,
            );
            return response.data.map(toEmployeeResponse);
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    getInactiveEmployees: async (): Promise<EmployeeResponse[]> => {
        try {
            const response = await axiosInstance.get<EmployeeApiResponse[]>(
                EMPLOYEE_ENDPOINTS.GET_INACTIVE_EMPLOYEES,
            );
            return response.data.map(toEmployeeResponse);
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    getEmployee: async (empId: string): Promise<EmployeeResponse> => {
        try {
            const response = await axiosInstance.get<EmployeeApiResponse>(
                EMPLOYEE_ENDPOINTS.GET_EMPLOYEE(empId),
            );
            return toEmployeeResponse(response.data);
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    getUnassignedEmployees: async (): Promise<EmployeeResponse[]> => {
        try {
            const response = await axiosInstance.get<EmployeeApiResponse[]>(
                EMPLOYEE_ENDPOINTS.GET_UNASSIGNED_EMPLOYEES,
            );
            return response.data.map(toEmployeeResponse);
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    createEmployee: async (employeeData: EmployeeCreate): Promise<EmployeeResponse> => {
        try {
            const response = await axiosInstance.post<EmployeeApiResponse>(
                EMPLOYEE_ENDPOINTS.CREATE_EMPLOYEE,
                employeeData,
            );
            return toEmployeeResponse(response.data);
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    updateEmployee: async (empId: string, employeeData: EmployeeUpdate): Promise<EmployeeResponse> => {
        try {
            const response = await axiosInstance.put<EmployeeApiResponse>(
                EMPLOYEE_ENDPOINTS.UPDATE_EMPLOYEE(empId),
                employeeData,
            );
            return toEmployeeResponse(response.data);
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
    deleteEmployee: async (empId: string): Promise<EmployeeResponse> => {
        try {
            const response = await axiosInstance.delete<EmployeeApiResponse>(
                EMPLOYEE_ENDPOINTS.DELETE_EMPLOYEE(empId),
            );
            return toEmployeeResponse(response.data);
        } catch (error) {
            throw new Error(getApiErrorMessage(error));
        }
    },
};
