import { UserRoleType } from "@shared/schema";

// Navigation item interface
export interface NavItem {
  href: string;
  label: string;
  icon: string;
  description?: string;
}

// Role-based navigation configuration
export const roleBasedNavigation: Record<string, NavItem[]> = {
  // All users see these base pages
  common: [
    { href: "/", label: "Dashboard", icon: "home" },
    { href: "/profile", label: "Profile", icon: "user" },
  ],
  
  // Role-specific pages
  user: [
    { href: "/schedule", label: "Schedule Collection", icon: "calendar-alt" },
    { href: "/ecotips", label: "EcoTips", icon: "lightbulb" },
    { href: "/impact", label: "Impact", icon: "chart-pie" },
  ],
  
  collector: [
    { href: "/collector-dashboard", label: "Collector Dashboard", icon: "truck" },
    { href: "/routes", label: "Collection Routes", icon: "route" },
    { href: "/assignments", label: "Assignments", icon: "clipboard-list" },
  ],
  
  recycler: [
    { href: "/inventory", label: "Inventory", icon: "boxes" },
    { href: "/processing", label: "Processing", icon: "recycle" },
    { href: "/impact", label: "Environmental Impact", icon: "leaf" },
  ],
  
  admin: [
    { href: "/users", label: "User Management", icon: "users" },
    { href: "/analytics", label: "Analytics", icon: "chart-bar" },
    { href: "/settings", label: "System Settings", icon: "cog" },
  ]
};

// Get navigation items for a specific user role
export function getNavigation(role: UserRoleType): NavItem[] {
  const baseNavItems = roleBasedNavigation.common || [];
  const roleNavItems = roleBasedNavigation[role.toLowerCase()] || [];
  
  return [...baseNavItems, ...roleNavItems];
}