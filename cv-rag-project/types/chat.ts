export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  error?: {
    message: string;
    status?: number;
    data?: any;
  };
  result?: {
    predicted_class?: string;
    confidence?: string;
    explanation?: string;
    treatment_plans?: string;
  };
}

export interface Chat {
  chat_id: string;
  title: string;
  created_at: string;
  last_message?: string;
  message_count: number;
}

