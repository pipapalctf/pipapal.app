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
import AboutPage from "@/pages/about-page";
import MissionPage from "@/pages/mission-page";
import OnboardingPage from "@/pages/onboarding-page";
import ChatPage from "@/pages/chat-page";
import { AuthProvider } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/use-websocket";
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
      <ProtectedRoute path="/chat" component={() => <ChatPage />} />
      <ProtectedRoute path="/collections/:id" component={CollectionDetailsPage} />
      <ProtectedRoute path="/collections" component={CollectorCollectionsPage} roleCheck={UserRole.COLLECTOR} />
      <ProtectedRoute path="/recycler/materials" component={RecyclerMaterialsPage} roleCheck={UserRole.RECYCLER} />
      <ProtectedRoute path="/materials" component={RecyclerMaterialsPage} roleCheck={UserRole.RECYCLER} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} skipOnboardingCheck={true} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/mission" component={MissionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <WebSocketProvider>
            <NotificationsProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </NotificationsProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
