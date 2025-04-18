import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { 
  Recycle, 
  Trash2, 
  Leaf, 
  LineChart, 
  BarChart, 
  Droplet, 
  LucideIcon,
  Zap,
  Wine,
  ScrollText,
  LucideProps
} from "lucide-react";

// Map of string icon names to Lucide components
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  recycle: Recycle,
  dumpster: Trash2,
  leaf: Leaf,
  "chart-line": LineChart,
  "chart-bar": BarChart,
  droplet: Droplet,
  energy: Zap,
  "wine-glass": Wine,
  receipt: ScrollText
};

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
  iconClass = "text-white",
  gradient = "bg-gradient-to-br from-primary-light to-primary",
  textColor = "text-white",
  increase
}: StatCardProps) {
  // Use a fallback icon if the name doesn't exist in our map
  const IconComponent = iconMap[icon] || Recycle;
  
  return (
    <Card className={`p-5 ${gradient}`}>
      <div className="flex items-center justify-between">
        <div className={textColor}>
          <p className="font-medium opacity-90">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {subtitle && <p className="text-sm mt-2 opacity-90">{subtitle}</p>}
        </div>
        <div className="h-12 w-12 rounded-full bg-white/30 flex items-center justify-center">
          <IconComponent className={iconClass} size={24} />
        </div>
      </div>
    </Card>
  );
}
