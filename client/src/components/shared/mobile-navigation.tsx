import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const getNavLinks = () => {
    const links = [
      { href: "/dashboard", label: "Home", icon: "home", active: location === "/dashboard" },
      { href: "/ecotips", label: "Tips", icon: "lightbulb", active: location === "/ecotips" },
      { href: "/impact", label: "Impact", icon: "chart-pie", active: location === "/impact" },
      { href: "/recycling-centers", label: "Centers", icon: "map-marker-alt", active: location === "/recycling-centers" },
      // Profile button removed to avoid scrolling issues on mobile
    ];
    
    // Add user-specific links
    if (user?.role === UserRole.HOUSEHOLD) {
      links.splice(1, 0, { 
        href: "/schedule-pickup", 
        label: "Schedule", 
        icon: "calendar-alt", 
        active: location === "/schedule-pickup" 
      });
    } else if (user?.role === UserRole.COLLECTOR) {
      links.splice(1, 0, { 
        href: "/collections", 
        label: "Collections", 
        icon: "truck", 
        active: location === "/collections" 
      });
    } else if (user?.role === UserRole.RECYCLER) {
      links.splice(1, 0, { 
        href: "/materials", 
        label: "Materials", 
        icon: "recycle", 
        active: location === "/materials" 
      });
    } else if (user?.role === UserRole.ORGANIZATION) {
      links.splice(1, 0, { 
        href: "/schedule-pickup", 
        label: "Schedule", 
        icon: "calendar-alt", 
        active: location === "/schedule-pickup" 
      });
    }
    
    return links;
  };
  
  const navLinks = getNavLinks();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-1 md:hidden z-40">
      <div className="flex justify-evenly px-1 w-full">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center ${
              link.active ? "text-primary" : "text-gray-500"
            }`}
          >
            <i className={`fas fa-${link.icon} text-lg`}></i>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
