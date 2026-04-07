import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

function ModeToggle({ mode, onToggle }) {
  const t = getThemeColors(mode);
  
  return (
    <div style={{
      display: 'flex',
      background: mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: theme.radius.round,
      padding: '4px',
    }}>
      <button
        data-testid="mode-commonground"
        onClick={() => onToggle('commonground')}
        style={{
          padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
          borderRadius: theme.radius.round,
          border: 'none',
          background: mode === 'commonground' ? theme.colors.bg.surface : 'transparent',
          color: mode === 'commonground' ? theme.colors.text.primary : t.text.muted,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.semibold,
          cursor: 'pointer',
          transition: `all ${theme.motion.duration.fast}`,
        }}
      >
        CommonGround
      </button>
      <button
        data-testid="mode-deeplyus"
        onClick={() => onToggle('deeplyus')}
        style={{
          padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
          borderRadius: theme.radius.round,
          border: 'none',
          background: mode === 'deeplyus' ? theme.colors.deep.accent.primary : 'transparent',
          color: mode === 'deeplyus' ? '#FFFFFF' : t.text.muted,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.semibold,
          cursor: 'pointer',
          transition: `all ${theme.motion.duration.fast}`,
        }}
      >
        DeeplyUs
      </button>
    </div>
  );
}

function VibeDial({ vibe, onSelect, mode }) {
  const t = getThemeColors(mode);
  const vibes = [
    { key: 'soft', label: 'Soft' },
    { key: 'realtalk', label: 'Real Talk' },
    { key: 'savage', label: 'Savage' },
  ];

  return (
    <div style={{ display: 'flex', gap: theme.spacing[2] }}>
      {vibes.map((v) => (
        <button
          key={v.key}
          data-testid={`vibe-${v.key}`}
          onClick={() => onSelect(v.key)}
          style={{
            padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
            borderRadius: theme.radius.round,
            border: vibe === v.key 
              ? `2px solid ${t.accent.primary}` 
              : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            background: vibe === v.key 
              ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)') 
              : 'transparent',
            color: vibe === v.key ? t.accent.primary : t.text.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.semibold,
            cursor: 'pointer',
            transition: `all ${theme.motion.duration.fast}`,
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

function PatternInsightCard({ topic, text, mode }) {
  const t = getThemeColors(mode);
  
  return (
    <div data-testid="pattern-insight-card" style={{
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      background: mode === 'deeplyus' 
        ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
        : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
      boxShadow: mode === 'deeplyus' ? theme.shadow.deep.glow : theme.shadow.soft,
      marginBottom: theme.spacing[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[2] }}>
        <span style={{
          width: '24px',
          height: '24px',
          borderRadius: theme.radius.round,
          background: 'rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: theme.typography.size.sm,
        }}>
          ✦
        </span>
        <span style={{
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Pattern Insight
        </span>
        {topic && (
          <span style={{
            padding: `2px ${theme.spacing[2]}`,
            borderRadius: theme.radius.round,
            background: 'rgba(255,255,255,0.3)',
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.medium,
            color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
          }}>
            {topic}
          </span>
        )}
      </div>
      <p style={{
        fontSize: theme.typography.size.sm,
        lineHeight: theme.typography.lineHeight.relaxed,
        color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
        margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}

function ChatBubble({ message, isOwn, mode }) {
  const t = getThemeColors(mode);
  
  if (message.message_type === 'callout') {
    return <PatternInsightCard topic={message.metadata?.topic} text={message.text} mode={mode} />;
  }
  
  const isSystem = message.message_type === 'system';
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: theme.spacing[2],
    }}>
      <div data-testid={`chat-bubble-${isOwn ? 'own' : 'other'}`} style={{
        maxWidth: '80%',
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        background: isSystem 
          ? (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
          : isOwn 
            ? (mode === 'deeplyus' 
                ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
                : theme.colors.accent.primary)
            : (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : theme.colors.bg.secondary),
        color: isSystem
          ? t.text.muted
          : isOwn 
            ? '#FFFFFF' 
            : t.text.primary,
        fontSize: theme.typography.size.sm,
        lineHeight: theme.typography.lineHeight.relaxed,
        fontStyle: isSystem ? 'italic' : 'normal',
      }}>
        {/* Media attachment preview */}
        {message.media_data && (
          <div style={{ marginBottom: message.text ? theme.spacing[2] : 0 }}>
            <img
              src={message.media_data.startsWith('data:') ? message.media_data : `data:image/png;base64,${message.media_data}`}
              alt="Attachment"
              style={{ maxWidth: '100%', borderRadius: theme.radius.md, display: 'block' }}
            />
          </div>
        )}
        {message.text}
      </div>
    </div>
  );
}

export default function ChatScreen() {
  const { user, signOut, pair, refreshProfile } = useAuth();
  const { mode, setMode, vibe, setVibe } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pinnedCallout, setPinnedCallout] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaData, setMediaData] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const t = getThemeColors(mode);

  // Load messages on mount
  useEffect(() => {
    // Add system welcome message
    setMessages([{
      id: 'system-welcome',
      text: "BentlyAI: Hey you two. I'm here when you need me. Keep it real.",
      message_type: 'system',
    }]);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      return; // Only images for now
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMediaPreview(ev.target.result);
      setMediaData(ev.target.result.split(',')[1]); // base64 without prefix
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setMediaData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !mediaData) || loading) return;
    
    const text = inputText.trim();
    setInputText('');
    
    // Add user message with possible media
    const userMsg = {
      id: `user-${Date.now()}`,
      text: text || (mediaData ? '(image)' : ''),
      message_type: 'user',
      isOwn: true,
      media_data: mediaPreview,
    };
    setMessages(prev => [...prev, userMsg]);
    clearMedia();
    scrollToBottom();
    
    setLoading(true);
    try {
      const { data } = await api.aiChat(text, mode, vibe);
      
      // Check for callout
      if (data.meta?.callout) {
        const calloutMsg = {
          id: `callout-${Date.now()}`,
          text: data.meta.callout.text,
          message_type: 'callout',
          metadata: { topic: data.meta.callout.topic },
        };
        setMessages(prev => [...prev, calloutMsg]);
        setPinnedCallout(data.meta.callout);
      }
      
      // Add AI response
      const aiMsg = {
        id: `ai-${Date.now()}`,
        text: data.reply,
        message_type: 'assistant',
        isOwn: false,
      };
      setMessages(prev => [...prev, aiMsg]);
      setSessionId(data.sessionId);
      scrollToBottom();
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: `error-${Date.now()}`,
        text: "I'm having trouble right now. Try again in a moment.",
        message_type: 'assistant',
        isOwn: false,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: mode === 'deeplyus' 
        ? theme.colors.deep.bg.primary 
        : theme.colors.bg.primary,
      fontFamily: theme.typography.fontFamily.primary,
      transition: `background ${theme.motion.duration.slow} ${theme.motion.easing.emotional}`,
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing[4],
        borderBottom: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[3] }}>
          <h1 style={{
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
            color: t.text.primary,
            margin: 0,
          }}>
            Chat
          </h1>
          <button
            data-testid="sign-out-btn"
            onClick={signOut}
            style={{
              padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
              borderRadius: theme.radius.md,
              border: 'none',
              background: 'transparent',
              color: t.text.muted,
              fontSize: theme.typography.size.xs,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing[3] }}>
          <ModeToggle mode={mode} onToggle={setMode} />
          <VibeDial vibe={vibe} onSelect={setVibe} mode={mode} />
        </div>
      </div>

      {/* Pinned Callout */}
      {pinnedCallout && (
        <div style={{ padding: `0 ${theme.spacing[4]}`, paddingTop: theme.spacing[3] }}>
          <div data-testid="pinned-callout" style={{
            padding: theme.spacing[3],
            borderRadius: theme.radius.lg,
            background: mode === 'deeplyus' ? 'rgba(255,143,175,0.1)' : 'rgba(255,111,174,0.1)',
            border: `1px solid ${t.accent.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing[3],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], flex: 1, minWidth: 0 }}>
              <span>✦</span>
              <span style={{
                fontSize: theme.typography.size.xs,
                color: t.text.secondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {pinnedCallout.text}
              </span>
            </div>
            <button
              onClick={() => setPinnedCallout(null)}
              style={{
                padding: theme.spacing[1],
                borderRadius: theme.radius.sm,
                border: 'none',
                background: 'transparent',
                color: t.text.muted,
                cursor: 'pointer',
                fontSize: theme.typography.size.sm,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: theme.spacing[4],
      }}>
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isOwn={msg.isOwn} mode={mode} />
        ))}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: theme.spacing[2],
          }}>
            <div style={{
              padding: theme.spacing[3],
              borderRadius: theme.radius.lg,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : theme.colors.bg.secondary,
              color: t.text.muted,
              fontSize: theme.typography.size.sm,
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: theme.spacing[4],
        borderTop: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        background: mode === 'deeplyus' ? theme.colors.deep.bg.secondary : theme.colors.bg.surface,
      }}>
        {/* Media preview */}
        {mediaPreview && (
          <div data-testid="media-preview" style={{
            marginBottom: theme.spacing[3], position: 'relative', display: 'inline-block',
          }}>
            <img src={mediaPreview} alt="Preview" style={{ height: '80px', borderRadius: theme.radius.md, display: 'block' }} />
            <button
              data-testid="remove-media-btn"
              onClick={clearMedia}
              style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#EF4444', border: 'none', color: '#FFF',
                fontSize: '12px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              x
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'flex-end' }}>
          {/* Attach button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            data-testid="attach-media-btn"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: theme.spacing[3],
              borderRadius: theme.radius.lg,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              background: 'transparent',
              color: t.text.muted,
              fontSize: theme.typography.size.lg,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            title="Attach image"
          >
            +
          </button>
          <textarea
            data-testid="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type something real..."
            rows={1}
            style={{
              flex: 1,
              padding: theme.spacing[3],
              borderRadius: theme.radius.lg,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
              color: t.text.primary,
              fontSize: theme.typography.size.md,
              resize: 'none',
              outline: 'none',
              fontFamily: theme.typography.fontFamily.primary,
            }}
          />
          <button
            data-testid="send-btn"
            onClick={handleSend}
            disabled={loading || (!inputText.trim() && !mediaData)}
            style={{
              padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
              borderRadius: theme.radius.lg,
              border: 'none',
              background: loading || (!inputText.trim() && !mediaData)
                ? (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                : t.accent.primary,
              color: loading || (!inputText.trim() && !mediaData) ? t.text.muted : '#FFFFFF',
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
              cursor: loading || (!inputText.trim() && !mediaData) ? 'not-allowed' : 'pointer',
              transition: `all ${theme.motion.duration.fast}`,
            }}
          >
            Send
          </button>
        </div>
        <p style={{
          margin: 0,
          marginTop: theme.spacing[2],
          fontSize: theme.typography.size.xs,
          color: t.text.muted,
        }}>
          Enter sends · Shift+Enter for new line · + to attach image
        </p>
      </div>
    </div>
  );
}
