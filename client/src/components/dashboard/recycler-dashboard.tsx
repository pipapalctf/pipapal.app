import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Recycle, Leaf, Package, TrendingUp, FileText, Scale, Truck, ShoppingBag, MapPin, Star } from 'lucide-react';
import { User, CollectionStatus } from '@shared/schema';
import { formatNumber } from '@/lib/utils';

interface RecyclerDashboardProps {
  user: User;
}

/**
 * Dashboard for Recycler users
 * Focused on materials sourcing and recycling stats
 */
export default function RecyclerDashboard({ user }: RecyclerDashboardProps) {
  // In a real app, we would fetch data specific to recycler operations
  // For now, we'll use the general collections data to simulate recycler activity
  const { data: collections = [] } = useQuery({
    queryKey: ['/api/collections'],
  });

  // Assume all completed collections are materials bought by recyclers
  const purchasedMaterials = collections.filter(
    (collection) => collection.status === CollectionStatus.COMPLETED
  );

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
    // Fictional monetary value: $0.20 per kg for recyclables
    purchasesByMonth[monthIndex].value += (material.wasteAmount || 10) * 0.2;
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

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* User Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recycler Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Recycler'}! Today's materials are waiting to be transformed.
        </p>
      </div>
      
      {/* Key Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recyclables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(totalPurchased)} kg</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Material Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Recycle className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{materialTypesData.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CO₂ Offset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Leaf className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatNumber(co2Offset)} kg</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">${formatNumber(totalPurchased * 0.2, 2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        
        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Recycle className="mr-2 h-5 w-5" />
                  Recyclable Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={materialTypesData}
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
                        {materialTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
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
                  <Leaf className="mr-2 h-5 w-5" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-muted-foreground mb-2">CO₂ Emissions Reduced</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold">{formatNumber(co2Offset)} kg</div>
                      <div className="text-sm text-green-500 flex items-center mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        12% from last month
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Trees Equivalent</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold">{formatNumber(co2Offset / 20, 1)}</div>
                      <div className="text-sm text-green-500 flex items-center mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        9% from last month
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Water Saved</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold">{formatNumber(totalPurchased * 50)} L</div>
                      <div className="text-sm text-green-500 flex items-center mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        15% from last month
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Material Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Material</th>
                      <th className="text-center py-3 px-4">Amount (kg)</th>
                      <th className="text-center py-3 px-4">Value ($)</th>
                      <th className="text-center py-3 px-4">CO₂ Offset (kg)</th>
                      <th className="text-center py-3 px-4">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialTypesData.map((material, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{material.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">{formatNumber(material.value)}</td>
                        <td className="text-center py-3 px-4">${formatNumber(material.value * 0.2, 2)}</td>
                        <td className="text-center py-3 px-4">{formatNumber(material.value * 2)}</td>
                        <td className="text-center py-3 px-4">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Good
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {materialTypesData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No recyclable materials data available
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
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Volume Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={purchasesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Amount (kg)" 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Purchase Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purchasesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Value ($)" fill="#4ade80" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchasedMaterials.length > 0 ? (
                <div className="space-y-4">
                  {purchasedMaterials.slice(0, 5).map((material) => (
                    <div key={material.id} className="flex items-center p-3 border rounded-lg">
                      <div className="mr-4 p-2 rounded-full bg-primary/10">
                        <Recycle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{material.wasteType} Material</p>
                        <p className="text-sm text-muted-foreground">
                          Purchased on {new Date(material.completedDate || material.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{material.wasteAmount || 10} kg</p>
                        <p className="text-sm text-muted-foreground">${formatNumber((material.wasteAmount || 10) * 0.2, 2)}</p>
                      </div>
                    </div>
                  ))}
                  {purchasedMaterials.length > 5 && (
                    <div className="text-center">
                      <button className="text-primary hover:underline text-sm">
                        View all {purchasedMaterials.length} transactions
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No purchase history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="amount" name="Amount (kg)" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Supply Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg h-[250px] flex items-center justify-center">
                  <div className="text-center p-6">
                    <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium">Map Visualization</h3>
                    <p className="text-sm text-muted-foreground">
                      A map showing supplier locations would appear here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Supplier Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCollectors.map((collector, index) => (
                    <div key={index} className="flex items-center p-3 border rounded-lg">
                      <div className="mr-4 bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center">
                        <span className="font-bold text-primary">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{collector.name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="h-3 w-3 mr-1 text-yellow-400 fill-yellow-400" />
                          <span>4.{8 - index} rating</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(collector.amount)} kg</p>
                        <p className="text-xs text-muted-foreground">Last delivered: {' '}
                          {new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {topCollectors.length === 0 && (
                    <div className="text-center p-6 text-muted-foreground">
                      <p>No supplier data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}