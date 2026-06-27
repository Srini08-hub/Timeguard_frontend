export interface ClientCreate {
  client_name: string;
  sender_email: string;
  sender_domain: string;
  created_by: string; // UUID
}

export interface ClientUpdate {
  client_name?: string;
  sender_email?: string;
  sender_domain?: string;
}

export interface ClientResponse {
  client_id: string; // UUID
  client_name: string;
  sender_email: string;
  sender_domain: string;
  is_active: boolean;
  created_at: string; // ISO datetime
}