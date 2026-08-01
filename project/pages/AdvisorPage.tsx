// src/pages/AdvisorPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAdvisor } from '../services/advisorService';
import api from '../services/api';
import {
  FiX, FiSend, FiAlertCircle, FiChevronRight,
  FiMessageSquare, FiClock, FiZap, FiCopy, FiCheck
} from 'react-icons/fi';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AdvisorPageProps {
  userRole: string;
  userName?: string;
  onClose?: () => void;
  limits?: {
    maxAdvisorMessages: number;
    maxAdvisorChars: number;
    advisorUsed: number;
  };
}

const AdvisorPage: React.FC<AdvisorPageProps> = ({
  userRole,
  userName,
  onClose,
  limits
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [serverLimits, setServerLimits] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ✅ دریافت محدودیت‌ها از سرور
  useEffect(() => {
    const loadLimits = async () => {
      try {
        const response = await api.get('/subscription/limits');
        if (response.data.success) {
          setServerLimits(response.data.data);
        }
      } catch (error) {
        console.error('Error loading limits:', error);
      }
    };
    loadLimits();
  }, []);

  // ✅ محدودیت‌ها با اولویت: props > سرور > پیش‌فرض
  const maxMessages = limits?.maxAdvisorMessages
    ?? serverLimits?.plan?.max_advisor_month
    ?? 20;
  const maxChars = limits?.maxAdvisorChars
    ?? serverLimits?.plan?.max_advisor_chars
    ?? 500;
  const usedMessages = limits?.advisorUsed
    ?? serverLimits?.usage?.advisor_used
    ?? 0;
  const remainingMessages = Math.max(0, maxMessages - usedMessages);
  const isLimitReached = remainingMessages <= 0;

  const roleConfig: Record<string, {
    title: string;
    subtitle: string;
    gradient: string;
    placeholder: string;
    welcomeMessage: string;
  }> = {
    student: {
      title: 'مشاور درسی',
      subtitle: 'پاسخگویی سوالات درسی و روش مطالعه',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      placeholder: 'سوال درسی خود را بنویسید...',
      welcomeMessage: `سلام ${userName || 'دانش‌آموز'} عزیز! 👋\n\nمن مشاور درسی تو هستم. هر سوالی درباره درس، روش مطالعه یا مشکلات یادگیری داری، بپرس.`
    },
    teacher: {
      title: 'مشاور معلمان',
      subtitle: 'پاسخگویی سوالات تدریس و طراحی آزمون',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      placeholder: 'سوال خود درباره تدریس یا آزمون را بنویسید...',
      welcomeMessage: `سلام استاد ${userName || 'گرامی'}! 👋\n\nمن مشاور معلمان هستم. در زمینه روش‌های تدریس، طراحی آزمون و مسائل درسی می‌توانم کمک کنم.`
    },
    university: {
      title: 'مشاور دانشگاهی',
      subtitle: 'پاسخگویی سوالات تخصصی و پژوهشی',
      gradient: 'linear-gradient(135deg, #10b981, #047857)',
      placeholder: 'سوال تخصصی یا پژوهشی خود را بنویسید...',
      welcomeMessage: `سلام ${userName || 'دانشجوی گرامی'}! 👋\n\nمن مشاور دانشگاهی هستم. در زمینه مباحث تخصصی، تحقیق، نگارش مقاله و پایان‌نامه می‌توانم کمک کنم.`
    }
  };

  const config = roleConfig[userRole] || roleConfig.student;

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: config.welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [userRole, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    // ✅ بررسی محدودیت تعداد پیام
    if (isLimitReached) {
      alert(`⚠️ سقف ${maxMessages} پیام مشاور ماهانه شما کامل شده است.\nبرای ادامه، اشتراک خود را ارتقا دهید.`);
      return;
    }

    // ✅ بررسی محدودیت کاراکتر هر پیام
    if (input.length > maxChars) {
      alert(`⚠️ حداکثر ${maxChars} کاراکتر در هر پیام مجاز است.\nپیام شما ${input.length} کاراکتر دارد.`);
      return;
    }

    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const reply = await sendMessageToAdvisor(input, userRole, messages, userName);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: reply,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([{
      role: 'assistant',
      content: config.welcomeMessage,
      timestamp: new Date()
    }]);
    setInput('');
  };

  const goBackToDashboard = () => {
    if (onClose) {
      onClose();
    } else {
      window.location.href = '/app';
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const charPercentage = Math.round((input.length / maxChars) * 100);
  const isCharWarning = charPercentage > 80;
  const isCharExceeded = input.length > maxChars;

  return (
    <div style={styles.page}>
      {/* هدر */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <button onClick={goBackToDashboard} style={styles.backButton}>
              <FiChevronRight size={20} />
              <span>بازگشت</span>
            </button>
            <div style={styles.headerDivider} />
            <div style={styles.logoWrapper}>
              <div style={{ ...styles.logoIcon, background: config.gradient }}>
                <FiMessageSquare size={20} color="white" />
              </div>
              <div>
                <div style={styles.logoTitle}>{config.title}</div>
                <div style={styles.logoSubtitle}>{config.subtitle}</div>
              </div>
            </div>
          </div>
          <div style={styles.headerRight}>
            <button onClick={handleNewChat} style={styles.newChatBtn}>
              <FiZap size={16} />
              <span>مکالمه جدید</span>
            </button>
            <div style={styles.statusBadge}>
              <div style={styles.statusDot} />
              <span style={styles.statusText}>آنلاین</span>
            </div>
          </div>
        </div>
      </header>

      {/* نوار محدودیت */}
      <div style={styles.limitsBar}>
        <div style={styles.limitItem}>
          <FiMessageSquare size={14} />
          <span>پیام‌های باقی‌مانده: <strong>{remainingMessages}</strong> از {maxMessages}</span>
        </div>
        <div style={styles.limitItem}>
          <FiClock size={14} />
          <span>حداکثر کاراکتر هر پیام: <strong>{maxChars}</strong></span>
        </div>
        {isLimitReached && (
          <div style={styles.limitWarning}>
            <FiAlertCircle size={14} />
            <span>سقف پیام ماهانه کامل شده!</span>
            <button
              onClick={() => window.location.href = '/dashboard/subscription'}
              style={styles.upgradeBtn}
            >
              ارتقا اشتراک
            </button>
          </div>
        )}
      </div>

      {/* پیام‌ها */}
      <main style={styles.main}>
        <div style={styles.messagesContainer}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.message,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <div style={{
                ...styles.messageAvatar,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #4b5563, #374151)'
                  : config.gradient
              }}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div style={styles.messageContent}>
                <div style={{
                  ...styles.messageBubble,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1f2937, #111827)'
                    : 'white',
                  color: msg.role === 'user' ? 'white' : '#374151',
                  border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                  borderRadius: msg.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px'
                }}>
                  {msg.content}
                </div>
                <div style={{
                  ...styles.messageMeta,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      style={styles.copyButton}
                    >
                      {copiedIndex === idx ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      {copiedIndex === idx ? 'کپی شد' : 'کپی'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={styles.typingIndicator}>
              <div style={{ ...styles.messageAvatar, background: config.gradient }}>🤖</div>
              <div style={styles.typingBubble}>
                <span style={{ ...styles.typingDot, animationDelay: '0ms' }} />
                <span style={{ ...styles.typingDot, animationDelay: '150ms' }} />
                <span style={{ ...styles.typingDot, animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ورودی */}
      <div style={styles.inputSection}>
        <div style={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isLimitReached ? 'سقف پیام ماهانه کامل شده' : config.placeholder}
            disabled={isLoading || isLimitReached}
            rows={1}
            style={{
              ...styles.inputField,
              borderColor: isCharExceeded ? '#ef4444' : isCharWarning ? '#f59e0b' : '#e5e7eb',
              opacity: isLimitReached ? 0.5 : 1
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isLimitReached}
            style={{
              ...styles.sendButton,
              background: isLoading || !input.trim() || isLimitReached
                ? '#d1d5db'
                : config.gradient,
              cursor: isLoading || !input.trim() || isLimitReached ? 'not-allowed' : 'pointer'
            }}
          >
            <FiSend size={18} />
          </button>
        </div>
        {/* شمارنده کاراکتر */}
        <div style={styles.charCounter}>
          <span style={{
            color: isCharExceeded ? '#ef4444' : isCharWarning ? '#f59e0b' : '#9ca3af',
            fontWeight: isCharWarning ? 600 : 400
          }}>
            {input.length} / {maxChars} کاراکتر
          </span>
          {isCharExceeded && (
            <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>
              ⚠️ {input.length - maxChars} کاراکتر اضافی
            </span>
          )}
        </div>
        <div style={styles.inputFooter}>
          پاسخ‌ها توسط هوش مصنوعی تولید می‌شوند
        </div>
      </div>

      <style>{`
        @keyframes advisorBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        @keyframes advisorFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    direction: 'rtl',
    fontFamily: "'Vazirmatn', 'IRANSans', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  headerContent: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
  },
  headerDivider: {
    width: 1,
    height: 32,
    background: '#e5e7eb',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: '#1f2937',
  },
  logoSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    padding: '6px 12px',
    color: '#6b7280',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: '#f3f4f6',
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    background: '#22c55e',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: 13,
    color: '#6b7280',
  },
  limitsBar: {
    maxWidth: 1000,
    margin: '12px auto 0',
    padding: '0 20px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
    fontSize: 13,
    color: '#6b7280',
  },
  limitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  limitWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fef2f2',
    color: '#991b1b',
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #fecaca',
  },
  upgradeBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '4px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  },
  main: {
    flex: 1,
    maxWidth: 1000,
    margin: '0 auto',
    padding: '20px',
    width: '100%',
    overflowY: 'auto',
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  message: {
    display: 'flex',
    gap: 12,
    animation: 'advisorFadeIn 0.3s ease',
  },
  messageAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 20,
  },
  messageContent: {
    maxWidth: '75%',
    flex: 1,
  },
  messageBubble: {
    padding: '14px 18px',
    lineHeight: 1.8,
    fontSize: 14,
    whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  messageMeta: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
    fontSize: 11,
    color: '#9ca3af',
  },
  copyButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontFamily: 'inherit',
  },
  typingIndicator: {
    display: 'flex',
    gap: 12,
  },
  typingBubble: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px 16px 16px 4px',
    padding: '14px 18px',
    display: 'flex',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    background: '#d1d5db',
    borderRadius: '50%',
    animation: 'advisorBounce 1s infinite',
  },
  inputSection: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '16px 20px 20px',
    width: '100%',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid #e5e7eb',
  },
  inputWrapper: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
  },
  inputField: {
    flex: 1,
    padding: '12px 16px',
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: 14,
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'none',
    direction: 'rtl',
    transition: 'all 0.2s ease',
    minHeight: 48,
    maxHeight: 200,
    outline: 'none',
  },
  sendButton: {
    padding: 12,
    borderRadius: 14,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  charCounter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    fontSize: 12,
  },
  inputFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: '#d1d5db',
    marginTop: 8,
  },
};

export default AdvisorPage;