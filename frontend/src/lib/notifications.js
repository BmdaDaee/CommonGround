// Push notification utilities
const API_URL = process.env.REACT_APP_BACKEND_URL;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

export function showLocalNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag || 'commonground',
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

// Poll for notifications and show them
let pollInterval = null;

export function startNotificationPolling(token) {
  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.notifications?.length > 0) {
        const seen = JSON.parse(localStorage.getItem('cg_seen_notifs') || '[]');

        for (const notif of data.notifications) {
          const key = `${notif.type}-${notif.date}`;
          if (!seen.includes(key)) {
            showLocalNotification('CommonGround', notif.message);
            seen.push(key);
          }
        }

        localStorage.setItem('cg_seen_notifs', JSON.stringify(seen.slice(-50)));
      }
    } catch (err) {
      // Silent fail for polling
    }
  }, 60000); // Poll every 60s
}

export function stopNotificationPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
