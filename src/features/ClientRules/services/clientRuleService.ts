import { CLIENT_RULE_ENDPOINTS } from '../../../config/constant';
import axiosInstance from '../../../lib/auth.ts';
import type {
  ClientRuleCreate,
  ClientRuleResponse,
  ClientRuleUpdate,
} from '../types';

export const clientRuleService = {
  async getClientRule(ruleId: string): Promise<ClientRuleResponse> {
    const response = await axiosInstance.get<ClientRuleResponse>(
      CLIENT_RULE_ENDPOINTS.GET_CLIENT_RULE(ruleId),
    );
    return response.data;
  },

  async getClientRulesByDepartment(
    departmentId: string,
  ): Promise<ClientRuleResponse[]> {
    const response = await axiosInstance.get<ClientRuleResponse[]>(
      CLIENT_RULE_ENDPOINTS.GET_CLIENT_RULES_BY_DEPARTMENT(departmentId),
    );
    return response.data;
  },

  async createClientRule(data: ClientRuleCreate): Promise<ClientRuleResponse> {
    const response = await axiosInstance.post<ClientRuleResponse>(
      CLIENT_RULE_ENDPOINTS.CREATE_CLIENT_RULE,
      data,
    );
    return response.data;
  },

  async updateClientRule(
    ruleId: string,
    data: ClientRuleUpdate,
  ): Promise<ClientRuleResponse> {
    const response = await axiosInstance.patch<ClientRuleResponse>(
      CLIENT_RULE_ENDPOINTS.UPDATE_CLIENT_RULE(ruleId),
      data,
    );
    return response.data;
  },

  async deleteClientRule(ruleId: string): Promise<void> {
    await axiosInstance.delete(CLIENT_RULE_ENDPOINTS.DELETE_CLIENT_RULE(ruleId));
  },
};
