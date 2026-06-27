import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { employeeService } from '../services/employeeService';
import type {
  EmployeeCreate,
  EmployeeResponse,
  EmployeeUpdate,
} from '../types';

export const employeeQueryKeys = {
  all: ['employees'] as const,
  active: ['employees', 'active'] as const,
  inactive: ['employees', 'inactive'] as const,
  detail: (empId: string) => ['employees', empId] as const,
  unassigned: ['employees', 'unassigned'] as const,
};

export const useActiveEmployees = () => {
  return useQuery<EmployeeResponse[], Error>({
    queryKey: employeeQueryKeys.active,
    queryFn: employeeService.getActiveEmployees,
  });
};

export const useInactiveEmployees = () => {
  return useQuery<EmployeeResponse[], Error>({
    queryKey: employeeQueryKeys.inactive,
    queryFn: employeeService.getInactiveEmployees,
  });
};

export const useEmployees = useActiveEmployees;

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

const invalidateEmployeeLists = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
  queryClient.invalidateQueries({ queryKey: employeeQueryKeys.active });
  queryClient.invalidateQueries({ queryKey: employeeQueryKeys.inactive });
  queryClient.invalidateQueries({ queryKey: employeeQueryKeys.unassigned });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<EmployeeResponse, Error, EmployeeCreate>({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      invalidateEmployeeLists(queryClient);
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
      invalidateEmployeeLists(queryClient);
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
      invalidateEmployeeLists(queryClient);
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(employee.empId),
      });
    },
  });
};
