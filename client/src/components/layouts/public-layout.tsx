import { ReactNode } from "react";
import PublicNavbar from "@/components/shared/public-navbar";
import Footer from "@/components/shared/footer";
import { FeedbackDialog } from "@/components/feedback";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
      
      {/* Feedback Dialog */}
      <FeedbackDialog />
    </div>
  );
}