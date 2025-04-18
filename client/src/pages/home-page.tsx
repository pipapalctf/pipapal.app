import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { StatCard } from "@/components/ui/stat-card";
import UpcomingCollections from "@/components/dashboard/upcoming-collections";
import CollectionMap from "@/components/dashboard/collection-map";
import EnvironmentalImpact from "@/components/dashboard/environmental-impact";
import ProfileBadges from "@/components/dashboard/profile-badges";
import PromotionCard from "@/components/dashboard/promotion-card";
import EcoTips from "@/components/dashboard/eco-tips";
import RecentActivity from "@/components/dashboard/recent-activity";
import { useQuery } from "@tanstack/react-query";
import { TotalImpact } from "@/lib/types";
import { ChevronRight, CalendarClock } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: impact } = useQuery<TotalImpact>({
    queryKey: ["/api/impact"],
  });
  
  const { data: collections = [] } = useQuery<any[]>({
    queryKey: ["/api/collections"],
  });
  
  function formatNumber(value?: number) {
    if (value === undefined) return "0";
    return new Intl.NumberFormat().format(Math.round(value));
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-6 md:py-10">
          {/* User Welcome Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-secondary">
                Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">Your sustainability journey is making a difference.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/schedule">
                <Button>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule Pickup
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Total Collections"
              value={collections?.length || 0}
              subtitle={(collections && collections.length > 0) ? "Keep up the good work!" : "Schedule your first collection"}
              icon="recycle"
              gradient="bg-gradient-to-br from-green-500 to-green-700"
            />
            
            <StatCard
              title="Waste Diverted"
              value={`${formatNumber(impact?.wasteAmount || 0)} kg`}
              subtitle={`${impact?.wasteAmount ? "Reducing landfill waste" : "Start recycling today"}`}
              icon="dumpster"
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
            />
            
            <StatCard
              title="CO₂ Reduced"
              value={`${formatNumber(impact?.co2Reduced || 0)} kg`}
              subtitle={`${impact?.treesEquivalent ? `Equivalent to ${formatNumber(impact?.treesEquivalent)} trees` : "Help fight climate change"}`}
              icon="leaf"
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
            />
          </div>
          
          {/* Link to full impact page */}
          <div className="flex justify-end mb-8">
            <Link href="/impact">
              <Button variant="outline" size="sm" className="text-sm">
                View detailed impact metrics
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <UpcomingCollections />
              <CollectionMap />
              <EnvironmentalImpact />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <ProfileBadges />
              <PromotionCard />
              <EcoTips />
              <RecentActivity />
            </div>
          </div>
        </section>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}