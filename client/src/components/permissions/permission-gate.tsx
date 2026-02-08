import { ReactNode } from "react";
import { Permission, usePermissions } from "@/hooks/use-permissions";
import { UserRole, UserRoleType } from "@shared/schema";

type PermissionGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
} & (
  | { permission: Permission; role?: never; anyRole?: never; }
  | { permission?: never; role: UserRoleType; anyRole?: never; }
  | { permission?: never; role?: never; anyRole: UserRoleType[]; }
);

/**
 * A component that conditionally renders its children based on user permissions or roles
 * 
 * Usage examples:
 * 
 * // With a permission:
 * <PermissionGate permission={Permissions.REQUEST_PICKUP}>
 *   <SchedulePickupButton />
 * </PermissionGate>
 * 
 * // With a specific role:
 * <PermissionGate role={UserRole.COLLECTOR}>
 *   <CollectorDashboard />
 * </PermissionGate>
 * 
 * // With multiple roles:
 * <PermissionGate anyRole={[UserRole.RECYCLER, UserRole.ORGANIZATION]}>
 *   <AnalyticsDashboard />
 * </PermissionGate>
 * 
 * // With a fallback component:
 * <PermissionGate 
 *   permission={Permissions.ACCESS_ANALYTICS} 
 *   fallback={<AccessDeniedMessage />}
 * >
 *   <AnalyticsDashboard />
 * </PermissionGate>
 */
export default function PermissionGate({
  children,
  permission,
  role,
  anyRole,
  fallback = null
}: PermissionGateProps) {
  const { hasPermission, hasRole, hasAnyRole } = usePermissions();
  
  // Check permission or role based on which prop was provided
  const hasAccess = permission
    ? hasPermission(permission)
    : role
      ? hasRole(role)
      : anyRole
        ? hasAnyRole(anyRole)
        : false;
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}