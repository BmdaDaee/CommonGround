import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  startNotificationPolling,
  stopNotificationPolling,
} from '../lib/notifications';
import theme, { getThemeColors } from '../lib/theme';
import { supabase } from '../lib/supabase';

export default function NotificationSettings() {
  const { mode } = useApp();
  const [permission, setPermission] = useState('default');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    try {
      const { data } = await api.getPushStatus();
      setEnabled(data.enabled);
    } catch (err) {
      // Silent fail
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setPermission(getNotificationPermission());

      if (granted) {
        await registerServiceWorker();
        await api.pushSubscribe('browser-local', { type: 'local' });
        setEnabled(true);

        // Start polling with current session token
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          startNotificationPolling(session.access_token);
        }
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await api.pushUnsubscribe();
      stopNotificationPolling();
      setEnabled(false);
    } catch (err) {
      console.error('Failed to disable notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isNotificationSupported()) {
    return (
      <div style={{
        padding: theme.spacing[4],
        borderRadius: theme.radius.lg,
        background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
      }}>
        <p style={{ fontSize: theme.typography.size.sm, color: t.text.muted }}>
          Notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="notification-settings" style={{
      padding: theme.spacing[4],
      borderRadius: theme.radius.lg,
      background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
      boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold, color: t.text.primary, margin: 0 }}>
            Push Notifications
          </h3>
          <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted, marginTop: theme.spacing[1] }}>
            {enabled
              ? 'You\'ll get alerts for daily questions, partner answers, and messages'
              : 'Enable to get notified about daily questions and partner activity'}
          </p>
        </div>
        <button
          data-testid="toggle-notifications-btn"
          onClick={enabled ? handleDisable : handleEnable}
          disabled={loading || permission === 'denied'}
          style={{
            padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
            borderRadius: theme.radius.round,
            border: 'none',
            background: enabled ? t.accent.primary : (mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'),
            color: enabled ? '#FFFFFF' : t.text.secondary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
            cursor: loading || permission === 'denied' ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '...' : enabled ? 'Enabled' : 'Enable'}
        </button>
      </div>
      {permission === 'denied' && (
        <p style={{ fontSize: theme.typography.size.xs, color: '#EF4444', marginTop: theme.spacing[2] }}>
          Notifications are blocked. Please enable them in your browser settings.
        </p>
      )}
    </div>
  );
}
