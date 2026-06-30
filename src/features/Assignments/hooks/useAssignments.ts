import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '../services/assignmentService';
import type { AssignmentCreate, AssignmentUpdate, AssignmentResponse } from '../types';

export const assignmentQueryKeys = {
  all: ['assignments'] as const,
  byDepartment: (departmentId: string) => ['assignments', 'department', departmentId] as const,
  byEmployee: (empId: string) => ['assignments', 'employee', empId] as const,
  byClient: (clientId: string) => ['assignments', 'client', clientId] as const,
};

export const useAssignmentsByDepartment = (departmentId: string) => {
  return useQuery<AssignmentResponse[], Error>({
    queryKey: assignmentQueryKeys.byDepartment(departmentId),
    queryFn: () => assignmentService.getAssignmentsByDepartment(departmentId),
    enabled: Boolean(departmentId),
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<AssignmentResponse[], Error, AssignmentCreate[]>({
    mutationFn: assignmentService.createAssignment,
    onSuccess: (_, variables) => {
      // Invalidate queries for department and employee assignments
      variables.forEach((assignment) => {
        queryClient.invalidateQueries({
          queryKey: assignmentQueryKeys.byDepartment(assignment.department_id),
        });
        queryClient.invalidateQueries({
          queryKey: assignmentQueryKeys.byEmployee(assignment.emp_id),
        });
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AssignmentResponse,
    Error,
    { assignmentId: string; assignmentData: AssignmentUpdate }
  >({
    mutationFn: ({ assignmentId, assignmentData }) =>
      assignmentService.updateAssignment(assignmentId, assignmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.all });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { assignmentId: string; departmentId: string }>({
    mutationFn: ({ assignmentId }) =>
      assignmentService.deleteAssignment(assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.byDepartment(variables.departmentId),
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', 'unassigned'] });
    },
  });
};
