import React from "react";
import { cn } from "@/lib/utils";
import { 
  Check, Award, Droplet, Heart, Leaf, Medal, Recycle, Zap, 
  LifeBuoy, Star, ShieldCheck, LucideProps
} from "lucide-react";

// Import additional icons that we need
import { 
  Trash2, Newspaper, Wine, ShoppingBag, Cpu, Apple, 
  FlaskConical, Package, File, Settings, Car
} from "lucide-react";

// Map of string icon names to Lucide components
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  award: Award,
  check: Check,
  droplet: Droplet,
  heart: Heart,
  leaf: Leaf,
  medal: Medal,
  recycle: Recycle,
  zap: Zap,
  shield: ShieldCheck,
  star: Star,
  lifebuoy: LifeBuoy,
  trash: Trash2,
  file: File,
  "wine-glass": Wine,
  "shopping-bag": ShoppingBag,
  cpu: Cpu,
  apple: Apple,
  flask: FlaskConical,
  package: Package,
  settings: Settings
};

type IconBadgeProps = {
  icon: string; // Icon name that corresponds to a Lucide icon
  bgColor: string;
  textColor: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function IconBadge({ 
  icon, 
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
  
  // Use a fallback icon if the name doesn't exist in our map
  const IconComponent = iconMap[icon] || Award;
  
  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center",
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      <IconComponent className={cn("text-current", textColor)} size={iconSizes[size]} />
    </div>
  );
}