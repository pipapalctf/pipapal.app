import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  BarChart4, 
  Building, 
  CalendarClock,
  CalendarCheck,
  Check, 
  Download,
  FileText, 
  Leaf, 
  Plus,
  Recycle as RecycleIcon,
  Scale, 
  Target,
  Truck, 
  TrendingUp,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, CollectionStatus } from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface OrganizationDashboardProps {
  user: User;
}

/**
 * Dashboard for Organization users
 * Shows sustainability metrics and CSR reporting
 */
export default function OrganizationDashboard({ user }: OrganizationDashboardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Custom sustainability goals state
  const [customGoals, setCustomGoals] = useState<Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    metric: string;
    icon: string;
    color: string;
  }>>([]);
  
  // New goal form state
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: 100,
    current: 0,
    metric: 'kg',
    icon: '🌱',
    color: 'blue'
  });
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  
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
  
  // Handle goal form input changes
  const handleGoalChange = (field: string, value: string | number) => {
    setNewGoal(prev => ({
      ...prev,
      [field]: value
    }));
  }
  
  // Handle goal creation
  const handleAddGoal = () => {
    if (!newGoal.name) {
      toast({
        title: "Goal name required",
        description: "Please provide a name for your sustainability goal",
        variant: "destructive"
      });
      return;
    }
    
    // Add the new goal to state
    const id = `goal-${Date.now()}`;
    setCustomGoals(prev => [
      ...prev,
      {
        id,
        ...newGoal
      }
    ]);
    
    // Reset form and close dialog
    setNewGoal({
      name: '',
      target: 100,
      current: 0,
      metric: 'kg',
      icon: '🌱',
      color: 'blue'
    });
    setDialogOpen(false);
    
    // Show success message
    toast({
      title: "Goal added",
      description: "Your new sustainability goal has been added",
      variant: "default"
    });
  }
  
  // Array of available icons to choose from
  const availableIcons = ['🌱', '🌲', '♻️', '💧', '🔋', '🚮', '📉', '🏭', '🚗', '🏆'];
  
  // Color options for goals
  const colorOptions = [
    { name: 'Blue', value: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', accent: 'bg-blue-500' },
    { name: 'Green', value: 'green', bg: 'bg-green-100', text: 'text-green-700', accent: 'bg-green-500' },
    { name: 'Amber', value: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', accent: 'bg-amber-500' },
    { name: 'Purple', value: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', accent: 'bg-purple-500' },
    { name: 'Rose', value: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', accent: 'bg-rose-500' },
    { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', accent: 'bg-emerald-500' },
  ];

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
        <h2 className="text-xl font-medium text-primary mt-2">
          Welcome back, {user?.organizationName || user?.fullName?.split(' ')[0] || user?.username || 'Partner'}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Track your sustainability metrics here.
        </p>
      </div>
      
      {/* Key Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pickups Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Total Pickups
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{collections.length}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {collections.length > 0 
                    ? `${completedOnTime} completed on time` 
                    : "No pickups scheduled yet"}
                </p>
              </div>
              <div className="h-16 w-16 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full border-4 border-blue-100 dark:border-blue-900/40"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-blue-500 dark:border-blue-400"
                    style={{ 
                      clipPath: `polygon(50% 50%, 50% 0%, ${scheduleCompliance > 0 ? '100%' : '50%'} 0%, ${
                        scheduleCompliance >= 25 ? '100%' : '50%'
                      } ${scheduleCompliance >= 25 ? '100%' : '0%'}, ${
                        scheduleCompliance >= 50 ? '100%' : '50%'
                      } ${scheduleCompliance >= 50 ? '100%' : '0%'}, ${
                        scheduleCompliance >= 75 ? '0%' : '50%'
                      } ${scheduleCompliance >= 75 ? '100%' : '0%'}, 0% ${scheduleCompliance >= 100 ? '100%' : '50%'})` 
                    }}
                  ></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium">{scheduleCompliance}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Waste Managed Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Scale className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
              Waste Managed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">{formatNumber(totalWasteWeight)}</span> 
                <span className="text-sm ml-1 font-medium">kg</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {wasteTypes.length > 0 
                    ? `${wasteTypes[0]?.name}: ${formatNumber(wasteTypes[0]?.value || 0)} kg` 
                    : "No waste data yet"}
                </p>
              </div>
              <div className="h-12 w-32">
                <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  {wasteTypes.map((type, index) => {
                    // Calculate percentage width for each segment
                    const percentage = (type.value / totalWasteWeight) * 100;
                    const colors = ["bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-red-500"];
                    
                    return (
                      <div 
                        key={type.name} 
                        className={`h-full float-left ${colors[index % colors.length]}`}
                        style={{ width: `${percentage}%` }}
                        title={`${type.name}: ${percentage.toFixed(1)}%`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Composition</span>
                  <span className="text-xs font-medium">{wasteTypes.length} types</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recycling Rate Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
              Recycling Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{recyclingRate}%</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {recyclableWaste > 0 
                    ? `${formatNumber(recyclableWaste)} kg recycled waste` 
                    : "No recycling data yet"}
                </p>
              </div>
              <div className="relative h-14 w-14">
                <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                  <path
                    className="stroke-amber-100 dark:stroke-amber-900/40 fill-none"
                    strokeWidth="3.8"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-amber-500 dark:stroke-amber-400 fill-none"
                    strokeWidth="3.8"
                    strokeDasharray={`${recyclingRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`p-1 rounded-full ${
                    recyclingRate >= 70 ? 'bg-green-100 text-green-700' : 
                    recyclingRate >= 40 ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {recyclingRate >= 70 ? '↑' : recyclingRate >= 40 ? '→' : '↓'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* CO₂ Reduced Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-b">
            <CardTitle className="text-sm font-medium flex items-center">
              <Leaf className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              CO₂ Reduced
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(impact?.co2Reduced || 0)}</span> 
                <span className="text-sm ml-1 font-medium">kg</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {impact?.treesEquivalent 
                    ? `Equivalent to ${formatNumber(impact.treesEquivalent)} trees` 
                    : "Environmental impact data"}
                </p>
              </div>
              <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 rounded-full">
                <Leaf className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
              </div>
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
            {/* Monthly Waste Trends Card */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                <CardTitle className="flex items-center">
                  <BarChart4 className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Monthly Waste Trends
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Waste collection volume by month
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {monthlyData.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm font-medium">Waste Collected</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Monthly tracking of all waste types
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold">
                          {formatNumber(monthlyData.reduce((total, month) => total + month.wasteCollected, 0))} kg
                        </span>
                        <p className="text-xs text-muted-foreground">Total this year</p>
                      </div>
                    </div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <defs>
                            <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }} 
                            tick={{ fontSize: 12 }}
                            width={35}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ padding: '4px 0' }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                          />
                          <Bar 
                            dataKey="wasteCollected" 
                            name="Waste (kg)" 
                            fill="url(#wasteGradient)" 
                            radius={[4, 4, 0, 0]}
                            barSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] bg-muted/10 rounded-lg border border-dashed">
                    <div className="bg-muted/20 p-3 rounded-full mb-4">
                      <BarChart4 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No data yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      Monthly waste data will appear here once you have some collection history.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Environmental Impact Card */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20">
                <CardTitle className="flex items-center">
                  <Leaf className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Environmental Impact
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Measured impact of sustainable waste management
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {monthlyData.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="flex flex-col items-center justify-center p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                        <Leaf className="h-6 w-6 text-emerald-500 mb-1" />
                        <span className="text-sm font-medium text-center">{formatNumber(
                          monthlyData.reduce((total, month) => total + month.co2Reduced, 0)
                        )} kg</span>
                        <span className="text-xs text-muted-foreground">CO₂ Reduced</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="mb-1">💧</div>
                        <span className="text-sm font-medium text-center">{formatNumber(
                          monthlyData.reduce((total, month) => total + month.waterSaved, 0)
                        )} L</span>
                        <span className="text-xs text-muted-foreground">Water Saved</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <div className="mb-1">🌲</div>
                        <span className="text-sm font-medium text-center">{formatNumber(
                          monthlyData.reduce((total, month) => total + month.treesEquivalent, 0), 1
                        )}</span>
                        <span className="text-xs text-muted-foreground">Trees Equiv.</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="mb-1">⚡</div>
                        <span className="text-sm font-medium text-center">{formatNumber(
                          monthlyData.reduce((total, month) => total + month.energyConserved, 0)
                        )} kWh</span>
                        <span className="text-xs text-muted-foreground">Energy Saved</span>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                          <defs>
                            <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#4ade80" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }} 
                            tick={{ fontSize: 12 }}
                            width={40}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ padding: '4px 0' }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="co2Reduced" 
                            name="CO₂ Reduced (kg)" 
                            stroke="#4ade80"
                            fill="url(#colorCO2)"
                            strokeWidth={2}
                            dot={{ stroke: '#4ade80', strokeWidth: 2, r: 4, fill: 'white' }}
                            activeDot={{ r: 6, stroke: '#4ade80', strokeWidth: 2, fill: 'white' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] bg-muted/10 rounded-lg border border-dashed">
                    <div className="bg-muted/20 p-3 rounded-full mb-4">
                      <Leaf className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No impact data yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      Environmental impact metrics will be calculated based on your waste collection history.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Organization Sustainability Score Card */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                Organization Sustainability Score
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Performance metrics and achievement rating
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative inline-flex items-center justify-center">
                    {/* Circular progress indicator */}
                    <svg className="w-40 h-40" viewBox="0 0 120 120">
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="54" 
                        fill="none" 
                        stroke="#f3f4f6" 
                        strokeWidth="12" 
                      />
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="54" 
                        fill="none" 
                        stroke="#8b5cf6" 
                        strokeWidth="12" 
                        strokeLinecap="round"
                        strokeDasharray="339.292"
                        strokeDashoffset={339.292 * (1 - (user.sustainabilityScore || 0) / 1000)}
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                        {user.sustainabilityScore || 0}
                      </span>
                      <span className="text-sm font-medium">points</span>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-sm text-muted-foreground max-w-[250px]">
                    Your organization's sustainability score is calculated based on your waste management practices and environmental impact.
                  </p>
                </div>
                
                <div className="flex flex-col space-y-4">
                  <h3 className="text-lg font-medium">Performance Metrics</h3>
                  
                  {/* Recycling Rate Metric */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Recycling Rate</span>
                      <span className="text-sm">{recyclingRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${recyclingRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Target: 70%</span>
                      <span>
                        {recyclingRate >= 70 ? '✓ Achieved' : 'In progress'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Schedule Compliance Metric */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Schedule Compliance</span>
                      <span className="text-sm">{scheduleCompliance}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${scheduleCompliance}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Target: 90%</span>
                      <span>
                        {scheduleCompliance >= 90 ? '✓ Achieved' : 'In progress'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Waste Reduction Metric - Based on real data */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Waste Reduction</span>
                      {/* Calculate a metric based on collections and impact data */}
                      <span className="text-sm">{
                        collections.length > 0 ? 
                          Math.min(100, Math.round((impact?.co2Reduced || 0) / (totalWasteWeight * 2) * 100)) : 0
                      }%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ 
                          width: `${collections.length > 0 ? 
                            Math.min(100, Math.round((impact?.co2Reduced || 0) / (totalWasteWeight * 2) * 100)) : 0}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Target: 50%</span>
                      <span>
                        {collections.length > 0 && (impact?.co2Reduced || 0) / (totalWasteWeight * 2) * 100 >= 50 
                          ? '✓ Achieved' 
                          : 'In progress'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Achievement badges */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium mb-4">Achievement Badges</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { name: 'Eco Champion', achieved: user.sustainabilityScore >= 500, icon: '🏆' },
                    { name: 'Recycling Pro', achieved: recyclingRate >= 75, icon: '♻️' },
                    { name: 'On-Time Hero', achieved: scheduleCompliance >= 90, icon: '⏱️' },
                    { name: 'Carbon Reducer', achieved: impact?.co2Reduced > 100, icon: '🌿' },
                    { name: 'Tree Saver', achieved: impact?.treesEquivalent > 5, icon: '🌳' },
                    { name: 'Water Conserver', achieved: impact?.waterSaved > 1000, icon: '💧' }
                  ].map((badge, index) => (
                    <div 
                      key={index} 
                      className={`flex flex-col items-center justify-center p-2 rounded-lg text-center ${
                        badge.achieved 
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100' 
                          : 'bg-gray-100 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <div className="text-xl mb-1">{badge.icon}</div>
                      <span className="text-xs font-medium">{badge.name}</span>
                    </div>
                  ))}
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
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20">
              <CardTitle className="flex items-center">
                <Leaf className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Environmental Impact Summary
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Measurable sustainability outcomes
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                {/* Water Saved Metric */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                    <div className="text-xl text-blue-600 dark:text-blue-400">💧</div>
                  </div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Water Saved</p>
                  <div className="flex items-baseline mt-1">
                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {formatNumber(impact?.waterSaved || 0)}
                    </span>
                    <span className="ml-1 text-sm text-blue-600/70 dark:text-blue-400/70">L</span>
                  </div>
                  <p className="mt-2 text-xs text-blue-600/70 dark:text-blue-400/70 text-center">
                    ≈ {formatNumber(Math.round((impact?.waterSaved || 0) / 10))} 
                    <span className="ml-1">shower minutes</span>
                  </p>
                </div>
                
                {/* CO₂ Reduced Metric */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                    <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">CO₂ Reduced</p>
                  <div className="flex items-baseline mt-1">
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatNumber(impact?.co2Reduced || 0)}
                    </span>
                    <span className="ml-1 text-sm text-emerald-600/70 dark:text-emerald-400/70">kg</span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-600/70 dark:text-emerald-400/70 text-center">
                    ≈ {formatNumber(Math.round((impact?.co2Reduced || 0) * 2.5))} 
                    <span className="ml-1">car miles</span>
                  </p>
                </div>
                
                {/* Trees Equivalent Metric */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                    <div className="text-xl text-amber-600 dark:text-amber-400">🌳</div>
                  </div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Trees Equivalent</p>
                  <div className="flex items-baseline mt-1">
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {formatNumber(impact?.treesEquivalent || 0, 1)}
                    </span>
                    <span className="ml-1 text-sm text-amber-600/70 dark:text-amber-400/70">trees</span>
                  </div>
                  <p className="mt-2 text-xs text-amber-600/70 dark:text-amber-400/70 text-center">
                    Absorbing CO₂ for
                    <span className="ml-1">{formatNumber(Math.round((impact?.treesEquivalent || 0) * 365))} days</span>
                  </p>
                </div>
                
                {/* Energy Conserved Metric */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/20">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                    <div className="text-xl text-purple-600 dark:text-purple-400">⚡</div>
                  </div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Energy Conserved</p>
                  <div className="flex items-baseline mt-1">
                    <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {formatNumber(impact?.energyConserved || 0)}
                    </span>
                    <span className="ml-1 text-sm text-purple-600/70 dark:text-purple-400/70">kWh</span>
                  </div>
                  <p className="mt-2 text-xs text-purple-600/70 dark:text-purple-400/70 text-center">
                    ≈ {formatNumber(Math.round((impact?.energyConserved || 0) * 100))} 
                    <span className="ml-1">lightbulb hours</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Exportable Reports</h3>
                <div className="space-y-3">
                  {/* Quarterly Sustainability Report */}
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mr-3">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Quarterly Sustainability Report</p>
                        <p className="text-sm text-muted-foreground">Q2 2025 (April-June)</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        // Get current quarter data
                        const currentQuarter = {
                          period: "Q2 2025 (April-June)",
                          generated: new Date().toISOString(),
                          organization: user.fullName || user.username,
                          metrics: {
                            wasteCollected: totalWasteWeight,
                            wasteTypes: wasteTypes.map(type => ({
                              type: type.name,
                              amount: type.value,
                              percentage: Math.round((type.value / totalWasteWeight) * 100)
                            })),
                            recyclingRate: recyclingRate,
                            waterSaved: impact?.waterSaved || 0,
                            co2Reduced: impact?.co2Reduced || 0,
                            treesEquivalent: impact?.treesEquivalent || 0,
                            energyConserved: impact?.energyConserved || 0,
                            scheduleCompliance: scheduleCompliance,
                            monthlyBreakdown: monthlyData.map(month => ({
                              month: month.name,
                              waste: month.wasteCollected,
                              co2: month.co2Reduced
                            }))
                          }
                        };

                        // Generate CSV content
                        const csvHeader = "PipaPal Quarterly Sustainability Report\n" +
                          `Period: ${currentQuarter.period}\n` +
                          `Organization: ${currentQuarter.organization}\n` +
                          `Generated: ${new Date().toLocaleString()}\n\n`;
                          
                        let csvContent = csvHeader + 
                          "Summary Metrics\n" +
                          `Total Waste Collected,${formatNumber(currentQuarter.metrics.wasteCollected)} kg\n` +
                          `Recycling Rate,${currentQuarter.metrics.recyclingRate}%\n` +
                          `Water Saved,${formatNumber(currentQuarter.metrics.waterSaved)} L\n` +
                          `CO2 Reduced,${formatNumber(currentQuarter.metrics.co2Reduced)} kg\n` +
                          `Trees Equivalent,${formatNumber(currentQuarter.metrics.treesEquivalent)}\n` +
                          `Energy Conserved,${formatNumber(currentQuarter.metrics.energyConserved)} kWh\n` +
                          `Schedule Compliance,${currentQuarter.metrics.scheduleCompliance}%\n\n`;
                          
                        // Add waste type breakdown
                        csvContent += "Waste Type Breakdown\n";
                        csvContent += "Type,Amount (kg),Percentage\n";
                        currentQuarter.metrics.wasteTypes.forEach(type => {
                          csvContent += `${type.type},${formatNumber(type.amount)},${type.percentage}%\n`;
                        });
                        
                        // Add monthly breakdown if available
                        if (currentQuarter.metrics.monthlyBreakdown.length > 0) {
                          csvContent += "\nMonthly Breakdown\n";
                          csvContent += "Month,Waste Collected (kg),CO2 Reduced (kg)\n";
                          currentQuarter.metrics.monthlyBreakdown.forEach(month => {
                            csvContent += `${month.month},${formatNumber(month.waste)},${formatNumber(month.co2)}\n`;
                          });
                        }

                        // Create and download file
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `PipaPal_Quarterly_Report_${currentQuarter.period.replace(/[^\w]/g, '_')}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                  
                  {/* Annual Environmental Impact */}
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 mr-3">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Annual Environmental Impact</p>
                        <p className="text-sm text-muted-foreground">2025 Year-to-Date</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        // Prepare annual impact data
                        const annualImpact = {
                          period: "2025 Year-to-Date",
                          generated: new Date().toISOString(),
                          organization: user.fullName || user.username,
                          metrics: {
                            totalWaste: totalWasteWeight,
                            waterSaved: impact?.waterSaved || 0,
                            co2Reduced: impact?.co2Reduced || 0,
                            treesEquivalent: impact?.treesEquivalent || 0,
                            energyConserved: impact?.energyConserved || 0,
                            recyclingRate: recyclingRate,
                            // Calculate equivalent impacts
                            equivalents: {
                              carMilesSaved: Math.round((impact?.co2Reduced || 0) * 2.5), // 2.5 miles per kg CO2
                              showerMinutesSaved: Math.round((impact?.waterSaved || 0) / 10), // 10L per minute
                              lightBulbHours: Math.round((impact?.energyConserved || 0) * 100), // 100 hours per kWh
                              plasticBottlesSaved: Math.round(totalWasteWeight * 20) // Approx 20 bottles per kg
                            }
                          }
                        };

                        // Generate CSV content
                        const csvHeader = "PipaPal Annual Environmental Impact Report\n" +
                          `Period: ${annualImpact.period}\n` +
                          `Organization: ${annualImpact.organization}\n` +
                          `Generated: ${new Date().toLocaleString()}\n\n`;
                          
                        let csvContent = csvHeader + 
                          "Environmental Impact Summary\n" +
                          `Total Waste Managed,${formatNumber(annualImpact.metrics.totalWaste)} kg\n` +
                          `Recycling Rate,${annualImpact.metrics.recyclingRate}%\n` +
                          `Water Saved,${formatNumber(annualImpact.metrics.waterSaved)} L\n` +
                          `CO2 Reduced,${formatNumber(annualImpact.metrics.co2Reduced)} kg\n` +
                          `Trees Equivalent,${formatNumber(annualImpact.metrics.treesEquivalent)}\n` +
                          `Energy Conserved,${formatNumber(annualImpact.metrics.energyConserved)} kWh\n\n`;
                        
                        // Add real-world equivalents section
                        csvContent += "Real-World Environmental Impact Equivalents\n" +
                          `Car Miles Saved,${formatNumber(annualImpact.metrics.equivalents.carMilesSaved)} miles\n` +
                          `Shower Minutes Saved,${formatNumber(annualImpact.metrics.equivalents.showerMinutesSaved)} minutes\n` +
                          `Light Bulb Hours,${formatNumber(annualImpact.metrics.equivalents.lightBulbHours)} hours\n` +
                          `Plastic Bottles Saved,${formatNumber(annualImpact.metrics.equivalents.plasticBottlesSaved)} bottles\n\n`;
                        
                        // Add monthly trend data if available
                        if (monthlyData.length > 0) {
                          csvContent += "Monthly Environmental Impact Trends\n";
                          csvContent += "Month,Waste Collected (kg),CO2 Reduced (kg),Water Saved (L),Energy Conserved (kWh)\n";
                          monthlyData.forEach(month => {
                            csvContent += `${month.name},${formatNumber(month.wasteCollected)},${formatNumber(month.co2Reduced)},${formatNumber(month.waterSaved)},${formatNumber(month.energyConserved)}\n`;
                          });
                        }

                        // Create and download file
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `PipaPal_Annual_Environmental_Impact_${new Date().getFullYear()}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                  
                  {/* Waste Management Compliance */}
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mr-3">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Waste Management Compliance</p>
                        <p className="text-sm text-muted-foreground">April 2025</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="flex items-center bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => {
                        // Prepare compliance report data
                        const month = "April";
                        const year = "2025";
                        const currentMonthData = monthlyData.find(m => m.name === "Apr") || {
                          wasteCollected: 0,
                          co2Reduced: 0,
                          waterSaved: 0,
                          energyConserved: 0
                        };
                        
                        // Count collections by status
                        const collectionsByStatus = {
                          scheduled: collections.filter(c => 
                            c.status === CollectionStatus.SCHEDULED &&
                            new Date(c.scheduledDate).getMonth() === new Date().getMonth()
                          ).length,
                          completed: collections.filter(c => 
                            c.status === CollectionStatus.COMPLETED &&
                            c.completedDate && 
                            new Date(c.completedDate).getMonth() === new Date().getMonth()
                          ).length,
                          cancelled: collections.filter(c => 
                            c.status === CollectionStatus.CANCELLED &&
                            new Date(c.scheduledDate).getMonth() === new Date().getMonth()
                          ).length,
                          total: collections.filter(c => 
                            new Date(c.scheduledDate).getMonth() === new Date().getMonth()
                          ).length
                        };

                        const complianceReport = {
                          period: `${month} ${year}`,
                          organization: user.fullName || user.username,
                          generated: new Date().toISOString(),
                          metrics: {
                            wasteCollected: currentMonthData.wasteCollected,
                            recyclingRate: recyclingRate,
                            scheduleCompliance: scheduleCompliance,
                            collections: collectionsByStatus,
                            wasteComposition: wasteTypes.map(type => ({
                              type: type.name,
                              amount: type.value,
                              percentage: Math.round((type.value / totalWasteWeight) * 100)
                            }))
                          }
                        };

                        // Generate CSV content
                        const csvHeader = "PipaPal Waste Management Compliance Report\n" +
                          `Period: ${complianceReport.period}\n` +
                          `Organization: ${complianceReport.organization}\n` +
                          `Generated: ${new Date().toLocaleString()}\n\n`;

                        let csvContent = csvHeader +
                          "Compliance Summary\n" +
                          `Waste Collected,${formatNumber(complianceReport.metrics.wasteCollected)} kg\n` +
                          `Recycling Rate,${complianceReport.metrics.recyclingRate}%\n` +
                          `Schedule Compliance,${complianceReport.metrics.scheduleCompliance}%\n\n`;

                        // Add collections status breakdown
                        csvContent += "Collections Status\n" +
                          `Total Collections,${complianceReport.metrics.collections.total}\n` +
                          `Scheduled,${complianceReport.metrics.collections.scheduled}\n` +
                          `Completed,${complianceReport.metrics.collections.completed}\n` +
                          `Cancelled,${complianceReport.metrics.collections.cancelled}\n\n`;
                          
                        // Add waste composition if available
                        if (complianceReport.metrics.wasteComposition.length > 0) {
                          csvContent += "Waste Composition\n";
                          csvContent += "Type,Amount (kg),Percentage\n";
                          complianceReport.metrics.wasteComposition.forEach(type => {
                            csvContent += `${type.type},${formatNumber(type.amount)},${type.percentage}%\n`;
                          });
                        }

                        // Add compliance notes section
                        csvContent += "\nCompliance Requirements\n" +
                          "1. All waste must be properly sorted according to type\n" +
                          "2. Hazardous waste must be clearly marked and separately contained\n" +
                          "3. Maintain minimum 70% recycling rate as per local regulations\n" +
                          "4. All scheduled pickups must be completed within 24 hours of scheduled time\n\n" +
                          `Certification: This report certifies that ${complianceReport.organization} has maintained proper waste management practices for the period of ${complianceReport.period} in accordance with local environmental regulations.`;

                        // Create and download file
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `PipaPal_Compliance_Report_${complianceReport.period.replace(/\s/g, '_')}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                Sustainability Goals
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Track progress towards environmental targets
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`flex items-center justify-center h-12 w-12 rounded-full ${
                      recyclingRate >= 50 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {recyclingRate >= 50 
                        ? <Check className="h-6 w-6" /> 
                        : <RecycleIcon className="h-6 w-6" />
                      }
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <h3 className="text-sm font-medium">Reduce non-recyclable waste by 50%</h3>
                      <span className={`text-sm font-medium ${
                        recyclingRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {recyclingRate >= 50 ? '✓ Achieved' : 'In Progress'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-1">
                      <div 
                        className={`h-2.5 rounded-full ${recyclingRate >= 50 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(recyclingRate * 2, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>Target: 50% reduction</span>
                      <span>Current: {recyclingRate >= 50 ? '50%+' : `${recyclingRate}%`}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`flex items-center justify-center h-12 w-12 rounded-full ${
                      scheduleCompliance >= 90 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {scheduleCompliance >= 90 
                        ? <Check className="h-6 w-6" /> 
                        : <CalendarCheck className="h-6 w-6" />
                      }
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <h3 className="text-sm font-medium">Achieve 90% pickup schedule compliance</h3>
                      <span className={`text-sm font-medium ${
                        scheduleCompliance >= 90 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {scheduleCompliance >= 90 ? '✓ Achieved' : 'In Progress'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-1">
                      <div 
                        className={`h-2.5 rounded-full ${scheduleCompliance >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(scheduleCompliance * 1.1, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>Target: 90% compliance</span>
                      <span>Current: {scheduleCompliance}%</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`flex items-center justify-center h-12 w-12 rounded-full ${
                      (impact?.co2Reduced || 0) >= 1000 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {(impact?.co2Reduced || 0) >= 1000 
                        ? <Check className="h-6 w-6" /> 
                        : <Leaf className="h-6 w-6" />
                      }
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <h3 className="text-sm font-medium">Reduce CO₂ emissions by 1000kg</h3>
                      <span className={`text-sm font-medium ${
                        (impact?.co2Reduced || 0) >= 1000 ? 'text-green-600 dark:text-green-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {(impact?.co2Reduced || 0) >= 1000 ? '✓ Achieved' : 'In Progress'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-1">
                      <div 
                        className={`h-2.5 rounded-full ${(impact?.co2Reduced || 0) >= 1000 ? 'bg-green-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(((impact?.co2Reduced || 0) / 1000) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>Target: 1000kg</span>
                      <span>Current: {formatNumber(impact?.co2Reduced || 0)}kg</span>
                    </p>
                  </div>
                </div>
                
                {/* Display custom goals */}
                {customGoals.map(goal => {
                  // Get color classes based on the color choice
                  const colorOption = colorOptions.find(c => c.value === goal.color) || colorOptions[0];
                  const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  const achieved = goal.current >= goal.target;
                  
                  return (
                    <div className="flex items-center" key={goal.id}>
                      <div className="flex-shrink-0 mr-4">
                        <div className={`flex items-center justify-center h-12 w-12 rounded-full ${
                          achieved 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : `${colorOption.bg} ${colorOption.text}`
                        }`}>
                          {achieved 
                            ? <Check className="h-6 w-6" /> 
                            : <div className="text-xl">{goal.icon}</div>
                          }
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <h3 className="text-sm font-medium">{goal.name}</h3>
                          <span className={`text-sm font-medium ${
                            achieved ? 'text-green-600 dark:text-green-400' : `${colorOption.text}`
                          }`}>
                            {achieved ? '✓ Achieved' : 'In Progress'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-1">
                          <div 
                            className={`h-2.5 rounded-full ${achieved ? 'bg-green-500' : colorOption.accent}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground flex justify-between">
                          <span>Target: {formatNumber(goal.target)} {goal.metric}</span>
                          <span>Current: {formatNumber(goal.current)} {goal.metric}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Call-to-action card */}
                <div className="mt-4 bg-muted/40 rounded-lg p-4 border border-dashed flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Set additional sustainability goals</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Define custom environmental targets for your organization
                    </p>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="ml-auto">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Goal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Sustainability Goal</DialogTitle>
                        <DialogDescription>
                          Create a custom goal to track your organization's environmental initiatives.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="goal-name" className="text-right">
                            Goal Name
                          </Label>
                          <Input
                            id="goal-name"
                            className="col-span-3"
                            placeholder="Reduce plastic waste"
                            value={newGoal.name}
                            onChange={(e) => handleGoalChange('name', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="target" className="text-right">
                            Target
                          </Label>
                          <div className="flex items-center col-span-3 gap-2">
                            <Input
                              id="target"
                              type="number"
                              className="flex-1"
                              placeholder="100"
                              value={newGoal.target.toString()}
                              onChange={(e) => handleGoalChange('target', parseFloat(e.target.value) || 0)}
                            />
                            <Select 
                              value={newGoal.metric} 
                              onValueChange={(value) => handleGoalChange('metric', value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="%">percent</SelectItem>
                                <SelectItem value="L">liters</SelectItem>
                                <SelectItem value="kWh">kWh</SelectItem>
                                <SelectItem value="units">units</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="current" className="text-right">
                            Current Progress
                          </Label>
                          <Input
                            id="current"
                            type="number"
                            className="col-span-3"
                            placeholder="0"
                            value={newGoal.current.toString()}
                            onChange={(e) => handleGoalChange('current', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">
                            Icon
                          </Label>
                          <div className="flex flex-wrap gap-2 col-span-3">
                            {availableIcons.map((icon) => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => handleGoalChange('icon', icon)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-lg
                                  ${newGoal.icon === icon ? 'bg-primary/20 border border-primary' : 'hover:bg-muted'}
                                `}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">
                            Color
                          </Label>
                          <div className="flex flex-wrap gap-2 col-span-3">
                            {colorOptions.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => handleGoalChange('color', color.value)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md
                                  ${color.bg}
                                  ${newGoal.color === color.value ? 'ring-2 ring-primary' : ''}
                                `}
                              >
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit"
                          onClick={handleAddGoal}
                          disabled={!newGoal.name || newGoal.target <= 0}
                        >
                          Add Goal
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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