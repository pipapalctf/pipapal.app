import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { useLocation } from 'wouter';

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    connected,
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAllNotifications 
  } = useNotifications();
  
  const [open, setOpen] = useState(false);
  const [_, navigate] = useLocation();
  
  const handleViewCollection = (collectionId: number) => {
    markAllAsRead();
    setOpen(false);
    // Navigate to the collection details
    navigate(`/collections/${collectionId}`);
  };
  
  const handleViewChat = (senderId: number) => {
    markAllAsRead();
    setOpen(false);
    // Navigate to the chat page with the specific user
    navigate(`/chat?user=${senderId}`);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex gap-1">
            {notifications.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>
        
        {!connected && (
          <div className="text-amber-500 text-sm mb-2 flex items-center">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></div>
            Reconnecting to notification service...
          </div>
        )}
        
        <div className="max-h-60 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`p-3 mb-2 shadow-sm ${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}
              >
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {notification.type === 'collection_update' 
                      ? 'Collection Update' 
                      : notification.type === 'new_message'
                        ? 'New Message'
                        : notification.type === 'new_collection'
                          ? 'New Collection'
                          : 'Notification'
                    }
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    onClick={() => clearNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm my-1">{notification.message}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(notification.timestamp, 'HH:mm')}
                  </span>
                  {notification.type === 'collection_update' && notification.collectionId && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-xs"
                      onClick={() => handleViewCollection(notification.collectionId!)}
                    >
                      View details
                    </Button>
                  )}
                  {notification.type === 'new_message' && notification.senderId && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-xs"
                      onClick={() => handleViewChat(notification.senderId!)}
                    >
                      Reply
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}