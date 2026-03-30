import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import api from '../lib/api';

export interface Notification {
    id: number;
    title: string;
    body: string;
    data: any;
    readAt: string | null;
    createdAt: string;
}

interface NotificationContextType {
    isConnected: boolean;
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (ids: number[] | 'all') => Promise<void>;
    subscribeToPush: () => Promise<void>;
    isPushSupported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const useNotifications = () => useContext(NotificationContext);

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Push notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Audio is created on demand to avoid persistent connection/cache issues in some browsers
  const playSound = () => {
    try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => {
            console.warn('Notification sound blocked:', e);
        });
    } catch (e) {
        console.error('Audio setup failed:', e);
    }
  };

  const shouldNotify = (eventType: string, data: any): boolean => {
    const isClientPage = window.location.pathname.startsWith('/dine-in') || 
                         window.location.pathname.startsWith('/takeout') ||
                         window.location.pathname.startsWith('/book') ||
                         window.location.pathname.startsWith('/track');
    if (isClientPage) return false;
    
    if (!user) return false;

    const role = user.role;

    switch (eventType) {
      case 'order:new':
        if (role === 'admin' || role === 'super_admin' || role === 'salle') return true;
        if (role === 'serveur') return data.type === 'dine_in';
        if (role === 'livreur') return false;
        if (role === 'comptable') return false;
        if (role === 'caissier') return true;
        return true;
      case 'call:new':
        if (role === 'serveur' || role === 'admin' || role === 'super_admin') return true;
        return false;
      case 'order:update':
        if (role === 'livreur') return data.deliveryPersonId === user.id;
        if (role === 'comptable') return false;
        return true;
      case 'delivery:assigned':
        return user.id === data.deliveryPersonId;
      case 'reservation:new':
        if (role === 'serveur' || role === 'admin' || role === 'super_admin') return true;
        return false;
      default:
        return true;
    }
  };

  const getOrderTypeLabel = (type: string): string => {
    switch (type) {
      case 'takeout': return '🥡 À Emporter';
      case 'delivery': return '🛵 Livraison';
      case 'dine_in': return '🍽️ Sur Place';
      default: return '📦 Commande';
    }
  };

  const getOrderLocation = (data: any): string => {
    if (data.type === 'dine_in' && data.tableName) return `Table ${data.tableName}`;
    if (data.type === 'takeout' && data.clientName) return data.clientName;
    if (data.type === 'delivery' && data.clientName) return data.clientName;
    return '';
  };

  // Push notifications lifecycle
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  useEffect(() => {
      if (user) {
          fetchNotifications()
          const interval = setInterval(fetchNotifications, 60000)

          if ('serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'default') {
              requestPermission()
          }

          return () => clearInterval(interval)
      }
  }, [user])

  const checkSubscription = async () => {
      try {
          const registrationPromise = navigator.serviceWorker.ready;
          const timeoutPromise = new Promise<ServiceWorkerRegistration | undefined>((resolve) => setTimeout(() => resolve(undefined), 2000));
          const registration = await Promise.race([registrationPromise, timeoutPromise]);
          
          if (!registration) return;

          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
      } catch (e) {
          console.error('Error checking subscription', e)
      }
  }

  const fetchNotifications = async () => {
      setLoading(true)
      try {
          const response = await api.get('/admin/notifications')
          setNotifications(response.data.notifications)
          setUnreadCount(Number(response.data.unreadCount))
      } catch (error) {
          console.error('Failed to fetch notifications', error)
      } finally {
          setLoading(false)
      }
  }

  const markAsRead = async (ids: number[] | 'all') => {
      try {
          await api.post('/admin/notifications/read', { ids })
          if (ids === 'all') {
              setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
              setUnreadCount(0)
          } else {
              setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n))
              setUnreadCount(prev => Math.max(0, prev - ids.length))
          }
      } catch (error) {
          console.error('Failed to mark read', error)
      }
  }

  const requestPermission = async () => {
      if (!isPushSupported) return;
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
          subscribeToPush()
      }
  }

  const subscribeToPush = async () => {
      if (!isPushSupported) return
      if (!VAPID_PUBLIC_KEY) {
          console.error('VAPID Public Key not configured')
          return
      }

      try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          })

          const keys = subscription.toJSON().keys
          await api.post('/admin/notifications/subscribe', {
              endpoint: subscription.endpoint,
              keys
          })

          setIsSubscribed(true)
      } catch (error) {
          console.error('Failed to subscribe to push', error)
          setPermission(Notification.permission)
      }
  }

  // SSE Lifecycle
  useEffect(() => {
    if (!user) return; // Only connect SSE if user exists

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
    
    const streamUrl = apiUrl.endsWith('/api') 
        ? `${apiUrl}/stream` 
        : `${apiUrl.replace(/\/$/, '')}/api/stream`;
    
    const eventSource = new EventSource(streamUrl, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => console.log('SSE Connected');
    eventSource.onerror = (e) => console.log('SSE Error', e);

    eventSource.addEventListener('order:new', (e) => {
      const data = JSON.parse(e.data);
      if (!shouldNotify('order:new', data)) return;
      playSound();
      fetchNotifications(); // Refresh notifications
      toast.success(`Nouvelle Commande #${data.dailyNumber}`, {
          description: `${getOrderTypeLabel(data.type)} • ${getOrderLocation(data)} • ${data.totalFormatted}`,
          duration: 10000,
          action: { label: 'Voir', onClick: () => window.location.href = '/admin/orders' }
      });
    });

    eventSource.addEventListener('call:new', (e) => {
      const data = JSON.parse(e.data);
      if (!shouldNotify('call:new', data)) return;
      playSound();
      fetchNotifications();
      const callTypeText = data.callType === 'bill' ? "Addition demandée" : "Appel client";
      toast.info(`🔔 ${callTypeText}`, {
          description: `Table ${data.tableName}`,
          duration: Infinity,
          action: { label: 'Voir', onClick: () => window.location.href = '/admin/calls' }
      });
    });

    eventSource.addEventListener('driver:location', (e) => {
      const data = JSON.parse(e.data);
      window.dispatchEvent(new CustomEvent('sse:message', {
        detail: { type: 'driver:location', payload: data }
      }));
    });

    eventSource.addEventListener('order:update', (e) => {
      const data = JSON.parse(e.data);
      if (!shouldNotify('order:update', data)) return;
      if (data.status === 'cancelled') {
          playSound();
          toast.error(`Commande #${data.dailyNumber} Annulée`, {
              description: `${getOrderTypeLabel(data.type)} • ${getOrderLocation(data)}`,
              duration: 10000
          });
      } else if (data.status === 'delivered') {
          playSound(); 
          toast.success(`Commande #${data.dailyNumber} Servie`, {
              description: `${getOrderTypeLabel(data.type)} • ${getOrderLocation(data)}`,
              duration: 5000
          });
      }
    });

    eventSource.addEventListener('delivery:assigned', (e) => {
        const data = JSON.parse(e.data);
        if (!shouldNotify('delivery:assigned', data)) return;
        playSound();
        fetchNotifications();
        toast.success(`🛵 Nouvelle Course`, {
            description: `Commande #${data.dailyNumber} • ${data.clientName} • ${data.address}`,
            duration: Infinity,
            action: { label: 'Voir', onClick: () => window.location.href = '/delivery' }
        });
    });

    eventSource.addEventListener('reservation:new', (e) => {
        const data = JSON.parse(e.data);
        if (!shouldNotify('reservation:new', data)) return;
        playSound();
        fetchNotifications();
        toast.info(`🗓️ Nouvelle Réservation`, {
            description: `${data.customerName} • ${data.guests} pers. • ${data.time}`,
            duration: Infinity,
            action: { label: 'Voir', onClick: () => window.location.href = '/admin/reservations' }
        });
    });

    return () => {
      eventSource.close();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      isConnected: !!eventSourceRef.current,
      notifications,
      unreadCount,
      loading,
      markAsRead,
      subscribeToPush,
      isPushSupported,
      isSubscribed,
      permission,
      requestPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
