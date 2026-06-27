import { EMPLOYEE_ENDPOINTS } from '../../../config/constant';
import axiosInstance from '../../../lib/auth';
import type {
  EmployeeApiResponse,
  EmployeeCreate,
  EmployeeResponse,
  EmployeeUpdate,
} from '../types/index';

const toEmployeeResponse = (employee: EmployeeApiResponse): EmployeeResponse => ({
  empId: employee.emp_id,
  email: employee.email,
  name: employee.name,
  isActive: employee.is_active,
  createdAt: employee.created_at,
//   createdBy: employee.created_by,
});

export const employeeService = {
    getEmployees: async (): Promise<EmployeeResponse[]> => {
        const response = await axiosInstance.get<EmployeeApiResponse[]>(
            EMPLOYEE_ENDPOINTS.GET_EMPLOYEES,
        );
        return response.data.map(toEmployeeResponse);
    },
    getEmployee: async (empId: string): Promise<EmployeeResponse> => {
        const response = await axiosInstance.get<EmployeeApiResponse>(
            EMPLOYEE_ENDPOINTS.GET_EMPLOYEE(empId),
        );
        return toEmployeeResponse(response.data);
    },
    getUnassignedEmployees: async (): Promise<EmployeeResponse[]> => {
        const response = await axiosInstance.get<EmployeeApiResponse[]>(
            EMPLOYEE_ENDPOINTS.GET_UNASSIGNED_EMPLOYEES,
        );
        return response.data.map(toEmployeeResponse);
    },
    createEmployee: async (employeeData: EmployeeCreate): Promise<EmployeeResponse> => {
        const response = await axiosInstance.post<EmployeeApiResponse>(
            EMPLOYEE_ENDPOINTS.CREATE_EMPLOYEE,
            employeeData,
        );
        return toEmployeeResponse(response.data);
    },
    updateEmployee: async (empId: string, employeeData: EmployeeUpdate): Promise<EmployeeResponse> => {
        const response = await axiosInstance.put<EmployeeApiResponse>(
            EMPLOYEE_ENDPOINTS.UPDATE_EMPLOYEE(empId),
            employeeData,
        );
        return toEmployeeResponse(response.data);
    },
    deleteEmployee: async (empId: string): Promise<EmployeeResponse> => {
        const response = await axiosInstance.delete<EmployeeApiResponse>(
            EMPLOYEE_ENDPOINTS.DELETE_EMPLOYEE(empId),
        );
        return toEmployeeResponse(response.data);
    },
};
