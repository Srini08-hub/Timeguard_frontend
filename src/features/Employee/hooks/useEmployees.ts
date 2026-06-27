import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { employeeService } from '../services/employeeService';
import type {
  EmployeeCreate,
  EmployeeResponse,
  EmployeeUpdate,
} from '../types';

export const employeeQueryKeys = {
  all: ['employees'] as const,
  detail: (empId: string) => ['employees', empId] as const,
  unassigned: ['employees', 'unassigned'] as const,
};

export const useEmployees = () => {
  return useQuery<EmployeeResponse[], Error>({
    queryKey: employeeQueryKeys.all,
    queryFn: employeeService.getEmployees,
  });
};

export const useUnassignedEmployees = () => {
  return useQuery<EmployeeResponse[], Error>({
    queryKey: employeeQueryKeys.unassigned,
    queryFn: employeeService.getUnassignedEmployees,
  });
};

export const useEmployee = (empId?: string) => {
  return useQuery<EmployeeResponse, Error>({
    queryKey: empId ? employeeQueryKeys.detail(empId) : ['employees', 'detail'],
    queryFn: () => employeeService.getEmployee(empId ?? ''),
    enabled: Boolean(empId),
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<EmployeeResponse, Error, EmployeeCreate>({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<
    EmployeeResponse,
    Error,
    { empId: string; employeeData: EmployeeUpdate }
  >({
    mutationFn: ({ empId, employeeData }) =>
      employeeService.updateEmployee(empId, employeeData),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(employee.empId),
      });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<EmployeeResponse, Error, string>({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(employee.empId),
      });
    },
  });
};
