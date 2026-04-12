'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/components/dashboard/Dashboard.module.css';
import { Bot, Hourglass, Send } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Set welcome message on client only to avoid hydration mismatch
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: '안녕하세요! Find Blue AI 분석 엔진입니다. 서울시 3개구(서초구, 영등포구, 중구) 118개 법정동에 대한 상권 분석 질문을 해보세요.\n\n예시:\n• "서초구에서 카페 창업하기 좋은 동은?"\n• "소득이 높은데 소비가 적은 지역은?"\n• "역세권이면서 기회 지역인 곳은?"',
      timestamp: getTimestamp(),
    }]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: getTimestamp(),
    };
    setMessages(prev => [...prev, userMsg]);
    const question = input;
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });
      const json = await res.json();

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: json.answer || json.error || '응답을 처리하지 못했습니다.',
        timestamp: getTimestamp(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ AI 서버와 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>AI Analysis Chat</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--on-surface-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Snowflake Cortex AI Engine Active
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {messages.map((msg, i) => (
            msg.role === 'assistant' ? (
              <div key={i} className={styles.chatMessageAI}>
                <div className={styles.chatAIHeader}>
                  <div className={styles.chatAIAvatar}><Bot size={14} /></div>
                  <span style={{ fontWeight: 600 }}>Find Blue AI</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className={styles.chatBubbleAI}>
                  {msg.content.split('\n').map((line, j) => (
                    <React.Fragment key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div key={i} className={styles.chatMessageUser}>
                <div className={styles.chatUserMeta}>
                  <span>{msg.timestamp}</span>
                  <span style={{ fontWeight: 600 }}>YOU</span>
                </div>
                <div className={styles.chatBubbleUser}>{msg.content}</div>
              </div>
            )
          ))}
          {sending && (
            <div className={styles.chatMessageAI}>
              <div className={styles.chatAIHeader}>
                <div className={styles.chatAIAvatar}><Bot size={14} /></div>
                <span style={{ fontWeight: 600 }}>Find Blue AI</span>
              </div>
              <div className={styles.chatBubbleAI} style={{ color: 'var(--on-surface-tertiary)' }}><span style={{ display: 'flex', alignItems: 'center' }}><Hourglass size={14} style={{ marginRight: 6 }} /> Cortex AI 분석 중...</span></div>
            </div>
          )}
        </div>

        <div className={styles.chatInputArea}>
          <div className={styles.chatInputWrapper}>
            <input className={styles.chatInput} placeholder="상권 데이터에 대해 질문하세요..." value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} disabled={sending} />
          </div>
          <button className={styles.chatSendBtn} onClick={sendMessage} disabled={sending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
}
