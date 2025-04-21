import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

type NotificationType = 'notification' | 'collection_update' | 'new_collection';
// System events that should not be displayed as notifications
type SystemEventType = '_system';
// Legacy type kept for backward compatibility with existing server code
type LegacyType = 'connection_status';
type WSEventType = NotificationType | SystemEventType | LegacyType;

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  timestamp: Date;
  collectionId?: number;
  status?: string;
};

// Define a type for collection data sent in new_collection events
type CollectionData = {
  id: number;
  wasteType: string;
  wasteAmount: number | null;
  address: string;
  status: string;
  scheduledDate: Date | string;
};

type WebSocketMessageEvent = {
  type: WSEventType;
  event?: string;
  message?: string;
  collectionId?: number;
  status?: string;
  collection?: CollectionData; // For new collection events with collection data
};

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!user) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket.current = new WebSocket(wsUrl);
    
    socket.current.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // Authenticate with the server
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      }
    };
    
    socket.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        connect();
      }, 3000);
    };
    
    socket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socket.current.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const data: WebSocketMessageEvent = JSON.parse(event.data);
        
        // Handle system messages separately and silently
        if (data.type === '_system') {
          // Handle connection status
          if (data.event === 'connection_status') {
            console.log(`WebSocket connection status: ${data.status || 'unknown'}`);
            setConnected(data.status === 'connected');
          }
          // Don't create notifications for system messages
          return;
        }
        
        // Handle legacy connection_status messages (don't display notification)
        if (data.type === 'connection_status') {
          console.log(`WebSocket connection status (legacy): ${data.status || 'unknown'}`);
          setConnected(data.status === 'connected');
          return;
        }
        
        // Only proceed if this is a notification message with actual content
        if (!data.message) {
          return;
        }
        
        // At this point we know it's a notification type with a message
        
        // Filter out connection status messages to prevent them from appearing in the notification bell
        if (data.message === "Connected to real-time notifications") {
          return;
        }
        
        // Determine notification type
        const notificationType: NotificationType = 
          ['notification', 'collection_update', 'new_collection'].includes(data.type as string)
            ? data.type as NotificationType
            : 'notification'; // Fallback to generic notification
            
        const newNotification: Notification = {
          id: Math.random().toString(36).substring(2, 9),
          type: notificationType,
          message: data.message,
          read: false,
          timestamp: new Date(),
          collectionId: data.collectionId,
          status: data.status
        };
        
        // Add notification to state
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast notifications based on event type
        let toastTitle = 'New Notification';
        
        if (data.type === 'collection_update') {
          toastTitle = 'Collection Update';
        } else if (data.type === 'new_collection') {
          toastTitle = 'New Collection Available';
        }
        
        toast({
          title: toastTitle,
          description: data.message,
          variant: "default",
        });
        
        // Refresh data based on event type
        if (data.type === 'collection_update' || data.type === 'new_collection') {
          // Invalidate all collection queries to ensure fresh data
          console.log(`Refreshing collections data due to ${data.type} event`);
          console.log('Event details:', JSON.stringify(data));
          
          // Force a refresh by invalidating the queries
          queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
          queryClient.invalidateQueries({ queryKey: ['/api/collections/upcoming'] });
          
          // For collector-specific views
          if (user.role === 'collector') {
            console.log('Refreshing collector-specific collection data');
            if (data.type === 'new_collection') {
              console.log('New collection notification received by a collector');
              if (data.collection) {
                console.log('Collection data:', JSON.stringify(data.collection));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [user, toast]);
  
  // Connect when the user is available
  useEffect(() => {
    if (user) {
      const cleanup = connect();
      return cleanup;
    }
  }, [user, connect]);
  
  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);
  
  // Clear a notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  }, []);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    connected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  };
}