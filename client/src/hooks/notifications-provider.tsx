import { createContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/use-notifications';

export const NotificationsContext = createContext<ReturnType<typeof useNotifications> | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const notificationsValue = useNotifications();
  
  return (
    <NotificationsContext.Provider value={notificationsValue}>
      {children}
    </NotificationsContext.Provider>
  );
}