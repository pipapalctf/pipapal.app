import { cn } from "@/lib/utils";

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
      <i className={`fas fa-${icon}`}></i>
    </div>
  );
}
