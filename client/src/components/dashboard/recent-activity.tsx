import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });
  
  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities && activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map(activity => {
              // Use timestamp if available, otherwise fallback to createdAt
              const date = activity.timestamp ? new Date(activity.timestamp) : 
                           activity.createdAt ? new Date(activity.createdAt) : new Date();
              const timeAgo = formatDistanceToNow(date, { addSuffix: true });
              
              return (
                <li key={activity.id} className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 mr-2"></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: activity.description }}></p>
                      {activity.points && (
                        <span className="ml-2 flex-shrink-0 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          +{activity.points} pts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-4 text-center text-gray-500">
            No recent activity
          </div>
        )}
        
        {activities && activities.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="link" className="text-primary text-sm font-medium">
              View All Activity
              <i className="fas fa-chevron-right ml-1 text-xs"></i>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
