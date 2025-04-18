import { cn } from "@/lib/utils";
import { 
  Lightbulb, 
  Droplet, 
  Sun, 
  Recycle, 
  Trash2, 
  Users, 
  LifeBuoy,
  Leaf,
  Wind,
  Car,
  Layers
} from "lucide-react";

interface IconBadgeProps {
  icon: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
}

export function IconBadge({
  icon,
  className,
  bgColor = "bg-primary/20",
  textColor = "text-primary",
  size = "md"
}: IconBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-xl"
  };

  // Map icon names to Lucide components
  const getIconComponent = () => {
    const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24;
    
    switch(icon) {
      case 'lightbulb':
        return <Lightbulb size={iconSize} />;
      case 'tint':
      case 'water':
        return <Droplet size={iconSize} />;
      case 'sun':
      case 'energy':
        return <Sun size={iconSize} />;
      case 'recycle':
      case 'recycling':
        return <Recycle size={iconSize} />;
      case 'trash':
      case 'trash-alt':
      case 'waste':
        return <Trash2 size={iconSize} />;
      case 'users':
        return <Users size={iconSize} />;
      case 'seedling':
      case 'plant':
        return <Leaf size={iconSize} />;
      case 'plastic':
        return <Layers size={iconSize} />;
      case 'transportation':
        return <Car size={iconSize} />;
      case 'composting':
        return <Wind size={iconSize} />;
      default:
        return <Lightbulb size={iconSize} />;
    }
  };
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        bgColor,
        textColor,
        sizeClasses[size],
        className
      )}
    >
      {getIconComponent()}
    </div>
  );
}
