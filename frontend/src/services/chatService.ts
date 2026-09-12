import { api } from './api';
import { authService } from './authService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestions?: string[];
  data?: any;
}

export interface ChatRequestPayload {
  message: string;
  user_role?: string;
  history?: { role: string; content: string }[];
  context?: Record<string, any>;
}

export interface ChatResponsePayload {
  reply: string;
  suggestions?: string[];
  action_type?: string;
  data?: any;
}

export const chatService = {
  async sendMessage(
    message: string,
    history: ChatMessage[] = [],
    context?: Record<string, any>
  ): Promise<ChatResponsePayload> {
    const user = authService.getCurrentUser();
    const role = user?.role === 'verifier' || user?.email?.includes('verifier') ? 'verifier' : 'admin';

    const cleanHistory = history.map((h) => ({
      role: h.role,
      content: h.content,
    }));

    const response = await api.post<ChatResponsePayload>('/assistant/chat', {
      message,
      user_role: role,
      history: cleanHistory,
      context: context || {},
    });

    return response.data;
  },
};
