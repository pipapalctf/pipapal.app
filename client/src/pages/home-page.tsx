import RoleDashboard from "@/components/dashboard/role-dashboard";
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout";

/**
 * HomePage component that displays the role-specific dashboard
 * The main dashboard content is rendered by the RoleDashboard component
 * which displays different content based on the user's role
 */
export default function HomePage() {
  return (
    <AuthenticatedLayout>
      <RoleDashboard />
    </AuthenticatedLayout>
  );
}