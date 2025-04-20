import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import SchedulePickupForm from "@/components/forms/schedule-pickup-form";

export default function SchedulePickupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-secondary">
              Schedule Waste Collection
            </h1>
            <p className="text-gray-600 mt-1">
              Fill out the form below to schedule a pickup for your waste
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Collection Details</CardTitle>
                  <CardDescription>
                    Provide the necessary information for your waste collection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SchedulePickupForm />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-primary">
                    <i className="fas fa-info-circle mr-2"></i>
                    Tips for Collection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                      <span>Schedule at least 24 hours in advance for better service</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                      <span>Sort your waste by type for efficient recycling</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                      <span>Ensure waste is properly bagged and accessible</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                      <span>Add specific notes if your location is hard to find</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-green-600">
                    <i className="fas fa-leaf mr-2"></i>
                    Points System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">
                    Earn sustainability points based on waste type:
                  </p>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        <span>Hazardous: 20 pts</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                        <span>Electronic: 15 pts</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                        <span>Metal: 12 pts</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <span>Glass/Plastic: 10 pts</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                        <span>Paper/Organic: 8 pts</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                        <span>General: 5 pts</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Points shown are for standard 10kg waste collection. Points accumulate to unlock badges and rewards!
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-accent/5 border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-accent">
                    <i className="fas fa-star mr-2"></i>
                    Collector Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    Rate your waste collectors after pickup to help improve service quality for everyone.
                  </p>
                  <div className="flex items-center text-accent">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star-half-alt"></i>
                    <span className="ml-2 text-sm font-medium">4.5/5 average rating</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
