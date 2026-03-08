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
  userId: string;
  content: string;
  type?: string;
  file_url?: string;
  seen_by?: string;
}

export interface PrivateMessage {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  type?: string;
  file_url?: string;
  seen_by?: string;
}
