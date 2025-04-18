import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SchedulePickupPage from "@/pages/schedule-pickup-page";
import EcoTipsPage from "@/pages/eco-tips-page";
import ImpactPage from "@/pages/impact-page";
import ProfilePage from "@/pages/profile-page";
import CollectionDetailsPage from "@/pages/collection-details-page";
import CollectorDashboardPage from "@/pages/collector-dashboard-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";
import { NotificationsProvider } from "@/hooks/notifications-provider";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/schedule" component={SchedulePickupPage} />
      <ProtectedRoute path="/ecotips" component={EcoTipsPage} />
      <ProtectedRoute path="/impact" component={ImpactPage} />
      <ProtectedRoute path="/collections/:id" component={CollectionDetailsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/collector-dashboard" component={CollectorDashboardPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <NotificationsProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
