export interface Notification {
  id: string;
  user_id: string;
  lead_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface FollowUpSettings {
  id: string;
  user_id: string;
  days_without_interaction: number;
  notify_in_app: boolean;
  notify_whatsapp: boolean;
  manychat_subscriber_id: string | null;
  personal_whatsapp: string | null;
  created_at: string;
  updated_at: string;
}

export interface WelcomeTemplate {
  id: string;
  user_id: string;
  product_type: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
