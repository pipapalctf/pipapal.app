import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import SchedulePickupPage from "@/pages/schedule-pickup-page";
import EcoTipsPage from "@/pages/eco-tips-page";
import ImpactPage from "@/pages/impact-page";
import ProfilePage from "@/pages/profile-page";
import CollectionDetailsPage from "@/pages/collection-details-page";
import CollectorCollectionsPage from "@/pages/collector-collections-page";
import RecyclerMaterialsPage from "@/pages/recycler-materials-page";
import CollectorMaterialsPage from "@/pages/collector-materials-page";
import MaterialDetailsPage from "@/pages/material-details-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";
import { NotificationsProvider } from "@/hooks/notifications-provider";
import { UserRole } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/schedule-pickup" component={SchedulePickupPage} />
      <ProtectedRoute path="/ecotips" component={EcoTipsPage} />
      <ProtectedRoute path="/impact" component={ImpactPage} />
      
      {/* Collection routes */}
      <ProtectedRoute path="/collections/:id" component={CollectionDetailsPage} />
      <ProtectedRoute path="/collections" component={CollectorCollectionsPage} roleCheck={UserRole.COLLECTOR} />
      
      {/* Material Marketplace routes */}
      <ProtectedRoute path="/materials/manage" component={CollectorMaterialsPage} roleCheck={UserRole.COLLECTOR} />
      <ProtectedRoute path="/materials/:id" component={MaterialDetailsPage} />
      <ProtectedRoute path="/materials" component={RecyclerMaterialsPage} roleCheck={UserRole.RECYCLER} />
      
      <ProtectedRoute path="/profile" component={ProfilePage} />
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
