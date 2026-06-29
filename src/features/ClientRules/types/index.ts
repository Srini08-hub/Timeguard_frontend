export type ClientRuleNumber = number | string;

export interface ClientRuleCreate {
  client_id: string;
  department_id: string;
  weekly_ot_threshold?: number;
  weekly_dt_threshold?: number | null;
  ot_multiplier?: number;
  dt_multiplier?: number;
  break_deduction_hrs?: number | null;
  break_auto_deduct?: boolean;
}

export interface ClientRuleUpdate {
  client_id?: string | null;
  department_id?: string | null;
  weekly_ot_threshold?: number | null;
  weekly_dt_threshold?: number | null;
  ot_multiplier?: number | null;
  dt_multiplier?: number | null;
  break_deduction_hrs?: number | null;
  break_auto_deduct?: boolean | null;
}

export interface ClientRuleResponse {
  rule_id: string;
  client_id: string;
  department_id: string;
  weekly_ot_threshold: ClientRuleNumber;
  weekly_dt_threshold: ClientRuleNumber | null;
  ot_multiplier: ClientRuleNumber;
  dt_multiplier: ClientRuleNumber;
  break_deduction_hrs: ClientRuleNumber | null;
  break_auto_deduct: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
