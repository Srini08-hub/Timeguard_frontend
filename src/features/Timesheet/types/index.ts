export interface TimesheetPayloadBlock {
  error?: string | null;
  success?: boolean;
  extraction?: {
    rows?: TimesheetPayloadRow[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type TimesheetPayloadRow = Record<string, unknown>;

export interface TimesheetSheetPayload {
  blocks?: TimesheetPayloadBlock[];
  rows?: TimesheetPayloadRow[];
  global_fields?: Record<string, unknown>;
  employees_meta?: TimesheetPayloadRow[];
  sheet_name?: string;
  [key: string]: unknown;
}

export interface TimesheetRecord {
  date?: string | null;
  day?:string | null;
  check_in?: string | null;
  check_out?: string | null;
  break_hour?: string | null;
  hours?: string | null;
  total_hours?: string | null;
  overtime_hours?: string | null;
  confidence?: number | string | null;
  [key: string]: unknown;
}

export interface SourceInfo {
  file_name: string;
  content_type: string;
  [key: string]: unknown;
}

export interface EmployeeRecord {
  employee_name: string;
  extracted_employee_name?: string | null;
  extracted_client_name?: string | null;
  extracted_department_name?: string | null;
  emp_id?: string | null;
  assignment_id?: string | null;
  employee_matching_score?: number | string | null;
  matching_score?: number | string | null;
  department?: string | null;
  total_hours?: string | null;
  source?: SourceInfo[];
  timesheet_records?: TimesheetRecord[];
  [key: string]: unknown;
}

export interface GlobalData {
  client_name?: string | null;
  department?: string | null;
  department_name?: string | null;
  week_ending?: string | null;
  [key: string]: unknown;
}

export interface MergeResponse {
  global_data?: GlobalData | null;
  employee_records?: EmployeeRecord[];
  [key: string]: unknown;
}

export type TimesheetExtractedPayload = TimesheetSheetPayload | TimesheetSheetPayload[] | MergeResponse;

export type TimesheetStatus = 'under_review' | 'processed' | 'pending';

export interface Timesheet {
  timesheet_id: string;
  email_id: string;
  client_name: string | null;
  week_ending: string | null;
  payload: TimesheetExtractedPayload | null;
  status?: TimesheetStatus | string | null;
  created_at?: string | null;
}

export type TimecardStatus = 'pending' | 'no_exception' | 'exception' | 'approved' | 'rejected';
export type ExceptionSeverity = 'none' | 'low' | 'medium' | 'high';

export interface TimecardException {
  exception_id: string;
  timecard_id: string;
  severity: ExceptionSeverity | string;
  exception_type: string;
  reason: string;
  resolved: boolean;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimecardEntry {
  timecard_id: string;
  timesheet_id: string;
  emp_id?: string | null;
  assignment_id?: string | null;
  rule_id?: string | null;
  reviewed_by?: string | null;
  week_ending: string | null;
  employee_name?: string | null;
  reg_hours?: number | string | null;
  ot_hours?: number | string | null;
  dt_hours?: number | string | null;
  pay_rate?: number | string | null;
  regular_pay?: number | string | null;
  ot_pay?: number | string | null;
  dt_pay?: number | string | null;
  gross_pay?: number | string | null;
  status: TimecardStatus | string;
  severity: ExceptionSeverity | string;
  review_comment?: string | null;
  created_at: string;
  updated_at: string;
  exceptions: TimecardException[];
}

export interface TimecardUpdatePayload {
  employee_name?: string | null;
  client_name?: string | null;
  department_name?: string | null;
  week_ending?: string | null;
  reg_hours?: number | null;
  ot_hours?: number | null;
  dt_hours?: number | null;
  review_comment?: string | null;
}

