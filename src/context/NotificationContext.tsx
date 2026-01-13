import React, { createContext, useContext, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({ isConnected: false });

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3'); 
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
    }
  };

  // Helper: Check if current user should see this notification based on role
  const shouldNotify = (eventType: string, data: any): boolean => {
    // Client pages never see staff notifications
    const isClientPage = window.location.pathname.startsWith('/dine-in') || 
                         window.location.pathname.startsWith('/takeout') ||
                         window.location.pathname.startsWith('/book') ||
                         window.location.pathname.startsWith('/track');
    if (isClientPage) return false;
    
    // No user = no notifications
    if (!user) return false;

    const role = user.role;

    switch (eventType) {
      case 'order:new':
        // Kitchen staff and managers see all new orders
        // Servers only see dine-in orders
        // Delivery drivers don't see new orders here (they get delivery:assigned)
        if (role === 'admin' || role === 'super_admin' || role === 'salle') return true;
        if (role === 'serveur') return data.type === 'dine_in';
        if (role === 'livreur') return false;
        if (role === 'comptable') return false;
        if (role === 'caissier') return true;
        return true;
      
      case 'call:new':
        // Only servers, admins, and managers need to see server calls
        if (role === 'serveur' || role === 'admin' || role === 'super_admin') return true;
        return false;
      
      case 'order:update':
        // Status updates are for kitchen and servers
        if (role === 'livreur') return data.deliveryPersonId === user.id; // Livreur sees their own orders
        if (role === 'comptable') return false;
        return true;
      
      case 'delivery:assigned':
        // Only the assigned delivery driver sees this
        return user.id === data.deliveryPersonId;
      
      case 'reservation:new':
        // Reservations are for front-of-house: servers, admins
        if (role === 'serveur' || role === 'admin' || role === 'super_admin') return true;
        return false;
      
      default:
        return true;
    }
  };

  // Helper: Format notification text based on order type
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

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
    
    const streamUrl = apiUrl.endsWith('/api') 
        ? `${apiUrl}/stream` 
        : `${apiUrl.replace(/\/$/, '')}/api/stream`;
    
    console.log('Connecting to SSE:', streamUrl);
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE Connected');
    };

    eventSource.onerror = (e) => {
      console.log('SSE Error', e);
    };

    // --- LISTENERS ---

    // 1. New Order
    eventSource.addEventListener('order:new', (e) => {
      const data = JSON.parse(e.data);
      console.log('New Order:', data);
      
      if (!shouldNotify('order:new', data)) return;

      playSound();
      toast.success(`Nouvelle Commande #${data.dailyNumber}`, {
          description: `${getOrderTypeLabel(data.type)} • ${getOrderLocation(data)} • ${data.totalFormatted}`,
          duration: 10000,
          action: {
              label: 'Voir',
              onClick: () => window.location.href = '/admin/orders'
          }
      });
    });

    // 2. Server Call
    eventSource.addEventListener('call:new', (e) => {
      const data = JSON.parse(e.data);
      
      if (!shouldNotify('call:new', data)) return;

      playSound();
      const callTypeText = data.callType === 'bill' ? "Addition demandée" : "Appel client";
      toast.info(`🔔 ${callTypeText}`, {
          description: `Table ${data.tableName}`,
          duration: Infinity,
          action: {
              label: 'Voir',
              onClick: () => window.location.href = '/admin/server-calls'
          }
      });
    });

    // 2b. Driver Location (for client-side tracking)
    eventSource.addEventListener('driver:location', (e) => {
      const data = JSON.parse(e.data);
      // Emit custom event for useDriverPositionUpdates hook
      window.dispatchEvent(new CustomEvent('sse:message', {
        detail: { type: 'driver:location', payload: data }
      }));
    });

    // 3. Order Status Update
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

    // 4. Delivery Assigned (Livreur Only)
    eventSource.addEventListener('delivery:assigned', (e) => {
        const data = JSON.parse(e.data);
        console.log('Delivery Assigned:', data);
        
        if (!shouldNotify('delivery:assigned', data)) return;

        playSound();
        toast.success(`🛵 Nouvelle Course`, {
            description: `Commande #${data.dailyNumber} • ${data.clientName} • ${data.address}`,
            duration: Infinity,
            action: {
                label: 'Voir',
                onClick: () => window.location.href = '/delivery'
            }
        });
    });

    // 5. New Web Reservation
    eventSource.addEventListener('reservation:new', (e) => {
        const data = JSON.parse(e.data);
        console.log('New Reservation:', data);
        
        if (!shouldNotify('reservation:new', data)) return;

        playSound();
        toast.info(`🗓️ Nouvelle Réservation`, {
            description: `${data.customerName} • ${data.guests} pers. • ${data.time}`,
            duration: Infinity,
            action: {
                label: 'Voir',
                onClick: () => window.location.href = '/admin/reservations'
            }
        });
    });

    return () => {
      eventSource.close();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ isConnected: true }}>
      {children}
    </NotificationContext.Provider>
  );
};
