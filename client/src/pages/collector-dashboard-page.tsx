import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Collection, CollectionStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Ban,
  ChevronRight,
  Filter,
  ClipboardList,
  Route,
  MapPin,
  Trash2,
  BarChart3,
} from "lucide-react";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

// Status badge component with appropriate colors
function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case CollectionStatus.PENDING:
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case CollectionStatus.CONFIRMED:
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case CollectionStatus.IN_PROGRESS:
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
      case CollectionStatus.COMPLETED:
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case CollectionStatus.CANCELLED:
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case CollectionStatus.PENDING:
        return <Clock className="h-3.5 w-3.5 mr-1" />;
      case CollectionStatus.CONFIRMED:
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      case CollectionStatus.IN_PROGRESS:
        return <Truck className="h-3.5 w-3.5 mr-1" />;
      case CollectionStatus.COMPLETED:
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      case CollectionStatus.CANCELLED:
        return <Ban className="h-3.5 w-3.5 mr-1" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
    }
  };

  return (
    <Badge variant="outline" className={`flex items-center ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="capitalize">{status.replace("_", " ").toLowerCase()}</span>
    </Badge>
  );
}

export default function CollectorDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("today");

  // Fetch assigned collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections/assigned"],
  });

  // Simulated performance data - would come from API in real implementation
  const performanceData = {
    completedToday: 5,
    totalAssigned: 12,
    onTimeRate: 94,
    avgTimePerPickup: 23,
    customerRating: 4.8,
    pending: 4,
    confirmed: 3,
    inProgress: 2,
    completed: 8,
    cancelled: 1,
  };

  // Filter collections based on status
  const getTodayCollections = () => {
    const today = new Date().toISOString().split("T")[0];
    return collections.filter(
      collection => 
        new Date(collection.scheduledDate).toISOString().split("T")[0] === today
    );
  };

  const getPendingCollections = () => {
    return collections.filter(
      collection => collection.status === CollectionStatus.PENDING || 
                    collection.status === CollectionStatus.CONFIRMED
    );
  };

  const getCompletedCollections = () => {
    return collections.filter(
      collection => collection.status === CollectionStatus.COMPLETED
    );
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-secondary">
              Collector Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your assigned collections and track your performance
            </p>
          </div>
        </div>
        
        {/* Performance Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-800">Completed Today</p>
                  <p className="text-2xl font-bold text-emerald-900">{performanceData.completedToday}/{performanceData.totalAssigned}</p>
                </div>
                <div className="bg-emerald-200 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">On-Time Rate</p>
                  <p className="text-2xl font-bold text-blue-900">{performanceData.onTimeRate}%</p>
                </div>
                <div className="bg-blue-200 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Avg. Time</p>
                  <p className="text-2xl font-bold text-amber-900">{performanceData.avgTimePerPickup} min</p>
                </div>
                <div className="bg-amber-200 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Customer Rating</p>
                  <p className="text-2xl font-bold text-purple-900">{performanceData.customerRating}/5</p>
                </div>
                <div className="bg-purple-200 p-2 rounded-full">
                  <BarChart3 className="h-5 w-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Collection Status Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Collection Status Summary</CardTitle>
            <CardDescription>Overview of all your assigned collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-yellow-700 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-800">{performanceData.pending}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-700 text-sm font-medium">Confirmed</p>
                <p className="text-2xl font-bold text-blue-800">{performanceData.confirmed}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-indigo-700 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-indigo-800">{performanceData.inProgress}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-green-700 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-800">{performanceData.completed}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-red-700 text-sm font-medium">Cancelled</p>
                <p className="text-2xl font-bold text-red-800">{performanceData.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Collection Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="today" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Today's Pickups
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center">
              <ClipboardList className="mr-2 h-4 w-4" />
              Pending/Confirmed
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed
            </TabsTrigger>
          </TabsList>
          
          {/* Today's Collections */}
          <TabsContent value="today">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Today's Collection Schedule</CardTitle>
                  <CardDescription>
                    {getTodayCollections().length} pickups scheduled for today
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </CardHeader>
              <CardContent>
                {getTodayCollections().length > 0 ? (
                  <div className="space-y-4">
                    {getTodayCollections().map((collection) => (
                      <div key={collection.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <StatusBadge status={collection.status} />
                            <span className="ml-2 text-sm text-gray-500">
                              {formatDate(collection.scheduledDate)}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700 truncate">
                              {collection.address || "No address provided"}
                            </p>
                          </div>
                          <div className="flex items-start mt-1">
                            <Trash2 className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700 font-medium capitalize">
                              {collection.wasteType.replace("_", " ").toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4 md:mt-0">
                          {collection.status === CollectionStatus.PENDING && (
                            <Button size="sm" variant="outline">Confirm</Button>
                          )}
                          {collection.status === CollectionStatus.CONFIRMED && (
                            <Button size="sm">Start Collection</Button>
                          )}
                          {collection.status === CollectionStatus.IN_PROGRESS && (
                            <Button size="sm" variant="default">Complete</Button>
                          )}
                          <Button size="sm" variant="ghost">
                            Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No collections scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Pending/Confirmed Collections */}
          <TabsContent value="pending">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending & Confirmed Collections</CardTitle>
                  <CardDescription>
                    {getPendingCollections().length} pickups awaiting action
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </CardHeader>
              <CardContent>
                {getPendingCollections().length > 0 ? (
                  <div className="space-y-4">
                    {getPendingCollections().map((collection) => (
                      <div key={collection.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <StatusBadge status={collection.status} />
                            <span className="ml-2 text-sm text-gray-500">
                              {formatDate(collection.scheduledDate)}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700 truncate">
                              {collection.address || "No address provided"}
                            </p>
                          </div>
                          <div className="flex items-start mt-1">
                            <Trash2 className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700 font-medium capitalize">
                              {collection.wasteType.replace("_", " ").toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4 md:mt-0">
                          {collection.status === CollectionStatus.PENDING && (
                            <Button size="sm" variant="outline">Confirm</Button>
                          )}
                          {collection.status === CollectionStatus.CONFIRMED && (
                            <Button size="sm">Start Collection</Button>
                          )}
                          <Button size="sm" variant="ghost">
                            Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No pending or confirmed collections</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Completed Collections */}
          <TabsContent value="completed">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Completed Collections</CardTitle>
                  <CardDescription>
                    History of your completed pickups
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </CardHeader>
              <CardContent>
                {getCompletedCollections().length > 0 ? (
                  <div className="space-y-4">
                    {getCompletedCollections().map((collection) => (
                      <div key={collection.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <StatusBadge status={collection.status} />
                            <span className="ml-2 text-sm text-gray-500">
                              {formatDate(collection.scheduledDate)}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700 truncate">
                              {collection.address || "No address provided"}
                            </p>
                          </div>
                          <div className="flex items-start mt-1">
                            <Trash2 className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700 font-medium capitalize">
                              {collection.wasteType.replace("_", " ").toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4 md:mt-0">
                          <Button size="sm" variant="ghost">
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No completed collections yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}