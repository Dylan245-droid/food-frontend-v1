import React, { createContext, useContext, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface NotificationContextType {
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({ isConnected: false });

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3'); 
    // Preload?
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
    }
  };

  useEffect(() => {
    // Determine API URL (if proxy is used, relative path works, else full URL)
    // Assuming Vite proxy set up for /api -> backend.
    
    // Polyfill or native EventSource
    // Use env var to construct full URL, handling potential trailing slash issues
    // Use env var to construct full URL
    // VITE_API_URL usually is "http://localhost:3333/api"
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
    
    // Ensure we don't double slash or miss /api
    // If apiUrl ends with /api, we append /stream -> .../api/stream
    // If apiUrl is just root, we append /api/stream
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
      // EventSource automatically reconnects, but sometimes we might want to manually handle
    };

    // --- LISTENERS ---

    // 1. New Order (Kitchen)
    eventSource.addEventListener('order:new', (e) => {
      const data = JSON.parse(e.data);
      console.log('New Order:', data);
      
      // Filter: Only show "New Order" notifications if we are in Admin/Staff context?
      // Or just valid for everyone? Clients don't need to know about OTHER clients' orders.
      // Ideally, we should filter by context.
      // But for this simple implementation:
      // If `type` is present, it's Kitchen relevant. 
      // If we are on Client page, we might want to ignore global kitchen alerts?
      // Simple Hack: Check URL or LocalStorage to guess role?
      // Or just toast everything and verify user ignores what's not relevant?
      
      // Let's rely on Toast being dismissible.
      const isClient = window.location.pathname.startsWith('/dine-in') || window.location.pathname.startsWith('/takeout');
      
      if (!isClient) {
          playSound();
          toast.success(`Nouvelle Commande #${data.dailyNumber}`, {
              description: data.type === 'takeout' 
                ? `🥡 À EMPORTER - ${data.clientName} (${data.totalFormatted})`
                : `🍽️ SUR PLACE - Table ${data.tableName} (${data.totalFormatted})`,
              duration: 10000,
              action: {
                  label: 'Voir',
                  onClick: () => window.location.href = '/admin/orders'
              }
          });
      }
    });

    // 2. Server Call (Waiters)
    eventSource.addEventListener('call:new', (e) => {
      const data = JSON.parse(e.data);
      const isClient = window.location.pathname.startsWith('/dine-in') || window.location.pathname.startsWith('/takeout');

      if (!isClient) {
          playSound();
          toast.info(`Appel - ${data.tableName}`, {
              description: data.callType === 'bill' ? "Demande d'addition 💳" : "Besoin d'aide 🔔",
              duration: Infinity, // Sticky until clicked
              action: {
                  label: 'Voir',
                  onClick: () => window.location.href = '/admin/server-calls'
              }
          });
      }
    });

    // 3. Order Status Update (Client)
    eventSource.addEventListener('order:update', (e) => {
      const data = JSON.parse(e.data);
      
      // Check if this update concerns the current user (Client sticky session)
      // Check if this update concerns the current user (Client sticky session)
      // const activeCode = localStorage.getItem('activeTableCode');
      
      // If we are a client and this order belongs to OUR table (how do we know? We don't have table code in data yet, let's add it)
      // I added tableName to order:update in backend.
      // But ideally we check Order ID against our local order list.
      // Since we don't have local order list in context, we can just say:
      // If we are on DineInPage, we refresh orders anyway via SWR/Poll?
      // But we want a Toast.
      
      // For now, let's show Toast if it matches typical client scenario
      // Or if we are Admin, we might want to know status changed?
      
      // For Client:
      // If data.status === 'delivered' -> "Votre commande est servie !"
      
      // We need to know if this update is for US.
      // Let's filter loosely:
      // If on /dine-in/:code, and data.tableName matches? Or request refresh.
      
      // Simpler: Just Trigger a global event or refresh signal?
      // For the "Push Notification" request, the user likely wants "Ding! Votre plat est prêt".
      
      const isClient = window.location.pathname.startsWith('/dine-in') || window.location.pathname.startsWith('/takeout');
      
      if (data.status === 'cancelled') {
           if (!isClient) {
               playSound();
               toast.error(`Commande #${data.dailyNumber} Annulée`, {
                   description: `Table ${data.tableName || '?'}`,
                   duration: 10000
               });
           }
      } else if (data.status === 'delivered') {
           if (!isClient) {
               // Optional: specific sound for success?
               playSound(); 
               toast.success(`Commande #${data.dailyNumber} Servie !`, {
                   description: `Table ${data.tableName || '?'}`,
                   duration: 5000
               });
           }
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ isConnected: true }}>
      {children}
    </NotificationContext.Provider>
  );
};
