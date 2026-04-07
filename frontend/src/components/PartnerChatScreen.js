import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function PartnerChatScreen() {
  const { user, profile } = useAuth();
  const { mode } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const pollRef = useRef(null);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const loadMessages = async () => {
    try {
      const { data } = await api.getPartnerMessages(100);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const { data } = await api.sendPartnerMessage(text);
      setMessages(prev => [...prev, data.message]);
      scrollToBottom();
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div data-testid="partner-chat-screen" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{
        padding: theme.spacing[4],
        borderBottom: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <h1 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, margin: 0 }}>
          Partner Chat
        </h1>
        <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted, margin: 0 }}>Private messages between you two</p>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: theme.spacing[4] }}>
        {loading && <p style={{ color: t.text.muted, textAlign: 'center' }}>Loading...</p>}
        {!loading && messages.length === 0 && (
          <p style={{ color: t.text.muted, textAlign: 'center', marginTop: theme.spacing[8] }}>
            Send your first message to your partner!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_uid === user?.id;
          return (
            <div key={msg.id} style={{
              display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start',
              marginBottom: theme.spacing[2],
            }}>
              <div style={{
                maxWidth: '75%', padding: theme.spacing[3], borderRadius: theme.radius.lg,
                background: isOwn
                  ? (mode === 'deeplyus' ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})` : t.accent.primary)
                  : (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : theme.colors.bg.secondary),
                color: isOwn ? '#FFFFFF' : t.text.primary,
              }}>
                {!isOwn && (
                  <span style={{ fontSize: theme.typography.size.xs, fontWeight: theme.typography.weight.bold, color: t.accent.primary, display: 'block', marginBottom: '2px' }}>
                    {msg.sender_name}
                  </span>
                )}
                {msg.media_data && (
                  <img src={msg.media_data.startsWith('data:') ? msg.media_data : `data:image/png;base64,${msg.media_data}`}
                    alt="Attachment" style={{ maxWidth: '100%', borderRadius: theme.radius.md, marginBottom: msg.text ? theme.spacing[1] : 0 }} />
                )}
                <p style={{ margin: 0, fontSize: theme.typography.size.sm, lineHeight: theme.typography.lineHeight.relaxed, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </p>
                <span style={{ fontSize: '10px', color: isOwn ? 'rgba(255,255,255,0.6)' : t.text.muted, display: 'block', marginTop: '2px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div style={{
        padding: theme.spacing[4],
        borderTop: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        background: mode === 'deeplyus' ? theme.colors.deep.bg.secondary : theme.colors.bg.surface,
      }}>
        <div style={{ display: 'flex', gap: theme.spacing[2] }}>
          <textarea
            data-testid="partner-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your partner..."
            rows={1}
            style={{
              flex: 1, padding: theme.spacing[3], borderRadius: theme.radius.lg,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
              color: t.text.primary, fontSize: theme.typography.size.md, resize: 'none', outline: 'none',
              fontFamily: theme.typography.fontFamily.primary,
            }}
          />
          <button
            data-testid="partner-send-btn"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{
              padding: `${theme.spacing[3]} ${theme.spacing[5]}`, borderRadius: theme.radius.lg, border: 'none',
              background: sending || !input.trim() ? (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : t.accent.primary,
              color: sending || !input.trim() ? t.text.muted : '#FFFFFF',
              fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold,
              cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
