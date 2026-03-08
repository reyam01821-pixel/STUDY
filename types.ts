export interface User {
  id: string;
  username: string;
  is_admin: number;
  profile_picture?: string;
}

export interface Group {
  id: string;
  name: string;
  purpose: string;
}

export interface Message {
  id: number;
  userId?: string;
  user_id?: string;
  content: string;
  type?: 'text' | 'image' | 'video';
  file_url?: string;
  seen_by?: string;
}

export interface PrivateMessage {
  id: number;
  senderId?: string;
  sender_id?: string;
  receiverId?: string;
  receiver_id?: string;
  content: string;
  type?: 'text' | 'image' | 'video';
  file_url?: string;
  seen_by?: string;
}
