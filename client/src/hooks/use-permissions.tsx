import { useAuth } from "@/hooks/use-auth";
import { UserRole, UserRoleType } from "@shared/schema";

// Define permission types that match backend 
export type Permission = {
  name: string;
  roles: UserRoleType[];
}

// Permissions matching the server-side permissions
export const Permissions = {
  // Pickup Request Permissions
  REQUEST_PICKUP: {
    name: 'request_pickup',
    roles: [UserRole.HOUSEHOLD, UserRole.ORGANIZATION]
  },
  SCHEDULE_RECURRING_PICKUP: {
    name: 'schedule_recurring_pickup',
    roles: [UserRole.HOUSEHOLD, UserRole.ORGANIZATION]
  },
  VIEW_COLLECTOR_LOCATION: {
    name: 'view_collector_location',
    roles: [UserRole.HOUSEHOLD, UserRole.ORGANIZATION]
  },
  
  // Collector Permissions
  ACCEPT_PICKUP_JOBS: {
    name: 'accept_pickup_jobs',
    roles: [UserRole.COLLECTOR]
  },
  MARK_JOB_COMPLETE: {
    name: 'mark_job_complete',
    roles: [UserRole.COLLECTOR]
  },
  
  // Common Permissions
  VIEW_PICKUP_HISTORY: {
    name: 'view_pickup_history',
    roles: [UserRole.HOUSEHOLD, UserRole.COLLECTOR, UserRole.RECYCLER, UserRole.ORGANIZATION]
  },
  
  // Recycler Permissions
  VIEW_WASTE_LISTINGS: {
    name: 'view_waste_listings',
    roles: [UserRole.RECYCLER]
  },
  BUY_RECYCLABLES: {
    name: 'buy_recyclables',
    roles: [UserRole.RECYCLER]
  },
  
  // Analytics Permissions
  ACCESS_ANALYTICS: {
    name: 'access_analytics',
    roles: [UserRole.RECYCLER, UserRole.ORGANIZATION]
  }
};

export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return permission.roles.includes(user.role as UserRoleType);
  };
  
  const hasRole = (role: UserRoleType): boolean => {
    if (!user) return false;
    return user.role === role;
  };
  
  const hasAnyRole = (roles: UserRoleType[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role as UserRoleType);
  };
  
  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    // Added convenience methods for specific permissions
    canRequestPickup: hasPermission(Permissions.REQUEST_PICKUP),
    canScheduleRecurringPickup: hasPermission(Permissions.SCHEDULE_RECURRING_PICKUP),
    canViewCollectorLocation: hasPermission(Permissions.VIEW_COLLECTOR_LOCATION),
    canAcceptPickupJobs: hasPermission(Permissions.ACCEPT_PICKUP_JOBS),
    canMarkJobComplete: hasPermission(Permissions.MARK_JOB_COMPLETE),
    canViewPickupHistory: hasPermission(Permissions.VIEW_PICKUP_HISTORY),
    canViewWasteListings: hasPermission(Permissions.VIEW_WASTE_LISTINGS),
    canBuyRecyclables: hasPermission(Permissions.BUY_RECYCLABLES),
    canAccessAnalytics: hasPermission(Permissions.ACCESS_ANALYTICS),
    // Role-specific checks
    isHousehold: hasRole(UserRole.HOUSEHOLD),
    isCollector: hasRole(UserRole.COLLECTOR),
    isRecycler: hasRole(UserRole.RECYCLER),
    isOrganization: hasRole(UserRole.ORGANIZATION),
  };
}