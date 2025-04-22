import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie } from 'recharts';
import { Truck, Package, MapPin, Clock, DollarSign, Star, Route, Scale, Leaf, Award } from 'lucide-react';
import { User, CollectionStatus, Collection, Impact } from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import RoleBasedCTA from './role-based-cta';
import RecentActivity from './recent-activity';
import { ServiceAreaMap } from '@/components/maps/service-area-map';

interface CollectorDashboardProps {
  user: User;
}

/**
 * Dashboard for Collector users
 * Focused on job tracking and performance metrics
 */
export default function CollectorDashboard({ user }: CollectorDashboardProps) {
  // Fetch collections (jobs) assigned to this collector
  const { data: collections = [] } = useQuery({
    queryKey: ['/api/collections'],
  });

  // Filter collections that are assigned to this collector
  const collectorJobs = collections.filter(
    (collection) => collection.collectorId === user.id
  );

  // Get completed jobs
  const completedJobs = collectorJobs.filter(
    (job) => job.status === CollectionStatus.COMPLETED
  );

  // Calculate total waste collected
  const totalWasteCollected = collectorJobs.reduce(
    (total, job) => total + (job.wasteAmount || 10), 
    0
  );

  // Calculate average time to complete (using scheduledDate and completedDate)
  const jobsWithCompletionData = completedJobs.filter(
    job => job.scheduledDate && job.completedDate
  );
  
  const avgCompletionTimeHours = jobsWithCompletionData.length > 0 
    ? jobsWithCompletionData.reduce((sum, job) => {
        const scheduledDate = new Date(job.scheduledDate);
        const completedDate = new Date(job.completedDate);
        const diffHours = (completedDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0) / jobsWithCompletionData.length
    : 0;

  // Group waste by type for pie chart
  const wasteByType = collectorJobs.reduce((acc, job) => {
    const wasteType = job.wasteType || 'general';
    const amount = job.wasteAmount || 10;
    
    if (!acc[wasteType]) {
      acc[wasteType] = { name: wasteType.charAt(0).toUpperCase() + wasteType.slice(1), value: 0 };
    }
    
    acc[wasteType].value += amount;
    return acc;
  }, {});
  
  const wasteTypesData = Object.values(wasteByType);

  // Group by month for timeline
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const jobsByMonth = months.map(month => {
    return {
      name: month,
      jobs: 0,
      waste: 0
    };
  });
  
  collectorJobs.forEach(job => {
    const date = new Date(job.scheduledDate);
    const monthIndex = date.getMonth();
    jobsByMonth[monthIndex].jobs += 1;
    jobsByMonth[monthIndex].waste += (job.wasteAmount || 10);
  });

  // Random colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF', '#FFA556', '#4CD790'];
  
  // Variables for achievement badges
  const completedCollections = completedJobs;
  const onTimeRate = jobsWithCompletionData.length > 0 
    ? jobsWithCompletionData.filter(job => {
        const scheduledDate = new Date(job.scheduledDate);
        const completedDate = new Date(job.completedDate);
        const diffHours = (completedDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24; // On time if completed within 24 hours of scheduled time
      }).length / jobsWithCompletionData.length * 100
    : 0;
  
  // Count unique waste types
  const wasteTypesCount = new Set(collectorJobs.map(job => job.wasteType));
  
  // Get impact data
  const { data: impactData } = useQuery({
    queryKey: ['/api/impacts', user.id],
    enabled: !!user.id,
  });
  
  const impact: Impact | undefined = impactData;
  
  // User rating based on ratings from customers
  const userRating = 4.7; // This would ideally come from the database

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* User Welcome Section with Hero Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Collector Dashboard</h1>
            <h2 className="text-xl font-medium text-primary mt-2">
              Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Collector'}!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Thank you for your environmental impact! Your collections enable recycling across Kenya.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-800/60 text-blue-800 dark:text-blue-200">
              <Truck className="h-4 w-4 mr-1" />
              Waste Collection Expert
            </div>
          </div>
        </div>
      </div>
      
      {/* Role-specific CTAs */}
      <RoleBasedCTA />
      
      {/* Key Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Jobs Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{collectorJobs.length}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {collectorJobs.length > 0 
                    ? `${collectorJobs.filter(job => job.status === CollectionStatus.PENDING).length} pending collection` 
                    : "No jobs assigned yet"}
                </p>
              </div>
              <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 rounded-full">
                <Package className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Completed Jobs Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
              Completed Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">{completedJobs.length}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {collectorJobs.length > 0 
                    ? `${Math.round((completedJobs.length / collectorJobs.length) * 100)}% completion rate` 
                    : "No jobs assigned yet"}
                </p>
              </div>
              <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 rounded-full">
                <Truck className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Waste Collected Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Scale className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
              Waste Collected
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{formatNumber(totalWasteCollected)}</span>
                  <span className="text-sm ml-1 font-medium text-amber-500 dark:text-amber-400">kg</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedJobs.length > 0 
                    ? `Avg ${formatNumber(totalWasteCollected / completedJobs.length, 1)} kg per job` 
                    : "No completed jobs yet"}
                </p>
              </div>
              <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 rounded-full">
                <Scale className="h-8 w-8 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Avg. Completion Time Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
              Avg. Completion Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(avgCompletionTimeHours, 1)}</span>
                  <span className="text-sm ml-1 font-medium text-purple-500 dark:text-purple-400">hrs</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {avgCompletionTimeHours <= 24 
                    ? "Same-day completion" 
                    : avgCompletionTimeHours <= 48 
                      ? "2-day completion" 
                      : "Multi-day completion"}
                </p>
              </div>
              <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 rounded-full">
                <Clock className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="jobs">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="jobs">Job Summary</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="areas">Areas Served</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        {/* Jobs Summary Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Jobs by Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="jobs" name="Jobs Completed" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 h-5 w-5" />
                  Waste Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={jobsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="waste" 
                        name="Waste Collected (kg)" 
                        stroke="#4ade80" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Waste Types Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteTypesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {wasteTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                {wasteTypesData.map((type, index) => (
                  <div key={type.name} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{type.name}: {formatNumber(type.value)} kg</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Average Job Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-primary">{formatNumber(avgCompletionTimeHours, 1)} hours</span>
                  <p className="text-sm text-muted-foreground">Average time from scheduled to completion</p>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-card p-3 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Same Day Completion</span>
                      <span className="text-sm font-medium">
                        {formatNumber(
                          (completedJobs.filter(job => {
                            const scheduledDate = new Date(job.scheduledDate);
                            const completedDate = new Date(job.completedDate);
                            return scheduledDate.toDateString() === completedDate.toDateString();
                          }).length / Math.max(completedJobs.length, 1)) * 100, 
                          0
                        )}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2" 
                        style={{ 
                          width: `${(completedJobs.filter(job => {
                            const scheduledDate = new Date(job.scheduledDate);
                            const completedDate = new Date(job.completedDate);
                            return scheduledDate.toDateString() === completedDate.toDateString();
                          }).length / Math.max(completedJobs.length, 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  Performance Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-2">
                  <div className="flex justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-8 w-8 ${star <= 4.5 ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-2xl font-bold mt-2">4.5</p>
                  <p className="text-sm text-muted-foreground">Based on job completion and timeliness</p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="bg-card p-3 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">On-Time Completion</span>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: '95%' }} />
                    </div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Job Acceptance Rate</span>
                      <span className="text-sm font-medium">88%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Earnings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-primary">$1,240</span>
                <p className="text-sm text-muted-foreground">Total earnings this month</p>
              </div>
              
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="jobs" 
                      name="Earnings ($)" 
                      fill="#3b82f6"
                      // Transform jobs count to fictional earnings for visualization
                      // This would be replaced with actual earnings data in a real app
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Areas Served Tab */}
        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Service Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Service Area Map Component */}
              <div className="mb-4">
                <ServiceAreaMap 
                  collections={collectorJobs} 
                  collectorAddress={user?.address || undefined}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Route className="mr-2 h-4 w-4" />
                    Top Collection Areas
                  </h3>
                  {(() => {
                    // Group collections by address
                    const areaGroups = collectorJobs.reduce((acc: Record<string, number>, job: any) => {
                      const address = job.address || 'Unknown Area';
                      if (!acc[address]) {
                        acc[address] = 0;
                      }
                      acc[address] += 1;
                      return acc;
                    }, {});
                    
                    // Convert to array and sort by count (descending)
                    const sortedAreas = Object.entries(areaGroups)
                      .map(([area, count]) => ({ area, count }))
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 4); // Take top 4 areas
                    
                    return (
                      <ul className="space-y-2">
                        {sortedAreas.length > 0 ? (
                          sortedAreas.map(({ area, count }) => (
                            <li key={area} className="flex justify-between">
                              <span className="truncate pr-2">{area}</span>
                              <span className="font-medium whitespace-nowrap">{count} {count === 1 ? 'job' : 'jobs'}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground text-sm">No areas served yet</li>
                        )}
                      </ul>
                    );
                  })()}
                </div>
                
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Collection Statistics
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Total Service Area</span>
                      <span className="font-medium">
                        {collectorJobs.length > 0 ? `${Math.round(collectorJobs.length * 0.8)} km²` : 'N/A'}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Avg. Collection Distance</span>
                      <span className="font-medium">
                        {collectorJobs.length > 0 ? `${Math.round(collectorJobs.length * 0.3) + 2} km` : 'N/A'}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Most Active Area</span>
                      <span className="font-medium">
                        {(() => {
                          const areas = collectorJobs.reduce((acc: Record<string, number>, job: any) => {
                            const address = job.address || 'Unknown';
                            if (!acc[address]) acc[address] = 0;
                            acc[address] += 1;
                            return acc;
                          }, {});
                          
                          if (Object.keys(areas).length === 0) return 'N/A';
                          
                          return Object.entries(areas)
                            .sort((a, b) => b[1] - a[1])[0][0]
                            .split(',')[0]; // Take first part of address
                        })()}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Avg. Travel Time</span>
                      <span className="font-medium">
                        {collectorJobs.length > 0 ? `${Math.round(15 + collectorJobs.length * 0.5)} min` : 'N/A'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <RecentActivity />
            </div>
            
            <Card className="border-0 shadow-md overflow-hidden md:col-span-1">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-cyan-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Star className="mr-2 h-5 w-5 text-blue-500" />
                  Collection Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l border-gray-200 dark:border-gray-700 space-y-6 py-2">
                  {/* Achievement items */}
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-green-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-green-600">
                      1,000 kg Milestone
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You've collected over 1,000 kg of recyclable waste! Great work on reducing landfill waste.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      April 18, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-blue-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-blue-600">
                      50th Collection
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Completed your 50th waste collection. Your consistent efforts are making Kenya cleaner!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      March 30, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-amber-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-amber-600">
                      On-Time Expert
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Maintained a 95% on-time collection rate for the past month.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      February 28, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-blue-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-blue-600">
                      Joined PipaPal
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Started your journey as a waste collector on the PipaPal platform.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      January 15, 2025
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
              { name: 'Collection Pro', achieved: completedCollections.length >= 10, icon: '🚚' },
              { name: 'On-Time Hero', achieved: onTimeRate >= 90, icon: '⏱️' },
              { name: 'Diversity Master', achieved: wasteTypesCount.size >= 5, icon: '🔄' },
              { name: 'Volume Leader', achieved: totalWasteCollected >= 500, icon: '📦' },
              { name: 'Carbon Saver', achieved: impact?.co2Reduced > 100, icon: '🌿' },
              { name: 'Community Pillar', achieved: userRating >= 4.5, icon: '🏆' }
            ].map((badge, index) => (
              <div 
                key={index} 
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center ${
                  badge.achieved 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' 
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
      
      {/* Upcoming Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Upcoming Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collectorJobs.filter(job => job.status !== CollectionStatus.COMPLETED).length > 0 ? (
            <div className="space-y-4">
              {collectorJobs
                .filter(job => job.status !== CollectionStatus.COMPLETED)
                .map((job) => (
                  <div key={job.id} className="flex items-center p-3 border rounded-lg">
                    <div className="mr-4 p-2 rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{job.wasteType} Waste Pickup</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.scheduledDate).toLocaleDateString()} at {' '}
                        {new Date(job.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium capitalize">
                      {job.status.toLowerCase()}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              <p>No pending jobs. Check back soon for new collection requests.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}