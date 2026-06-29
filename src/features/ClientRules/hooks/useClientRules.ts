import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientRuleService } from '../services/clientRuleService';
import type {
  ClientRuleCreate,
  ClientRuleResponse,
  ClientRuleUpdate,
} from '../types';

export const clientRuleQueryKeys = {
  all: ['client-rules'] as const,
  detail: (ruleId: string) => ['client-rules', ruleId] as const,
  byDepartment: (departmentId: string) =>
    ['client-rules', 'department', departmentId] as const,
};

export const useClientRule = (ruleId?: string) => {
  return useQuery<ClientRuleResponse, Error>({
    queryKey: ruleId
      ? clientRuleQueryKeys.detail(ruleId)
      : ['client-rules', 'detail'],
    queryFn: () => clientRuleService.getClientRule(ruleId || ''),
    enabled: Boolean(ruleId),
  });
};

export const useClientRulesByDepartment = (departmentId: string) => {
  return useQuery<ClientRuleResponse[], Error>({
    queryKey: clientRuleQueryKeys.byDepartment(departmentId),
    queryFn: () => clientRuleService.getClientRulesByDepartment(departmentId),
    enabled: Boolean(departmentId),
  });
};

export const useCreateClientRule = () => {
  const queryClient = useQueryClient();

  return useMutation<ClientRuleResponse, Error, ClientRuleCreate>({
    mutationFn: clientRuleService.createClientRule,
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: clientRuleQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: clientRuleQueryKeys.detail(rule.rule_id),
      });
      queryClient.invalidateQueries({
        queryKey: clientRuleQueryKeys.byDepartment(rule.department_id),
      });
    },
  });
};

export const useUpdateClientRule = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ClientRuleResponse,
    Error,
    { ruleId: string; ruleData: ClientRuleUpdate }
  >({
    mutationFn: ({ ruleId, ruleData }) =>
      clientRuleService.updateClientRule(ruleId, ruleData),
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: clientRuleQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: clientRuleQueryKeys.detail(rule.rule_id),
      });
      queryClient.invalidateQueries({
        queryKey: clientRuleQueryKeys.byDepartment(rule.department_id),
      });
    },
  });
};

export const useDeleteClientRule = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { ruleId: string; departmentId: string }>({
    mutationFn: ({ ruleId }) => clientRuleService.deleteClientRule(ruleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientRuleQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: clientRuleQueryKeys.detail(variables.ruleId),
      });
      queryClient.invalidateQueries({
        queryKey: clientRuleQueryKeys.byDepartment(variables.departmentId),
      });
    },
  });
};
