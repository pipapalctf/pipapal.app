import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TotalImpact } from "@/lib/types";
import { Link } from "wouter";

export default function EnvironmentalImpact() {
  const { data: impact, isLoading, error } = useQuery<TotalImpact>({
    queryKey: ["/api/impact"],
  });
  
  // Monthly goal is 100kg of waste diverted
  const monthlyGoalPercentage = impact ? Math.min(100, Math.round((impact.wasteAmount / 100) * 100)) : 0;
  
  // Format numbers for display
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat().format(Math.round(value));
  };
  
  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <CardTitle>Your Environmental Impact</CardTitle>
        <CardDescription>Track your contribution to sustainability</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            Failed to load impact data
          </div>
        ) : impact ? (
          <>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Monthly Goal Progress</span>
                <span className="text-sm font-medium text-primary">{monthlyGoalPercentage}%</span>
              </div>
              <Progress value={monthlyGoalPercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="border border-gray-200 rounded-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Water Saved</p>
                    <p className="text-2xl font-bold text-secondary mt-1">
                      {formatNumber(impact.waterSaved)} <span className="text-sm font-normal">liters</span>
                    </p>
                  </div>
                  <IconBadge 
                    icon="tint" 
                    bgColor="bg-blue-100" 
                    textColor="text-blue-600" 
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Energy Conserved</p>
                    <p className="text-2xl font-bold text-secondary mt-1">
                      {formatNumber(impact.energyConserved)} <span className="text-sm font-normal">kWh</span>
                    </p>
                  </div>
                  <IconBadge 
                    icon="bolt" 
                    bgColor="bg-yellow-100" 
                    textColor="text-yellow-600" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-card p-4 mb-5">
              <div className="flex items-center">
                <IconBadge 
                  icon="tree" 
                  bgColor="bg-green-100" 
                  textColor="text-primary"
                  size="lg"
                />
                <div className="ml-4">
                  <h4 className="font-medium text-secondary">Trees Equivalent</h4>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {formatNumber(impact.treesEquivalent)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Your recycling efforts have saved the equivalent of {formatNumber(impact.treesEquivalent)} trees
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/impact">
                <Button variant="outline" className="bg-white">
                  <span className="mr-2">📊</span>
                  View Detailed Impact Metrics
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No impact data available yet. Start recycling to see your contribution!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
