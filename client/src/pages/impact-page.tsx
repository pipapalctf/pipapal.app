import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TotalImpact } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { IconBadge } from "@/components/ui/icon-badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

// Generate mock data for charts
const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => ({
    name: month,
    wasteCollected: Math.floor(Math.random() * 30) + 5,
    co2Reduced: Math.floor(Math.random() * 20) + 2,
  }));
};

const wasteTypeData = [
  { name: 'General', value: 35 },
  { name: 'Plastic', value: 25 },
  { name: 'Paper', value: 20 },
  { name: 'Glass', value: 10 },
  { name: 'Organic', value: 10 },
];

const COLORS = ['#34495E', '#2ECC71', '#3498DB', '#F1C40F', '#E74C3C'];

export default function ImpactPage() {
  const { data: impact, isLoading } = useQuery<TotalImpact>({
    queryKey: ["/api/impact"],
  });
  
  const monthlyData = generateMonthlyData();
  
  const formatNumber = (value?: number) => {
    if (value === undefined) return "0";
    return new Intl.NumberFormat().format(Math.round(value));
  };
  
  // Monthly goal is 100kg of waste diverted
  const monthlyGoalPercentage = impact ? Math.min(100, Math.round((impact.wasteAmount / 100) * 100)) : 0;
  
  // Annual goal is 1000kg of waste diverted
  const annualGoalPercentage = impact ? Math.min(100, Math.round((impact.wasteAmount / 1000) * 100)) : 0;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-secondary">
            Your Environmental Impact
          </h1>
          <p className="text-gray-600 mt-1">
            Track how your recycling efforts are making a difference
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : impact ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Total Waste Diverted</p>
                      <p className="text-3xl font-bold text-secondary mt-1">
                        {formatNumber(impact.wasteAmount)} <span className="text-sm font-normal">kg</span>
                      </p>
                    </div>
                    <IconBadge 
                      icon="dumpster" 
                      bgColor="bg-secondary/10"
                      textColor="text-secondary"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Monthly Goal: 100kg</span>
                      <span className="font-medium">{monthlyGoalPercentage}%</span>
                    </div>
                    <Progress value={monthlyGoalPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">CO₂ Emission Reduced</p>
                      <p className="text-3xl font-bold text-secondary mt-1">
                        {formatNumber(impact.co2Reduced)} <span className="text-sm font-normal">kg</span>
                      </p>
                    </div>
                    <IconBadge 
                      icon="leaf" 
                      bgColor="bg-primary/10"
                      textColor="text-primary"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xs text-gray-500">
                      Equivalent to not driving for <span className="font-medium text-secondary">{Math.round(impact.co2Reduced / 2.3)} km</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Water Saved</p>
                      <p className="text-3xl font-bold text-secondary mt-1">
                        {formatNumber(impact.waterSaved)} <span className="text-sm font-normal">liters</span>
                      </p>
                    </div>
                    <IconBadge 
                      icon="tint" 
                      bgColor="bg-blue-100"
                      textColor="text-blue-600"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xs text-gray-500">
                      Equivalent to <span className="font-medium text-secondary">{Math.round(impact.waterSaved / 200)} showers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Energy Conserved</p>
                      <p className="text-3xl font-bold text-secondary mt-1">
                        {formatNumber(impact.energyConserved)} <span className="text-sm font-normal">kWh</span>
                      </p>
                    </div>
                    <IconBadge 
                      icon="bolt" 
                      bgColor="bg-yellow-100"
                      textColor="text-yellow-600"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xs text-gray-500">
                      Enough to power a home for <span className="font-medium text-secondary">{Math.round(impact.energyConserved / 30)} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Trees Impact & Annual Goal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Waste Collection</CardTitle>
                  <CardDescription>Historical data of your waste diversion efforts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="wasteCollected" name="Waste Collected (kg)" fill="#2ECC71" />
                        <Bar dataKey="co2Reduced" name="CO₂ Reduced (kg)" fill="#34495E" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Trees Equivalent</CardTitle>
                  <CardDescription>Your positive impact on forestation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#e6e6e6"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#2ECC71"
                          strokeWidth="10"
                          strokeDasharray="282.7433388230814"
                          strokeDashoffset={282.7433388230814 * (1 - (impact.treesEquivalent / 20))}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <div className="text-4xl font-bold text-primary">
                          {formatNumber(impact.treesEquivalent)}
                        </div>
                        <div className="text-sm text-gray-500">trees equivalent</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Your recycling efforts have saved the equivalent of {formatNumber(impact.treesEquivalent)} trees so far.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Target: 20 trees equivalent this year
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Waste Breakdown & Annual Goal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Waste Type Breakdown</CardTitle>
                  <CardDescription>Distribution of your recycled materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {wasteTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Annual Goal Progress</CardTitle>
                  <CardDescription>Track your progress towards yearly sustainability goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <div>
                          <h4 className="font-medium">Waste Diversion</h4>
                          <p className="text-sm text-gray-500">Goal: 1,000 kg per year</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(impact.wasteAmount)} kg</p>
                          <p className="text-sm text-primary">{annualGoalPercentage}% completed</p>
                        </div>
                      </div>
                      <Progress value={annualGoalPercentage} className="h-3" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <div>
                          <h4 className="font-medium">CO₂ Reduction</h4>
                          <p className="text-sm text-gray-500">Goal: 250 kg per year</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(impact.co2Reduced)} kg</p>
                          <p className="text-sm text-primary">
                            {Math.min(100, Math.round((impact.co2Reduced / 250) * 100))}% completed
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, Math.round((impact.co2Reduced / 250) * 100))} 
                        className="h-3"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <div>
                          <h4 className="font-medium">Water Conservation</h4>
                          <p className="text-sm text-gray-500">Goal: 5,000 liters per year</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(impact.waterSaved)} liters</p>
                          <p className="text-sm text-primary">
                            {Math.min(100, Math.round((impact.waterSaved / 5000) * 100))}% completed
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, Math.round((impact.waterSaved / 5000) * 100))} 
                        className="h-3"
                      />
                    </div>
                    
                    <div className="p-4 bg-accent/10 rounded-lg text-center">
                      <p className="text-secondary font-medium flex items-center justify-center">
                        <i className="fas fa-medal text-accent mr-2"></i>
                        You're in the top 15% of environmentally conscious users in your area!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mb-4 text-4xl text-gray-300">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="text-xl font-montserrat font-medium text-secondary mb-2">
                No impact data yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start scheduling waste collections to track your environmental impact
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
