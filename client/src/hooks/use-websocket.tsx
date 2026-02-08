import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  reconnect: () => {},
});

export const useWebSocketContext = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const { user } = useAuth();

  const connectWebSocket = () => {
    if (!user) {
      setSocket(null);
      setConnected(false);
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    // Connection opened
    ws.addEventListener('open', () => {
      console.log('WebSocket connected');
      
      // Authenticate the WebSocket connection with the user ID
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    });

    // Handle messages
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', event.data);
        
        // Handle connection status updates
        if (data.type === '_system' && data.event === 'connection_status') {
          console.log('WebSocket connection status:', data.status);
          setConnected(data.status === 'connected');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle errors
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    });

    // Handle close
    ws.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      // Reconnect after a delay
      setTimeout(() => {
        if (user) connectWebSocket();
      }, 5000);
    });

    setSocket(ws);
  };

  // Connect when component mounts and user is authenticated
  useEffect(() => {
    if (user && !socket) {
      connectWebSocket();
    }
    
    // Clean up on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user]);

  // Reconnect if user changes
  useEffect(() => {
    if (socket && user) {
      socket.close();
      connectWebSocket();
    }
  }, [user?.id]);

  // Provide a reconnect function
  const reconnect = () => {
    if (socket) {
      socket.close();
    }
    connectWebSocket();
  };

  return (
    <WebSocketContext.Provider value={{ socket, connected, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};