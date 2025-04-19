import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@shared/schema';
import HouseholdDashboard from './household-dashboard';
import CollectorDashboard from './collector-dashboard';
import RecyclerDashboard from './recycler-dashboard';
import OrganizationDashboard from './organization-dashboard';
import { Loader2 } from 'lucide-react';

/**
 * A role-based dashboard component that renders different dashboards based on the user's role
 * This allows for each user type to have metrics relevant to their specific needs
 */
export default function RoleDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  // Render different dashboard based on user role
  switch (user.role) {
    case UserRole.HOUSEHOLD:
      return <HouseholdDashboard user={user} />;
    case UserRole.COLLECTOR:
      return <CollectorDashboard user={user} />;
    case UserRole.RECYCLER:
      return <RecyclerDashboard user={user} />;
    case UserRole.ORGANIZATION:
      return <OrganizationDashboard user={user} />;
    default:
      return (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-semibold mb-2">Unknown User Role</h2>
          <p>Your user account has an unrecognized role type.</p>
        </div>
      );
  }
}