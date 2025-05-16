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
  id: string;
  title: string;
  description: string;
  timestamp?: string;
  messages: Message[];
}

