import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Leaf, Recycle, Truck, Award, Scale, CalendarCheck, CalendarPlus, PlusCircle, TrendingUp, Star } from 'lucide-react';
import { User, Collection, Impact, Badge } from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import { scrollToElement } from '@/lib/scroll-utils';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import RoleBasedCTA from './role-based-cta';
import RecentActivity from './recent-activity';

interface HouseholdDashboardProps {
  user: User;
}

/**
 * Dashboard for Household/Individual users
 * Shows waste collection metrics, environmental impact, and badges
 */
export default function HouseholdDashboard({ user: initialUser }: HouseholdDashboardProps) {
  // Fetch the latest user data to ensure score is up-to-date
  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  // Use the most up-to-date user data
  const user = userData || initialUser;
  
  // Fetch collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });

  // Fetch upcoming collections
  const { data: upcomingCollections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections/upcoming'],
  });

  // Fetch impact data
  const { data: impact } = useQuery<Impact>({
    queryKey: ['/api/impact'],
  });

  // Fetch waste type distribution
  const { data: wasteTypes = [] } = useQuery<{ name: string; value: number }[]>({
    queryKey: ['/api/impact/waste-types'],
  });

  // Fetch monthly impact data
  const { data: monthlyData = [] } = useQuery<any[]>({
    queryKey: ['/api/impact/monthly'],
  });

  // Fetch badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  // Calculate total waste weight
  const totalWasteWeight = collections.reduce((total: number, collection: Collection) => {
    return total + (collection.wasteAmount || 10); // Default to 10kg if not specified
  }, 0);

  // Calculate recycling rate (assume all collections are recycled except general waste)
  const recycledWaste = collections.reduce((total: number, collection: Collection) => {
    return collection.wasteType !== 'general' 
      ? total + (collection.wasteAmount || 10) 
      : total;
  }, 0);
  
  const nonRecycledWaste = totalWasteWeight - recycledWaste;
  const recyclingRate = totalWasteWeight > 0 
    ? Math.round((recycledWaste / totalWasteWeight) * 100) 
    : 0;

  // Calculate pickup frequency (number of collections per month)
  const collectionsCountByMonth = new Map<string, number>();
  
  // Count collections by month
  collections.forEach((collection: Collection) => {
    if (!collection.scheduledDate) return;
    
    const collectionDate = new Date(collection.scheduledDate);
    const monthIndex = collectionDate.getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[monthIndex];
    
    if (!collectionsCountByMonth.has(monthName)) {
      collectionsCountByMonth.set(monthName, 0);
    }
    collectionsCountByMonth.set(monthName, collectionsCountByMonth.get(monthName)! + 1);
  });
  
  // Calculate average collections per month
  const collectionsPerMonth = collectionsCountByMonth.size > 0
    ? Array.from(collectionsCountByMonth.values()).reduce((sum: number, count: number) => sum + count, 0) / collectionsCountByMonth.size
    : 0;

  // Random colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF', '#FFA556', '#4CD790'];

  return (
    <div className="space-y-6 p-2 md:p-6">
      {/* User Welcome Section with Hero Banner */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-900/20 p-6 rounded-lg border border-green-100 dark:border-green-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Environmental Dashboard</h1>
            <h2 className="text-xl font-medium text-primary mt-2">
              Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Eco Hero'}!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your sustainability journey is making a difference. Keep up the good work!
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-800/60 text-green-800 dark:text-green-200">
              <Leaf className="h-4 w-4 mr-1" />
              Eco-Conscious Household
            </div>
          </div>
        </div>
      </div>
      
      {/* Role-specific CTAs */}
      <RoleBasedCTA />
      
      {/* Key Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pickups Card */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40 mr-3">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {Array.isArray(collections) ? collections.length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Array.isArray(collections) && collections.length > 0 
                    ? `${upcomingCollections.length} upcoming pickups` 
                    : "No collections scheduled yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Waste Collected Card */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waste Managed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40 mr-3">
                <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{formatNumber(totalWasteWeight || 0)}</span>
                  <span className="text-sm ml-1 font-medium text-amber-500 dark:text-amber-400">kg</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {recyclingRate}% recycling rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* CO₂ Reduced Card */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CO₂ Reduced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40 mr-3">
                <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">{formatNumber(impact?.co2Reduced || 0)}</span>
                  <span className="text-sm ml-1 font-medium text-green-500 dark:text-green-400">kg</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  carbon footprint reduction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Trees Equivalent Card */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trees Equivalent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/40 mr-3">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(impact?.treesEquivalent || 0, 1)}</span>
                  <span className="text-sm ml-1 font-medium text-purple-500 dark:text-purple-400">trees</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  environmental impact
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href="/schedule-pickup?tab=schedule">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Schedule New Pickup
          </Button>
        </Link>
        <Link href="/schedule-pickup?tab=pickups#pickups-tab-content">
          <Button variant="outline" className="border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-900/20">
            <Truck className="h-4 w-4 mr-2" />
            View All Collections
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="recycling" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1">
          <TabsTrigger value="recycling" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" onClick={() => scrollToElement('recycling-tab-content', 80)}>
            <Recycle className="h-4 w-4 mr-2" />
            Recycling
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" onClick={() => scrollToElement('timeline-tab-content', 80)}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Impact
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" onClick={() => scrollToElement('achievements-tab-content', 80)}>
            <Award className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-background data-[state=active]:shadow-sm" onClick={() => scrollToElement('activities-tab-content', 80)}>
            <Star className="h-4 w-4 mr-2" />
            Activities
          </TabsTrigger>
        </TabsList>
        
        {/* Recycling Tab */}
        <TabsContent value="recycling" className="space-y-4 mt-6" id="recycling-tab-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Recycle className="mr-2 h-5 w-5 text-green-600" />
                  Recycling Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">{recyclingRate}%</span>
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
            
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Scale className="mr-2 h-5 w-5 text-amber-600" />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {wasteTypes.slice(0, 6).map((type, index) => (
                    <div key={type.name} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs">{type.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <CalendarCheck className="mr-2 h-5 w-5 text-blue-600" />
                Pickup Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-left">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(collectionsPerMonth, 1)}
                  </span>
                  <p className="text-sm text-muted-foreground">average pickups per month</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <CalendarCheck className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Array.from(collectionsCountByMonth.entries())
                      .map(([month, count]) => ({ 
                        name: month, 
                        pickupCount: count 
                      }))
                      .sort((a, b) => {
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return months.indexOf(a.name) - months.indexOf(b.name);
                      })
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="pickupCount" name="Pickups" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6 mt-6" id="timeline-tab-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Water Saved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                      <path d="M12 2v6m0 0a5 5 0 0 1 5 5c0 2.8-2.2 5-5 5s-5-2.2-5-5c0-2.2 1.4-4 3.3-4.7"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(impact?.waterSaved || 0)}</span>
                      <span className="text-sm ml-1 font-medium text-blue-500 dark:text-blue-400">L</span>
                    </div>
                    <p className="text-xs text-muted-foreground">water saved from recycling</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CO₂ Reduced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40 mr-3">
                    <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-green-600 dark:text-green-400">{formatNumber(impact?.co2Reduced || 0)}</span>
                      <span className="text-sm ml-1 font-medium text-green-500 dark:text-green-400">kg</span>
                    </div>
                    <p className="text-xs text-muted-foreground">carbon dioxide emissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trees Equivalent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40 mr-3">
                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{formatNumber(impact?.treesEquivalent || 0, 1)}</span>
                      <span className="text-sm ml-1 font-medium text-amber-500 dark:text-amber-400">trees</span>
                    </div>
                    <p className="text-xs text-muted-foreground">equivalent forest impact</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Energy Conserved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/40 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
                      <path d="M8 3h8l2 14H6L8 3Z"/>
                      <path d="M12 17v4"/>
                      <path d="M8 21h8"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(impact?.energyConserved || 0)}</span>
                      <span className="text-sm ml-1 font-medium text-purple-500 dark:text-purple-400">kWh</span>
                    </div>
                    <p className="text-xs text-muted-foreground">energy consumption saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-1 bg-gradient-to-r from-blue-400 to-green-400"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Monthly Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center space-x-4 px-2 mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500 mr-2"></div>
                  <span className="text-xs">Waste (kg)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-blue-500 mr-2"></div>
                  <span className="text-xs">CO₂ (kg)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-yellow-500 mr-2"></div>
                  <span className="text-xs">Trees (×100)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-purple-500 mr-2"></div>
                  <span className="text-xs">Water (L/10)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-orange-500 mr-2"></div>
                  <span className="text-xs">Energy (kWh)</span>
                </div>
              </div>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Array.isArray(monthlyData) ? monthlyData.map((month: any) => ({
                      ...month,
                      // Scale trees for visibility (multiply by 100)
                      treesEquivalent: (month.treesEquivalent || 0) * 100,
                      // Scale water saved for better visualization (divide by 10)
                      waterSaved: (month.waterSaved || 0) / 10
                    })) : []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        switch(name) {
                          case 'Trees Equivalent':
                            return [(value / 100).toFixed(2), 'Trees Equivalent'];
                          case 'Water Saved':
                            return [(value * 10).toFixed(0), 'Water Saved (L)'];
                          case 'Waste Collected':
                            return [value, 'Waste Collected (kg)'];
                          case 'CO₂ Reduced':
                            return [value, 'CO₂ Reduced (kg)'];
                          case 'Energy Conserved':
                            return [value, 'Energy Conserved (kWh)'];
                          default:
                            return [value, name];
                        }
                      }}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="wasteAmount" 
                      name="Waste Collected" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="co2Reduced" 
                      name="CO₂ Reduced" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="treesEquivalent" 
                      name="Trees Equivalent" 
                      fill="#f59e0b" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="waterSaved" 
                      name="Water Saved" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="energyConserved" 
                      name="Energy Conserved" 
                      fill="#f97316" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-xs text-center text-muted-foreground mt-2">
                <p>Environmental impact per kg of waste: 2kg CO₂ reduced, 0.01 trees saved, 50L water saved, 5kWh energy conserved</p>
              </div>
            </CardContent>
          </Card>
          
          {impact && (
            <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-900/20">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/40 mr-4">
                    <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Your Environmental Impact</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your recycling efforts have saved <span className="font-medium text-blue-600 dark:text-blue-400">{formatNumber(impact.waterSaved || 0)} liters</span> of water, 
                      reduced CO₂ emissions by <span className="font-medium text-green-600 dark:text-green-400">{formatNumber(impact.co2Reduced || 0)} kg</span>, 
                      and conserved energy equivalent to <span className="font-medium text-purple-600 dark:text-purple-400">{formatNumber(impact.energyConserved || 0)} kWh</span>.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      That's the same as planting <span className="font-medium text-amber-600 dark:text-amber-400">{formatNumber(impact.treesEquivalent || 0, 1)} trees</span>!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6 mt-6" id="achievements-tab-content">
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-600"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <Award className="mr-2 h-5 w-5 text-amber-600" />
                Sustainability Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{user?.sustainabilityScore || 0}</span>
                    <span className="text-sm ml-1 font-medium text-amber-500 dark:text-amber-400">points</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Points earned based on waste type and amount
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Award className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              
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
          
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-1 bg-gradient-to-r from-green-400 to-blue-400"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base">
                <Star className="mr-2 h-5 w-5 text-primary" />
                Earned Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center text-center p-4 bg-card rounded-lg border border-muted hover:border-primary/20 transition-colors">
                    <div className="rounded-full bg-primary/10 p-3 mb-2">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium capitalize">{badge.badgeType.replace('_', ' ')}</h3>
                    <p className="text-xs text-muted-foreground">Achievement unlocked!</p>
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
        
        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6 mt-6" id="activities-tab-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <RecentActivity />
            </div>
            
            <Card className="border-0 shadow-md overflow-hidden md:col-span-1">
              <div className="h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Star className="mr-2 h-5 w-5 text-orange-500" />
                  Your Eco-Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l border-gray-200 dark:border-gray-700 space-y-6 py-2">
                  {/* Journey items */}
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-green-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-green-600">
                      Recycling Champion
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You've maintained a recycling rate above 60% for three consecutive months!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      April 20, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-blue-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-blue-600">
                      First Electronics Recycling
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You scheduled your first electronics waste collection, preventing harmful materials from entering landfills.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      March 15, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-amber-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-amber-600">
                      10th Collection Milestone
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You've completed your 10th waste collection with PipaPal. Your consistency is making a difference!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      February 28, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-green-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-green-600">
                      Joined PipaPal
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You started your sustainability journey with PipaPal. Welcome to the community!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      January 5, 2025
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Achievement Badges */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base">
            <Award className="mr-2 h-5 w-5" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { name: 'Eco Starter', achieved: (user?.sustainabilityScore || 0) >= 50, icon: '🌱' },
              { name: 'Recycling Pro', achieved: recyclingRate >= 60, icon: '♻️' },
              { name: 'Water Saver', achieved: (impact?.waterSaved || 0) > 500, icon: '💧' },
              { name: 'Carbon Reducer', achieved: (impact?.co2Reduced || 0) > 50, icon: '🌿' },
              { name: 'Tree Saver', achieved: (impact?.treesEquivalent || 0) > 2, icon: '🌳' },
              { name: 'Consistency Hero', achieved: collectionsCountByMonth.size >= 3, icon: '🏆' }
            ].map((badge, index) => (
              <div 
                key={index} 
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center ${
                  badge.achieved 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100' 
                    : 'bg-gray-100 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className="text-xl mb-1">{badge.icon}</div>
                <span className="text-xs font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming Pickups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Upcoming Pickups
          </CardTitle>
          <div className="flex space-x-2">
            <Link href="/schedule-pickup?tab=pickups#pickups-tab-content">
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                <CalendarCheck className="mr-1 h-3.5 w-3.5" />
                View All
              </Button>
            </Link>
            <Link href="/schedule-pickup?tab=schedule">
              <Button size="sm" className="h-8 px-2 text-xs">
                <PlusCircle className="mr-1 h-3.5 w-3.5" />
                Schedule
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingCollections.length > 0 ? (
            <div className="space-y-4">
              {upcomingCollections.slice(0, 2).map((collection) => (
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
              
              {/* Removed the "+X more scheduled pickups" link as requested */}
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
                <CalendarPlus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">No upcoming pickups scheduled.</p>
              <Link href="/schedule-pickup?tab=schedule">
                <Button size="sm">
                  <PlusCircle className="mr-1 h-3.5 w-3.5" />
                  Schedule Your First Pickup
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}