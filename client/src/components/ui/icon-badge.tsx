import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type IconBadgeProps = {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function IconBadge({ 
  icon: Icon, 
  bgColor, 
  textColor, 
  size = "md", 
  className 
}: IconBadgeProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  
  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center",
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      <Icon className={cn("text-current", textColor)} size={iconSizes[size]} />
    </div>
  );
}