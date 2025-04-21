import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { ArrowRight, Truck, Calendar, Recycle, BarChart3, ClipboardList, PlusCircle, Users, Trophy, LeafyGreen } from "lucide-react";
import { Link } from "wouter";

export default function RoleBasedCTA() {
  const { user } = useAuth();

  if (!user) return null;

  const renderHouseholdCTA = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/schedule">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Schedule Pickup</h3>
                  <p className="text-muted-foreground text-sm">Arrange for waste collection</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/impact">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <LeafyGreen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">View Impact</h3>
                  <p className="text-muted-foreground text-sm">See your environmental contribution</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrganizationCTA = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/schedule">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Schedule Collection</h3>
                  <p className="text-muted-foreground text-sm">Schedule organizational waste pickup</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/impact">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Sustainability Report</h3>
                  <p className="text-muted-foreground text-sm">Track your organization's impact</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const renderCollectorCTA = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/collections">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">View Collections</h3>
                  <p className="text-muted-foreground text-sm">Manage scheduled waste pickups</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/collector/interests">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Material Interests</h3>
                  <p className="text-muted-foreground text-sm">View recyclers' interests in your collections</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecyclerCTA = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/recycler/materials">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Recycle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Browse Materials</h3>
                  <p className="text-muted-foreground text-sm">Find materials for recycling</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-primary-foreground hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Link href="/impact">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Recycling Impact</h3>
                  <p className="text-muted-foreground text-sm">View your environmental contribution</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  // Return the appropriate CTA based on the user role
  switch (user.role) {
    case UserRole.HOUSEHOLD:
      return renderHouseholdCTA();
    case UserRole.ORGANIZATION:
      return renderOrganizationCTA();
    case UserRole.COLLECTOR:
      return renderCollectorCTA();
    case UserRole.RECYCLER:
      return renderRecyclerCTA();
    default:
      return null;
  }
}