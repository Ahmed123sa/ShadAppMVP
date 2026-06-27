import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getUser } from './auth';

let echoInstance: Echo<any> | null = null;

export function getEcho(): Echo<any> | null {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;

  const user = getUser();
  if (!user) return null;

  const token = localStorage.getItem('token');
  if (!token) return null;

  (window as any).Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_KEY || 'shadapp-key',
    authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
    reverb: {
      driver: 'reverb',
      host: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
      port: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080', 10),
      scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http',
    },
  });

  return echoInstance;
}

export function subscribeToNotifications(callback: (notification: any) => void): (() => void) | null {
  const echo = getEcho();
  if (!echo) return null;

  const user = getUser();
  if (!user) return null;

  const channel = echo.private(`App.Models.User.${user.id}`);
  channel.listen('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', (e: any) => {
    callback(e);
  });

  return () => {
    channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
    echo.leaveChannel(`private-App.Models.User.${user.id}`);
  };
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
