import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import departmentService from '../services/departmentService';
import type { DepartmentCreate, DepartmentUpdate, DepartmentResponse } from '../types';

export const departmentQueryKeys = {
  all: ['departments'] as const,
  byClient: (clientId: string) => ['departments', 'client', clientId] as const,
  detail: (departmentId: string) => ['departments', departmentId] as const,
};

export const useDepartmentsByClient = (clientId: string) => {
  return useQuery<DepartmentResponse[], Error>({
    queryKey: departmentQueryKeys.byClient(clientId),
    queryFn: () => departmentService.getDepartmentsByClient(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<DepartmentResponse, Error, DepartmentCreate>({
    mutationFn: departmentService.createDepartment,
    onSuccess: (department, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.byClient(variables.client_id),
      });
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.detail(department.department_id),
      });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DepartmentResponse,
    Error,
    { departmentId: string; departmentData: DepartmentUpdate }
  >({
    mutationFn: ({ departmentId, departmentData }) =>
      departmentService.updateDepartment(departmentId, departmentData),
    onSuccess: (department) => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.byClient(department.client_id),
      });
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.detail(department.department_id),
      });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { departmentId: string; clientId: string }>({
    mutationFn: ({ departmentId }) =>
      departmentService.deleteDepartment(departmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.byClient(variables.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: departmentQueryKeys.detail(variables.departmentId),
      });
      queryClient.invalidateQueries({ queryKey: ['employees', 'unassigned'] });
    },
  });
};
