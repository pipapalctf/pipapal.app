import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { Collection } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { collectionStatusConfig, wasteTypeConfig } from "@/lib/types";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UpcomingCollections() {
  const { data: collections, isLoading, error } = useQuery<Collection[]>({
    queryKey: ["/api/collections/upcoming"],
  });

  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <CardTitle>Upcoming Collections</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            Failed to load collections
          </div>
        ) : collections && collections.length > 0 ? (
          <>
            {collections.map((collection) => {
              const wasteConfig = wasteTypeConfig[collection.wasteType as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;
              const statusConfig = collectionStatusConfig[collection.status as keyof typeof collectionStatusConfig];
              const formattedDate = format(
                new Date(collection.scheduledDate),
                "EEEE, d MMMM - h:mm a"
              );
              
              return (
                <div 
                  key={collection.id} 
                  className="flex items-center justify-between py-4 border-b border-gray-100"
                >
                  <div className="flex items-center">
                    <IconBadge 
                      icon={wasteConfig.icon} 
                      bgColor={wasteConfig.bgColor}
                      textColor={wasteConfig.textColor}
                    />
                    <div className="ml-4">
                      <h4 className="font-medium text-secondary">{wasteConfig.label}</h4>
                      <p className="text-sm text-gray-500">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className={`px-3 py-1 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} font-medium`}
                    >
                      {statusConfig.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <i className="fas fa-ellipsis-v text-gray-400"></i>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No upcoming collections scheduled
          </div>
        )}

        <div className="mt-5 text-center">
          <Link href="/schedule">
            <Button variant="outline" className="bg-white">
              <Plus className="mr-2 h-4 w-4" />
              Schedule New Collection
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
