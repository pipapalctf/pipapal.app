import { Link, useLocation } from "wouter";
import Logo from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  Truck, 
  Recycle, 
  Calendar, 
  MessageSquare, 
  MapPin, 
  LayoutDashboard, 
  Lightbulb, 
  BarChart, 
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserRole } from "@shared/schema";

// Define a type for navigation links
interface NavLink {
  href: string;
  label: string;
  active: boolean;
  icon?: React.ReactNode;
}

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic navigation links based on user role
  const navLinks = useMemo<NavLink[]>(() => {
    const links: NavLink[] = [
      { 
        href: "/dashboard", 
        label: "Dashboard", 
        active: location === "/dashboard",
        icon: <LayoutDashboard className="w-4 h-4 mr-1" />
      },
      { 
        href: "/ecotips", 
        label: "EcoTips", 
        active: location === "/ecotips",
        icon: <Lightbulb className="w-4 h-4 mr-1" />
      },
      { 
        href: "/impact", 
        label: "Impact", 
        active: location === "/impact",
        icon: <BarChart className="w-4 h-4 mr-1" />
      },
      { 
        href: "/recycling-centers", 
        label: "Recycling Centers", 
        active: location === "/recycling-centers",
        icon: <MapPin className="w-4 h-4 mr-1" />
      },
    ];
    
    // Add collector-specific links
    if (user?.role === UserRole.COLLECTOR) {
      links.push({
        href: "/collections",
        label: "Collections",
        active: location === "/collections",
        icon: <Truck className="w-4 h-4 mr-1" />
      });
    } 
    // Add recycler-specific links
    else if (user?.role === UserRole.RECYCLER) {
      links.push({
        href: "/materials",
        label: "Materials",
        active: location === "/materials",
        icon: <Recycle className="w-4 h-4 mr-1" />
      });
    }
    // Add household-specific links
    else if (user?.role === UserRole.HOUSEHOLD || user?.role === UserRole.ORGANIZATION) {
      links.push({
        href: "/schedule-pickup",
        label: "Schedule Collection",
        active: location === "/schedule-pickup",
        icon: <Calendar className="w-4 h-4 mr-1" />
      });
    }
    
    return links;
  }, [location, user?.role]);

  function handleLogout() {
    logoutMutation.mutate();
  }

  if (!user) return null;

  return (
    <header className="bg-white shadow-xl sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Logo size="md" />
          <span className="ml-2 text-2xl font-montserrat font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">PipaPal</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors font-medium flex items-center ${
                link.active ? "text-primary" : "text-secondary hover:text-primary"
              }`}
            >
              {link.icon && link.icon}
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              href="/chat" 
              className={`transition-colors ${
                location === "/chat" ? "text-primary" : "text-secondary hover:text-primary"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </Link>
            <NotificationBell />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" size="icon">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-white">
                    {user?.fullName?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{user.fullName}</DropdownMenuItem>
              <DropdownMenuItem>
                <span className="capitalize">{user.role} Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => window.location.href = "/profile"}>Profile Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5 text-secondary" />
          </Button>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t py-4 px-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium flex items-center ${
                  link.active ? "text-primary" : "text-secondary hover:text-primary"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.icon && link.icon}
                {link.label}
              </Link>
            ))}
            <Link
              href="/chat"
              className={`transition-colors font-medium flex items-center ${
                location === "/chat" ? "text-primary" : "text-secondary hover:text-primary"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Messages
            </Link>
            <Link
              href="/profile"
              className={`transition-colors font-medium flex items-center ${
                location === "/profile" ? "text-primary" : "text-secondary hover:text-primary"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User className="w-4 h-4 mr-1" />
              Profile
            </Link>
            <div className="flex items-center justify-between mt-2 border-t border-gray-100 pt-2">
              <div className="py-2">
                <NotificationBell />
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
