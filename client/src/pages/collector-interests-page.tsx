import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { MaterialInterestsTab } from "@/components/material-interests-tab";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserRole } from "@shared/schema";
import { Helmet } from 'react-helmet';

export default function CollectorInterestsPage() {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.COLLECTOR) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You don't have permission to view this page.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Material Interests | PipaPal</title>
      </Helmet>
      
      <div className="container py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Material Interests</h1>
          <p className="text-muted-foreground mt-2">
            Manage recycler interests in your waste collections
          </p>
        </div>

        <MaterialInterestsTab collectorId={user.id} />
      </div>
    </Layout>
  );
}