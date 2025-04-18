import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconClass?: string;
  gradient: string;
  textColor?: string;
  increase?: string | number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass = "text-white text-xl",
  gradient = "bg-gradient-to-br from-primary-light to-primary",
  textColor = "text-white",
  increase
}: StatCardProps) {
  return (
    <Card className={`p-5 ${gradient}`}>
      <div className="flex items-center justify-between">
        <div className={textColor}>
          <p className="font-medium opacity-90">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {subtitle && <p className="text-sm mt-2 opacity-90">{subtitle}</p>}
        </div>
        <div className="h-12 w-12 rounded-full bg-white/30 flex items-center justify-center">
          <i className={`fas fa-${icon} ${iconClass}`}></i>
        </div>
      </div>
    </Card>
  );
}
