import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@shared/schema";
import { badgeConfig } from "@/lib/types";
import { Loader2, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileBadges() {
  const { user } = useAuth();
  
  const { data: badges, isLoading } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });
  
  if (!user) return null;
  
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-green-500 p-5 text-white">
        <div className="flex items-center">
          <Avatar className="h-16 w-16 border-2 border-white">
            <AvatarFallback className="bg-white text-primary text-xl">
              {user.fullName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <h3 className="text-xl font-bold">{user.fullName}</h3>
            <p className="opacity-90 capitalize">{user.role} Account</p>
          </div>
        </div>
      </div>
      <CardContent className="p-5">
        <h4 className="font-montserrat font-bold text-secondary mb-3">Your Badges</h4>
        
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : badges && badges.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {badges.slice(0, 3).map((badge) => {
              const badgeInfo = badgeConfig[badge.badgeType as keyof typeof badgeConfig];
              
              return (
                <div key={badge.id} className="flex flex-col items-center">
                  <IconBadge 
                    icon={badgeInfo.icon} 
                    size="lg"
                    bgColor={badgeInfo.bgColor}
                    textColor={badgeInfo.textColor}
                    className="mb-1"
                  />
                  <span className="text-xs text-center">{badgeInfo.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">
            No badges earned yet. Start recycling to earn badges!
          </p>
        )}
        
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-secondary">Sustainability Score</h4>
              <div className="flex items-center mt-1">
                <div className="text-2xl font-bold text-primary">{user.sustainabilityScore || 0}</div>
                {user.sustainabilityScore > 0 && (
                  <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">+12</div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
