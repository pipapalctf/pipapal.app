import { Permission } from "@/hooks/use-permissions";
import { UserRole, UserRoleType } from "@shared/schema";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import AccessDenied from "./access-denied";

type RoleBasedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
} & (
  | { permission: Permission; role?: never; anyRole?: never; }
  | { permission?: never; role: UserRoleType; anyRole?: never; }
  | { permission?: never; role?: never; anyRole: UserRoleType[]; }
);

/**
 * A route component that only allows access to users with the specified permission or role
 * 
 * Usage examples:
 * 
 * // With a permission:
 * <RoleBasedRoute 
 *   path="/schedule" 
 *   permission={Permissions.REQUEST_PICKUP} 
 *   component={SchedulePickupPage} 
 * />
 * 
 * // With a specific role:
 * <RoleBasedRoute 
 *   path="/collector-dashboard" 
 *   role={UserRole.COLLECTOR} 
 *   component={CollectorDashboardPage} 
 * />
 * 
 * // With multiple roles:
 * <RoleBasedRoute 
 *   path="/analytics" 
 *   anyRole={[UserRole.RECYCLER, UserRole.ORGANIZATION]} 
 *   component={AnalyticsPage} 
 * />
 */
export default function RoleBasedRoute({
  path,
  component: Component,
  permission,
  role,
  anyRole,
}: RoleBasedRouteProps) {
  const { user, isLoading } = useAuth();
  
  // Create the permissions check
  const hasAccess = () => {
    if (!user) return false;
    
    if (permission) {
      return permission.roles.includes(user.role as UserRoleType);
    }
    
    if (role) {
      return user.role === role;
    }
    
    if (anyRole) {
      return anyRole.includes(user.role as UserRoleType);
    }
    
    return false;
  };

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        <Redirect to="/" />
      ) : hasAccess() ? (
        <Component />
      ) : (
        <AccessDenied 
          title="Access Denied" 
          message={`You don't have permission to access this page. This page is restricted to ${role || (anyRole || []).join(' or ') || 'users with specific permissions'}.`} 
        />
      )}
    </Route>
  );
}