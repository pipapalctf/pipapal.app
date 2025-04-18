import { cn } from "@/lib/utils";
import logoImage from "@assets/pipapal-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
  className?: string;
}

export default function Logo({ 
  size = "md", 
  variant = "default",
  className 
}: LogoProps) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };
  
  // Apply filter for white variant
  const filterClass = variant === "white" ? "brightness-0 invert" : "";
  
  return (
    <img 
      src={logoImage} 
      alt="PipaPal Logo" 
      className={cn(sizeClasses[size], filterClass, className)}
    />
  );
}
