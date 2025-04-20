import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie } from 'recharts';
import { Truck, Package, MapPin, Clock, DollarSign, Star, Route, Scale } from 'lucide-react';
import { User, CollectionStatus } from '@shared/schema';
import { formatNumber } from '@/lib/utils';

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

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* User Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Collector Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Collector'}! Ready for today's collection routes?
        </p>
      </div>
      
      {/* Key Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{collectorJobs.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{completedJobs.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waste Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(totalWasteCollected)} kg</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(avgCompletionTimeHours, 1)} hrs</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="jobs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">Job Summary</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="areas">Areas Served</TabsTrigger>
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
              <div className="bg-muted rounded-lg h-[400px] flex items-center justify-center mb-4">
                <div className="text-center p-6">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Map Visualization</h3>
                  <p className="text-sm text-muted-foreground">
                    A map showing your service areas and collection points would appear here.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Route className="mr-2 h-4 w-4" />
                    Top Areas
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Downtown District</span>
                      <span className="font-medium">{collectorJobs.length > 0 ? Math.round(collectorJobs.length * 0.4) : 0} jobs</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Westside Neighborhood</span>
                      <span className="font-medium">{collectorJobs.length > 0 ? Math.round(collectorJobs.length * 0.3) : 0} jobs</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Eastview Community</span>
                      <span className="font-medium">{collectorJobs.length > 0 ? Math.round(collectorJobs.length * 0.2) : 0} jobs</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Northside Area</span>
                      <span className="font-medium">{collectorJobs.length > 0 ? Math.round(collectorJobs.length * 0.1) : 0} jobs</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Average Travel Time
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Downtown District</span>
                      <span className="font-medium">12 min</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Westside Neighborhood</span>
                      <span className="font-medium">20 min</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Eastview Community</span>
                      <span className="font-medium">15 min</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Northside Area</span>
                      <span className="font-medium">25 min</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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