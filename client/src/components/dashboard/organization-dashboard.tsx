import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Building, Leaf, FileText, TrendingUp, CalendarClock, Download, Truck, Scale, BarChart4 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, CollectionStatus } from '@shared/schema';
import { formatNumber } from '@/lib/utils';

interface OrganizationDashboardProps {
  user: User;
}

/**
 * Dashboard for Organization users
 * Shows sustainability metrics and CSR reporting
 */
export default function OrganizationDashboard({ user }: OrganizationDashboardProps) {
  // Fetch collections data for this organization
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

  // Calculate total waste weight
  const totalWasteWeight = collections.reduce((total, collection) => {
    return total + (collection.wasteAmount || 10); 
  }, 0);

  // Calculate recycling rate (assume all collections are recycled except general waste)
  const recyclableWaste = collections.reduce((total, collection) => {
    return collection.wasteType !== 'general' 
      ? total + (collection.wasteAmount || 10) 
      : total;
  }, 0);
  
  const recyclingRate = totalWasteWeight > 0 
    ? Math.round((recyclableWaste / totalWasteWeight) * 100) 
    : 0;

  // Calculate pickup schedule compliance
  const scheduledPickups = collections.length;
  const completedOnTime = collections.filter(collection => 
    collection.status === CollectionStatus.COMPLETED &&
    collection.completedDate && 
    new Date(collection.completedDate) <= new Date(collection.scheduledDate)
  ).length;
  
  const scheduleCompliance = scheduledPickups > 0 
    ? Math.round((completedOnTime / scheduledPickups) * 100) 
    : 0;

  // Random colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF', '#FFA556', '#4CD790'];

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* User Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organization Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.organizationName || user?.fullName?.split(' ')[0] || user?.username || 'Partner'}! Track your sustainability metrics here.
        </p>
      </div>
      
      {/* Key Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{collections.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waste Managed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(totalWasteWeight)} kg</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recycling Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{recyclingRate}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CO₂ Reduced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Leaf className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(impact?.co2Reduced || 0)} kg</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="trends">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="waste">Waste Analysis</TabsTrigger>
          <TabsTrigger value="reports">CSR Reports</TabsTrigger>
        </TabsList>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart4 className="mr-2 h-5 w-5" />
                  Monthly Waste Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="wasteCollected" name="Waste (kg)" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="mr-2 h-5 w-5" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="co2Reduced" 
                        name="CO₂ Reduced (kg)" 
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
                <Building className="mr-2 h-5 w-5" />
                Organization Sustainability Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-3">
                  <Leaf className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-3xl font-bold">{user.sustainabilityScore || 0} points</h3>
                <p className="text-sm text-muted-foreground mb-6">Your organization's sustainability rating</p>
                
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-2 bg-muted rounded-full relative mb-2">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-full"
                        style={{ height: `${recyclingRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{recyclingRate}%</span>
                    <span className="text-xs text-muted-foreground">Recycling</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-2 bg-muted rounded-full relative mb-2">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full"
                        style={{ height: `${scheduleCompliance}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{scheduleCompliance}%</span>
                    <span className="text-xs text-muted-foreground">Schedule</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-2 bg-muted rounded-full relative mb-2">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-full"
                        style={{ height: `85%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">85%</span>
                    <span className="text-xs text-muted-foreground">Overall</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Waste Analysis Tab */}
        <TabsContent value="waste" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 h-5 w-5" />
                  Waste Composition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wasteTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  {wasteTypes.map((type, index) => (
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
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Recycling vs. General Waste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-primary">{recyclingRate}%</span>
                  <p className="text-sm text-muted-foreground">of waste is recyclable</p>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Recyclable', value: recyclableWaste },
                          { name: 'Non-Recyclable', value: totalWasteWeight - recyclableWaste }
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
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarClock className="mr-2 h-5 w-5" />
                Pickup Schedule Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Compliance</span>
                    <span className="font-medium">{scheduleCompliance}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary rounded-full h-2.5" 
                      style={{ width: `${scheduleCompliance}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">On-Time Completion Rate</h3>
                    <div className="flex justify-between text-sm">
                      <span>Current Month</span>
                      <span className="font-medium">
                        {scheduledPickups > 0 
                          ? Math.round((completedOnTime / scheduledPickups) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2" 
                        style={{ 
                          width: `${scheduledPickups > 0 
                            ? Math.round((completedOnTime / scheduledPickups) * 100) 
                            : 0}%` 
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm mt-4">
                      <span>Previous Month</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 rounded-full h-2" style={{ width: '92%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Waste Type Breakdown</h3>
                    {['plastic', 'paper', 'glass', 'electronic'].map((type) => {
                      // Calculate compliance per waste type
                      const typePickups = collections.filter(c => c.wasteType === type).length;
                      const typeCompleted = collections.filter(
                        c => c.wasteType === type && 
                        c.status === CollectionStatus.COMPLETED &&
                        c.completedDate && 
                        new Date(c.completedDate) <= new Date(c.scheduledDate)
                      ).length;
                      
                      const typeCompliance = typePickups > 0 
                        ? Math.round((typeCompleted / typePickups) * 100) 
                        : 0;
                      
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="capitalize">{type}</span>
                            <span>{typeCompliance}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 rounded-full h-1.5" 
                              style={{ width: `${typeCompliance}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* CSR Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Environmental Impact Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              
              <div className="space-y-4">
                <h3 className="font-medium">Exportable Reports</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-muted-foreground mr-3" />
                      <div>
                        <p className="font-medium">Quarterly Sustainability Report</p>
                        <p className="text-sm text-muted-foreground">Q2 2025</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-muted-foreground mr-3" />
                      <div>
                        <p className="font-medium">Annual Environmental Impact</p>
                        <p className="text-sm text-muted-foreground">2025 YTD</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-muted-foreground mr-3" />
                      <div>
                        <p className="font-medium">Waste Management Compliance</p>
                        <p className="text-sm text-muted-foreground">April 2025</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Sustainability Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Reduce non-recyclable waste by 50%</span>
                    <span className="text-sm">{recyclingRate >= 50 ? '✓ Achieved' : 'In Progress'}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className={`rounded-full h-2.5 ${recyclingRate >= 50 ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(recyclingRate * 2, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: 50% reduction • Current: {recyclingRate >= 50 ? '50%+' : `${recyclingRate}%`}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Achieve 90% pickup schedule compliance</span>
                    <span className="text-sm">{scheduleCompliance >= 90 ? '✓ Achieved' : 'In Progress'}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className={`rounded-full h-2.5 ${scheduleCompliance >= 90 ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(scheduleCompliance * 1.1, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: 90% compliance • Current: {scheduleCompliance}%
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Reduce CO₂ emissions by 1000kg</span>
                    <span className="text-sm">
                      {(impact?.co2Reduced || 0) >= 1000 ? '✓ Achieved' : 'In Progress'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className={`rounded-full h-2.5 ${(impact?.co2Reduced || 0) >= 1000 ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(((impact?.co2Reduced || 0) / 1000) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: 1000kg • Current: {formatNumber(impact?.co2Reduced || 0)}kg
                  </p>
                </div>
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
            Upcoming Collections
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
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium capitalize">
                    {collection.status.toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              <p>No upcoming collections scheduled.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}