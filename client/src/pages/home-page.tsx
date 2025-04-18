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

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: impact } = useQuery<TotalImpact>({
    queryKey: ["/api/impact"],
  });
  
  const { data: collections } = useQuery<any[]>({
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
                  <i className="fas fa-calendar-plus mr-2"></i>Schedule Pickup
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Collections"
              value={collections?.length || 0}
              subtitle={"+2 from last month"}
              icon="recycle"
              gradient="bg-gradient-to-br from-primary-light to-primary"
            />
            
            <StatCard
              title="Waste Diverted"
              value={`${formatNumber(impact?.wasteAmount)} kg`}
              subtitle={"+18 kg this month"}
              icon="dumpster"
              gradient="bg-gradient-to-br from-secondary-light to-secondary"
            />
            
            <StatCard
              title="CO₂ Reduced"
              value={`${formatNumber(impact?.co2Reduced)} kg`}
              subtitle={`Equivalent to ${formatNumber(impact?.treesEquivalent)} trees`}
              icon="leaf"
              gradient="bg-gradient-to-br from-yellow-400 to-accent"
            />
            
            <StatCard
              title="Recycling Rate"
              value={
                impact?.wasteAmount && collections?.length
                  ? `${Math.round((impact.wasteAmount / (collections.length * 10)) * 100)}%`
                  : "0%"
              }
              subtitle="Based on total collections"
              icon="chart-line"
              gradient="bg-gradient-to-br from-blue-400 to-blue-600"
            />
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
