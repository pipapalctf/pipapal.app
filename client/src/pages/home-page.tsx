import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import RoleDashboard from "@/components/dashboard/role-dashboard";

/**
 * HomePage component that displays the role-specific dashboard
 * The main dashboard content is now rendered by the RoleDashboard component
 * which displays different content based on the user's role
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-6 md:py-10">
          <RoleDashboard />
        </section>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}