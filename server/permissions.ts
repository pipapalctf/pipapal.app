import { UserRole, UserRoleType } from "@shared/schema";
import { Request, Response, NextFunction } from "express";

export type Permission = {
  name: string;
  roles: UserRoleType[];
}

// Define all permissions
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
  
  // Material Marketplace Permissions
  LIST_MATERIALS: {
    name: 'list_materials',
    roles: [UserRole.COLLECTOR]
  },
  VIEW_MARKETPLACE: {
    name: 'view_marketplace',
    roles: [UserRole.RECYCLER, UserRole.COLLECTOR]
  },
  
  // Analytics Permissions
  ACCESS_ANALYTICS: {
    name: 'access_analytics',
    roles: [UserRole.RECYCLER, UserRole.ORGANIZATION]
  }
};

/**
 * Check if a user has permission based on their role
 */
export function hasPermission(userRole: UserRoleType, permission: Permission): boolean {
  return permission.roles.includes(userRole);
}

/**
 * Middleware to check if the user has the required permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.user.role as UserRoleType;
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `You don't have the required permission: ${permission.name}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check if the user has any of the required permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.user.role as UserRoleType;
    
    const hasAnyPermission = permissions.some(permission => 
      hasPermission(userRole, permission)
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'You don\'t have any of the required permissions' 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check if the user is of a specific role
 */
export function requireRole(role: UserRoleType) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `This action requires the role: ${role}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check if the user is the owner of the resource
 * Used for routes with :id params, like /api/collections/:id
 */
export function requireOwnership(getResourcePromise: (req: Request) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const resource = await getResourcePromise(req);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Check if the user is the owner of the resource
      if (resource.userId !== req.user.id) {
        // Special case for collectors assigned to a collection
        if (req.user.role === UserRole.COLLECTOR && resource.collectorId === req.user.id) {
          return next();
        }
        
        return res.status(403).json({ 
          error: 'Access denied', 
          message: 'You don\'t have ownership of this resource' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireOwnership middleware:', error);
      res.status(500).json({ error: 'Server error checking resource ownership' });
    }
  };
}