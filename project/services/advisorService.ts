// services/advisorService.ts
import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export const sendMessageToAdvisor = async (
  message: string,
  userRole: string,
  history: ChatMessage[],
  userName?: string
): Promise<string> => {
  try {
    const response = await api.post('/advisor/chat', {
      message,
      userRole,
      history: history.map(h => ({ role: h.role, content: h.content })),
      userName
    });
    
    return response.data.reply;
  } catch (error: any) {
    console.error('Advisor API error:', error);
    
    if (error.response?.status === 401) {
      return 'لطفاً ابتدا وارد حساب کاربری خود شوید. 🔐';
    }
    
    return 'متأسفانه در حال حاضر قادر به پاسخگویی نیستم. لطفاً چند دقیقه دیگر تلاش کنید. 🙏';
  }
};