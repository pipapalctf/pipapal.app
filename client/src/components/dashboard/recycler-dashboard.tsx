import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Recycle, Leaf, Package, TrendingUp, FileText, Scale, Truck, ShoppingBag, MapPin, Star, Calendar, ChevronRight, Clock, Users, Activity, Award } from 'lucide-react';
import { User, CollectionStatus, Collection, Impact, MaterialInterest } from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import RoleBasedCTA from './role-based-cta';
import RecentActivity from './recent-activity';

interface EnhancedMaterialInterest extends MaterialInterest {
  collection?: Collection;
}

interface RecyclerDashboardProps {
  user: User;
}

/**
 * Dashboard for Recycler users
 * Focused on materials sourcing and recycling stats based on completed transactions
 */
export default function RecyclerDashboard({ user }: RecyclerDashboardProps) {
  // Fetch the recycler's material interests (their actual transactions)
  const { data: materialInterests = [] } = useQuery<EnhancedMaterialInterest[]>({
    queryKey: ['/api/materials/interests'],
  });

  // Only count completed transactions - these are the materials the recycler has actually purchased
  const completedInterests = materialInterests.filter(
    (interest) => interest.status === 'completed'
  );

  // Extract the collection data from completed interests
  const purchasedMaterials = completedInterests
    .filter((interest) => interest.collection)
    .map((interest) => interest.collection as Collection);

  // Calculate total materials purchased
  const totalPurchased = purchasedMaterials.reduce(
    (total, material) => total + (material.wasteAmount || 10), 
    0
  );

  // Calculate CO2 offset (assumption: 2kg CO2 per kg of recycled material)
  const co2Offset = totalPurchased * 2;

  // Group materials by type for pie chart
  const materialsByType = purchasedMaterials.reduce((acc, material) => {
    const wasteType = material.wasteType || 'general';
    // Skip general waste as it's typically not recyclable
    if (wasteType === 'general') return acc;
    
    const amount = material.wasteAmount || 10;
    
    if (!acc[wasteType]) {
      acc[wasteType] = { name: wasteType.charAt(0).toUpperCase() + wasteType.slice(1), value: 0 };
    }
    
    acc[wasteType].value += amount;
    return acc;
  }, {});
  
  const materialTypesData = Object.values(materialsByType);

  // Group by month for timeline
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const purchasesByMonth = months.map(month => {
    return {
      name: month,
      amount: 0,
      value: 0
    };
  });
  
  purchasedMaterials.forEach(material => {
    const date = new Date(material.completedDate || material.scheduledDate);
    const monthIndex = date.getMonth();
    purchasesByMonth[monthIndex].amount += (material.wasteAmount || 10);
    // Fictional monetary value: KSh 20 per kg for recyclables
    purchasesByMonth[monthIndex].value += (material.wasteAmount || 10) * 20;
  });

  // Top supplying collectors (fictional data based on user IDs)
  const collectorStats = purchasedMaterials.reduce((acc, material) => {
    const collectorId = material.collectorId || 'unknown';
    const collectorName = `Collector ${collectorId}`;
    const amount = material.wasteAmount || 10;
    
    if (!acc[collectorName]) {
      acc[collectorName] = { name: collectorName, amount: 0 };
    }
    
    acc[collectorName].amount += amount;
    return acc;
  }, {});
  
  const topCollectors = Object.values(collectorStats)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Random colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF', '#FFA556', '#4CD790'];
  
  // Variables for achievement badges
  const completedCollections = purchasedMaterials;
  const totalWasteRecycled = totalPurchased;
  
  // Count unique waste types
  const wasteTypesCount = new Set(purchasedMaterials.map(material => material.wasteType));
  
  // Get impact data
  const { data: impactData } = useQuery({
    queryKey: ['/api/impacts', user.id],
    enabled: !!user.id,
  });
  
  const impact: Impact | undefined = impactData;

  return (
    <div className="space-y-6 p-2 md:p-6">
      {/* User Welcome Section */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recycler Dashboard</h1>
            <h2 className="text-xl font-medium text-primary mt-2">
              Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Recycler'}!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Today's materials are waiting to be transformed into new resources.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Leaf className="h-4 w-4 mr-1" />
              Sustainability Partner
            </div>
          </div>
        </div>
      </div>
      
      {/* Role-specific CTAs */}
      <RoleBasedCTA />
      
      {/* Key Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recyclables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 mr-3">
                <Scale className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold">{formatNumber(totalPurchased)} kg</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Material Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 mr-3">
                <Recycle className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold">{materialTypesData.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CO₂ Offset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-teal-100 mr-3">
                <Leaf className="h-5 w-5 text-teal-600" />
              </div>
              <span className="text-2xl font-bold">{formatNumber(co2Offset)} kg</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-amber-100 mr-3">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold">KSh {formatNumber(totalPurchased * 20, 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="materials" className="mt-2">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Recycle className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Truck className="h-4 w-4 mr-2" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="activities" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4 mr-2" />
            Activities
          </TabsTrigger>
        </TabsList>
        
        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-green-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Recycle className="mr-2 h-5 w-5 text-blue-500" />
                  Recyclable Materials Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={materialTypesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {materialTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${formatNumber(value)} kg`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 to-teal-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Leaf className="mr-2 h-5 w-5 text-green-500" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-muted-foreground mb-1">CO₂ Emissions Reduced</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-green-600">{formatNumber(co2Offset)} kg</div>
                      <div className="text-sm text-green-500 flex items-center mb-1 bg-green-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        12% from last month
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
                      <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{width: '72%'}}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Trees Equivalent</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-teal-600">{formatNumber(co2Offset / 20, 1)}</div>
                      <div className="text-sm text-teal-500 flex items-center mb-1 bg-teal-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        9% from last month
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
                      <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Water Saved</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-blue-600">{formatNumber(totalPurchased * 50)} L</div>
                      <div className="text-sm text-blue-500 flex items-center mb-1 bg-blue-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        15% from last month
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Package className="mr-2 h-5 w-5 text-indigo-500" />
                Material Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Material Type</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Amount (kg)</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Value (KSh)</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">CO₂ Offset (kg)</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialTypesData.map((material, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2 flex-shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{material.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 font-medium">{formatNumber(material.value)}</td>
                        <td className="text-center py-3 px-4 text-emerald-600 font-medium">KSh {formatNumber(material.value * 20, 0)}</td>
                        <td className="text-center py-3 px-4 font-medium">{formatNumber(material.value * 2)}</td>
                        <td className="text-center py-3 px-4">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600 mr-1"></span>
                            Good
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {materialTypesData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          <Package className="h-10 w-10 mx-auto mb-2 text-muted" />
                          <p className="font-medium">No recyclable materials data available</p>
                          <p className="text-sm">Start processing materials to see them here</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                  Material Volume Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={purchasesByMonth}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} width={40} />
                      <Tooltip 
                        formatter={(value) => [`${formatNumber(value)} kg`, 'Amount']}
                        labelStyle={{fontWeight: 'bold'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Amount (kg)" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }} 
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <ShoppingBag className="mr-2 h-5 w-5 text-green-500" />
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purchasesByMonth}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4ade80" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} width={40} />
                      <Tooltip 
                        formatter={(value) => [`KSh ${formatNumber(value, 0)}`, 'Revenue']}
                        labelStyle={{fontWeight: 'bold'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Value (KSh)" 
                        radius={[4, 4, 0, 0]} 
                        fill="url(#colorValue)" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-amber-500" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchasedMaterials.length > 0 ? (
                <div className="space-y-3">
                  {purchasedMaterials.slice(0, 5).map((material) => (
                    <div key={material.id} className="flex items-center p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="mr-4 p-2.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700">
                        <Recycle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{material.wasteType} Material</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(material.completedDate || material.scheduledDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">{material.wasteAmount || 10} kg</p>
                        <p className="text-sm font-medium text-emerald-600">KSh {formatNumber((material.wasteAmount || 10) * 20, 0)}</p>
                      </div>
                    </div>
                  ))}
                  {purchasedMaterials.length > 5 && (
                    <div className="text-center pt-2">
                      <button className="inline-flex items-center text-primary hover:text-primary/80 transition-colors text-sm font-medium bg-primary/5 px-4 py-2 rounded-lg">
                        View all {purchasedMaterials.length} transactions
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <h3 className="text-lg font-medium mb-1">No Transaction History</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Start processing recyclable materials to see your transaction history here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6 pt-3">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-400 to-indigo-600"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Truck className="mr-2 h-5 w-5 text-purple-500" />
                Top Supplying Collectors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topCollectors} 
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={90} />
                    <Tooltip 
                      formatter={(value) => [`${formatNumber(value)} kg`, 'Amount']}
                      labelStyle={{fontWeight: 'bold'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar 
                      dataKey="amount" 
                      name="Amount (kg)" 
                      fill="url(#colorBar)" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="mr-2 h-5 w-5 text-cyan-500" />
                  Supply Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 h-[280px] flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-10 w-10 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-medium">Interactive Map</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                      A map showing your main supplier locations with delivery radius and volume indicators.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-400 to-violet-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-5 w-5 text-indigo-500" />
                  Top Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCollectors.map((collector, index) => (
                    <div key={index} className="flex items-center p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="mr-4 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{collector.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-3.5 w-3.5 ${star <= (5 - index * 0.5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="ml-1 text-xs">({(5 - index * 0.3).toFixed(1)})</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(collector.amount)} kg</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {topCollectors.length === 0 && (
                    <div className="text-center py-10 px-4">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <h3 className="text-lg font-medium mb-1">No Suppliers Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with collectors to start receiving materials
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <RecentActivity />
            </div>
            
            <Card className="border-0 shadow-md overflow-hidden md:col-span-1">
              <div className="h-2 bg-gradient-to-r from-purple-400 to-pink-500"></div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Star className="mr-2 h-5 w-5 text-purple-500" />
                  Sustainability Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l border-gray-200 dark:border-gray-700 space-y-6 py-2">
                  {/* Milestone items */}
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-green-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-green-600">
                      100 kg Milestone
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You've processed over 100 kg of recyclable materials! Great impact on our environment.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      April 15, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-blue-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-blue-600">
                      First Plastic Processing
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Started processing plastic waste into reusable materials. A big step for circular economy.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      March 22, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-amber-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-amber-600">
                      Community Partnership
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Established partnership with local collectors for steady material supply.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      February 10, 2025
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border-2 border-purple-500 bg-white"></div>
                    <div className="mb-1 text-sm font-medium text-purple-600">
                      Joined PipaPal
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Started your journey as a recycler on the PipaPal platform.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      January 05, 2025
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Achievement Badges */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base">
            <Award className="mr-2 h-5 w-5" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { name: 'Materials Master', achieved: wasteTypesCount.size >= 6, icon: '🔄' },
              { name: 'Volume Leader', achieved: totalWasteRecycled >= 1000, icon: '📦' },
              { name: 'Processing Pro', achieved: completedCollections.length >= 15, icon: '⚙️' },
              { name: 'Carbon Hero', achieved: impact?.co2Reduced > 200, icon: '🌿' },
              { name: 'Water Protector', achieved: impact?.waterSaved > 2000, icon: '💧' },
              { name: 'Forest Guardian', achieved: impact?.treesEquivalent > 10, icon: '🌳' }
            ].map((badge, index) => (
              <div 
                key={index} 
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center ${
                  badge.achieved 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-900 dark:text-teal-100' 
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
    </div>
  );
}