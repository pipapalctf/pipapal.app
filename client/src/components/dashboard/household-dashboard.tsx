import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Leaf, Recycle, Truck, Award, Scale, CalendarCheck } from 'lucide-react';
import { User } from '@shared/schema';
import { formatNumber } from '@/lib/utils';

interface HouseholdDashboardProps {
  user: User;
}

/**
 * Dashboard for Household/Individual users
 * Shows waste collection metrics, environmental impact, and badges
 */
export default function HouseholdDashboard({ user: initialUser }: HouseholdDashboardProps) {
  // Fetch the latest user data to ensure score is up-to-date
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
  });
  
  // Use the most up-to-date user data
  const user = userData || initialUser;
  
  // Fetch collections
  const { data: collections = [] } = useQuery({
    queryKey: ['/api/collections'],
  });

  // Fetch upcoming collections
  const { data: upcomingCollections = [] } = useQuery({
    queryKey: ['/api/collections/upcoming'],
  });

  // Fetch impact data
  const { data: impact } = useQuery({
    queryKey: ['/api/impact'],
  });

  // Fetch waste type distribution
  const { data: wasteTypes = [] } = useQuery({
    queryKey: ['/api/impact/waste-types'],
  });

  // Fetch monthly impact data
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['/api/impact/monthly'],
  });

  // Fetch badges
  const { data: badges = [] } = useQuery({
    queryKey: ['/api/badges'],
  });

  // Calculate total waste weight
  const totalWasteWeight = collections.reduce((total, collection) => {
    return total + (collection.wasteAmount || 10); // Default to 10kg if not specified
  }, 0);

  // Calculate recycling rate (assume all collections are recycled except general waste)
  const recycledWaste = collections.reduce((total, collection) => {
    return collection.wasteType !== 'general' 
      ? total + (collection.wasteAmount || 10) 
      : total;
  }, 0);
  
  const nonRecycledWaste = totalWasteWeight - recycledWaste;
  const recyclingRate = totalWasteWeight > 0 
    ? Math.round((recycledWaste / totalWasteWeight) * 100) 
    : 0;

  // Calculate pickup frequency (collections per month)
  const collectionsPerMonth = monthlyData.length > 0
    ? monthlyData.reduce((sum, month) => sum + month.wasteCollected, 0) / monthlyData.length
    : 0;

  // Random colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF', '#FFA556', '#4CD790'];

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* User Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Environmental Dashboard</h1>
        <h2 className="text-xl font-medium text-primary mt-2">
          Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Eco Hero'}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your sustainability journey is making a difference.
        </p>
      </div>
      
      {/* Key Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        {/* Total Pickups Card */}
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-200">
          <CardHeader className="pb-2 bg-muted/30">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Pickups</span>
              <Truck className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-center">
                {Array.isArray(collections) ? collections.length : 0}
              </span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                {Array.isArray(collections) && collections.length === 1 ? 'collection scheduled' : 'collections scheduled'}
              </span>
              <div className="w-full mt-4 bg-muted h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-1 rounded-full" 
                  style={{ 
                    width: `${Math.min(Array.isArray(collections) ? collections.length * 5 : 0, 100)}%` 
                  }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Waste Collected Card */}
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-200">
          <CardHeader className="pb-2 bg-muted/30">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Waste Collected</span>
              <Scale className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold">{formatNumber(totalWasteWeight || 0)}</span>
                <span className="text-lg font-medium text-muted-foreground">kg</span>
              </div>
              <span className="text-xs text-muted-foreground text-center mt-1">
                total waste managed
              </span>
              <div className="mt-4 grid grid-cols-4 gap-1">
                {Array.isArray(collections) && collections.length > 0 ? (
                  [...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full ${i < Math.min(Math.ceil(totalWasteWeight / 10), 4) ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))
                ) : (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="h-1 rounded-full bg-muted" />
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* CO₂ Reduced Card */}
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-200">
          <CardHeader className="pb-2 bg-muted/30">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>CO₂ Reduced</span>
              <Leaf className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold">{formatNumber(impact?.co2Reduced || 0)}</span>
                <span className="text-lg font-medium text-muted-foreground">kg</span>
              </div>
              <span className="text-xs text-muted-foreground text-center mt-1">
                carbon footprint reduced
              </span>
              <div className="w-full mt-4 flex justify-center">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="h-3 w-3 text-primary" />
                </div>
                {impact?.co2Reduced > 5 && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center ml-1">
                    <Leaf className="h-3 w-3 text-primary" />
                  </div>
                )}
                {impact?.co2Reduced > 10 && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center ml-1">
                    <Leaf className="h-3 w-3 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="recycling">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recycling">Recycling</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        {/* Recycling Tab */}
        <TabsContent value="recycling" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Recycle className="mr-2 h-5 w-5" />
                  Recycling Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-primary">{recyclingRate}%</span>
                  <p className="text-sm text-muted-foreground">of your waste is recycled</p>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Recycled', value: recycledWaste },
                          { name: 'Non-Recycled', value: nonRecycledWaste }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#4ade80" /> {/* Green for recycled */}
                        <Cell fill="#f87171" /> {/* Red for non-recycled */}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 h-5 w-5" />
                  Waste Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wasteTypes}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {wasteTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarCheck className="mr-2 h-5 w-5" />
                Pickup Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-2">
                <span className="text-4xl font-bold text-primary">
                  {formatNumber(collectionsPerMonth, 1)}
                </span>
                <p className="text-sm text-muted-foreground">average collections per month</p>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="wasteCollected" name="Waste (kg)" fill="#4ade80" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Leaf className="mr-2 h-5 w-5" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-card rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Water Saved</h3>
                  <p className="text-xl font-bold">{formatNumber(impact?.waterSaved || 0)} L</p>
                </div>
                <div className="bg-card rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">CO₂ Reduced</h3>
                  <p className="text-xl font-bold">{formatNumber(impact?.co2Reduced || 0)} kg</p>
                </div>
                <div className="bg-card rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Trees Equivalent</h3>
                  <p className="text-xl font-bold">{formatNumber(impact?.treesEquivalent || 0)}</p>
                </div>
                <div className="bg-card rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Energy Conserved</h3>
                  <p className="text-xl font-bold">{formatNumber(impact?.energyConserved || 0)} kWh</p>
                </div>
              </div>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#4ade80" />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="wasteCollected" name="Waste (kg)" fill="#4ade80" />
                    <Bar yAxisId="right" dataKey="co2Reduced" name="CO₂ Reduced (kg)" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Sustainability Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-3">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-3xl font-bold">{user.sustainabilityScore || 0} points</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Points earned based on waste type and amount
              </p>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs bg-muted/20 p-3 rounded-md">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                  <span>Hazardous: 2.0 pts/kg</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                  <span>Electronic: 1.5 pts/kg</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                  <span>Metal: 1.2 pts/kg</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <span>Glass/Plastic: 1.0 pts/kg</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  <span>Paper/Organic: 0.8 pts/kg</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                  <span>General: 0.5 pts/kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Earned Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center text-center p-4 bg-card rounded-lg">
                    <div className="rounded-full bg-primary/10 p-2 mb-2">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium capitalize">{badge.badgeType.replace('_', ' ')}</h3>
                    <p className="text-xs text-muted-foreground">{badge.achievedDate ? new Date(badge.achievedDate).toLocaleDateString() : 'Achievement unlocked!'}</p>
                  </div>
                ))}
                
                {badges.length === 0 && (
                  <div className="col-span-full text-center p-6 text-muted-foreground">
                    <p>No badges earned yet. Keep recycling to earn badges!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Upcoming Pickups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Upcoming Pickups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingCollections.length > 0 ? (
            <div className="space-y-4">
              {upcomingCollections.map((collection) => (
                <div key={collection.id} className="flex items-center p-3 border rounded-lg">
                  <div className="mr-4 p-2 rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize">{collection.wasteType} Waste Pickup</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(collection.scheduledDate).toLocaleDateString()} at {' '}
                      {new Date(collection.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                    {collection.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              <p>No upcoming pickups scheduled. Schedule your next pickup today!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}