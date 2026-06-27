export interface Timesheet {  
 timesheet_id: string;
  email_id: string;
  attachment_id: string | null;
  source_type: string;
  client_name: string | null;
  week_ending: string | null; // ISO date (YYYY-MM-DD)
  extracted_payload: Record<string, unknown> | null;
  status: string;
  created_at: string; // ISO datetime
}