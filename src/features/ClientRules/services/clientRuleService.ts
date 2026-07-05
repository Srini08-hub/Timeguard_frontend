import axios from 'axios';
import { CLIENT_RULE_ENDPOINTS } from '../../../config/constant';
import axiosInstance from '../../../lib/auth.ts';
import type {
  ClientRuleCreate,
  ClientRuleResponse,
  ClientRuleUpdate,
} from '../types';

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

  return 'Client rule operation failed';
};

export const clientRuleService = {
  async getClientRule(ruleId: string): Promise<ClientRuleResponse> {
    try {
      const response = await axiosInstance.get<ClientRuleResponse>(
        CLIENT_RULE_ENDPOINTS.GET_CLIENT_RULE(ruleId),
      );
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async getClientRulesByDepartment(
    departmentId: string,
  ): Promise<ClientRuleResponse[]> {
    try {
      const response = await axiosInstance.get<ClientRuleResponse[]>(
        CLIENT_RULE_ENDPOINTS.GET_CLIENT_RULES_BY_DEPARTMENT(departmentId),
      );
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async createClientRule(data: ClientRuleCreate): Promise<ClientRuleResponse> {
    try {
      const response = await axiosInstance.post<ClientRuleResponse>(
        CLIENT_RULE_ENDPOINTS.CREATE_CLIENT_RULE,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async updateClientRule(
    ruleId: string,
    data: ClientRuleUpdate,
  ): Promise<ClientRuleResponse> {
    try {
      const response = await axiosInstance.patch<ClientRuleResponse>(
        CLIENT_RULE_ENDPOINTS.UPDATE_CLIENT_RULE(ruleId),
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async deleteClientRule(ruleId: string): Promise<void> {
    try {
      await axiosInstance.delete(CLIENT_RULE_ENDPOINTS.DELETE_CLIENT_RULE(ruleId));
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};
