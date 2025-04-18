import { cn } from "@/lib/utils";

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
    sm: "h-10",
    md: "h-12",
    lg: "h-16"
  };
  
  const bgColorClass = variant === "white" ? "bg-white" : "bg-transparent";
  
  return (
    <svg 
      viewBox="0 0 500 500" 
      className={cn(sizeClasses[size], className)}
      aria-label="PipaPal Logo"
    >
      <circle 
        cx="250" 
        cy="250" 
        r="230" 
        fill="none" 
        stroke="#2ECC71" 
        strokeWidth="40" 
      />
      
      <circle cx="150" cy="250" r="40" fill="#2ECC71" />
      <circle cx="350" cy="250" r="40" fill="#2ECC71" />
      
      <path 
        d="M250,350 Q200,300 200,250 Q200,200 250,200 Q300,200 300,250" 
        fill="none" 
        stroke="#2ECC71" 
        strokeWidth="40" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
