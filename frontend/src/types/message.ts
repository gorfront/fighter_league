export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: Date;
}
