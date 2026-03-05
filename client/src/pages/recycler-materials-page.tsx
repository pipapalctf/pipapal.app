import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@shared/schema';
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { DropoffRequests } from '@/components/dropoff-requests';

export default function RecyclerMaterialsPage() {
  const { user } = useAuth();

  if (user?.role !== UserRole.RECYCLER) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>This page is only available to recyclers.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Materials & Drop-offs</h1>
            <p className="text-muted-foreground">
              Manage incoming waste drop-offs and configure your acceptance limits
            </p>
          </div>

          <DropoffRequests />
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
