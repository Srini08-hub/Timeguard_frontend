export type AttachmentStatus =
  | "pending"
  | "timesheet"
  | "not_timesheet"
  | "processed"
  | "not_processed"
  | "failed";

export type EmailStatus =
  | "not_received"
  | "received"
  | "classified"
  | "extracted"
  | "merged"
  | "processed"
  | "not_processed"
  | "failed";



export interface AttachmentInfo {
  attachment_id: string;
  filename: string;
  failure_stage: string | null;
  failure_reason: string | null;
  attachment_url: string;
  document_type: string;
  status: AttachmentStatus;
}

export interface TimesheetEmailResponse {
  email_id: string;
  sender_email: string;
  subject: string | null;
  body: string | null;
  status: EmailStatus;
  failure_stage?: string | null;
  failure_reason?: string | null;
//   classification_status: EmailClassificationStatus;
}

