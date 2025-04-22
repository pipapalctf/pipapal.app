import { ReactNode } from "react";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Email verification banner will only show for unverified users */}
      <EmailVerificationBanner />
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-6 md:py-10">
          {children}
        </section>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}