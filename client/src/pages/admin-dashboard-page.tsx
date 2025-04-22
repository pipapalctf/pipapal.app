import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRole, UserRoleType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout";
import { Eye, Search, Download, RefreshCw, UserCog, Ban } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatDistance } from "date-fns";

// Define columns for the users table
const userColumns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }: any) => {
      const role = row.getValue("role") as UserRoleType;
      const colorMap: Record<UserRoleType, string> = {
        [UserRole.HOUSEHOLD]: "bg-green-100 text-green-800",
        [UserRole.COLLECTOR]: "bg-blue-100 text-blue-800",
        [UserRole.RECYCLER]: "bg-purple-100 text-purple-800",
        [UserRole.ORGANIZATION]: "bg-yellow-100 text-yellow-800",
        [UserRole.ADMIN]: "bg-red-100 text-red-800",
      };

      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorMap[role]}`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }: any) => {
      const date = new Date(row.getValue("createdAt"));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const user = row.original;
      return (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedUser(user);
              setViewUserDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Handle edit functionality
            }}
          >
            <UserCog className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      );
    },
  },
];

// Define columns for the collections table
const collectionColumns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "userId",
    header: "User ID",
  },
  {
    accessorKey: "wasteType",
    header: "Waste Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.getValue("status");
      const colorMap: Record<string, string> = {
        scheduled: "bg-blue-100 text-blue-800",
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-green-100 text-green-800",
        in_progress: "bg-purple-100 text-purple-800",
        completed: "bg-teal-100 text-teal-800",
        cancelled: "bg-gray-100 text-gray-800",
      };

      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorMap[status] || ""}`}>
          {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
        </span>
      );
    },
  },
  {
    accessorKey: "scheduledDate",
    header: "Scheduled Date",
    cell: ({ row }: any) => {
      const date = new Date(row.getValue("scheduledDate"));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }: any) => {
      const date = new Date(row.getValue("createdAt"));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: any) => {
      const collection = row.original;
      return (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            // This could link to a collection details view or show a dialog
            // For now let's just console.log the collection details
            console.log('Collection details:', collection);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      );
    },
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPromotingUser, setIsPromotingUser] = useState(false);
  
  // Function to promote a user to admin role
  const promoteToAdmin = async (userId: number) => {
    if (!confirm("Are you sure you want to promote this user to admin? This action grants them full system access.")) {
      return;
    }
    
    setIsPromotingUser(true);
    
    try {
      const res = await apiRequest("POST", `/api/admin/promote/${userId}`);
      const data = await res.json();
      
      toast({
        title: "User promoted successfully",
        description: "The user has been given admin permissions",
        variant: "default",
      });
      
      // Refresh the users list
      refetchUsers();
      
      // If the user being viewed was promoted, update the selected user
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: UserRole.ADMIN });
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      toast({
        title: "Failed to promote user",
        description: "There was an error giving admin permissions to the user",
        variant: "destructive",
      });
    } finally {
      setIsPromotingUser(false);
    }
  };

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      const data = await res.json();
      return data;
    },
    enabled: user?.role === UserRole.ADMIN,
  });

  // Fetch all collections
  const { data: collections = [], isLoading: isLoadingCollections, refetch: refetchCollections } = useQuery({
    queryKey: ["/api/admin/collections"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/collections");
      const data = await res.json();
      return data;
    },
    enabled: user?.role === UserRole.ADMIN,
  });

  // Fetch overall stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats");
      const data = await res.json();
      return data;
    },
    enabled: user?.role === UserRole.ADMIN,
  });

  // Filter users based on search query
  const filteredUsers = users.filter((user: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query) ||
      user.id?.toString().includes(query)
    );
  });

  // Filter collections based on search query
  const filteredCollections = collections.filter((collection: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.wasteType?.toLowerCase().includes(query) ||
      collection.status?.toLowerCase().includes(query) ||
      collection.id?.toString().includes(query) ||
      collection.userId?.toString().includes(query)
    );
  });

  // Function to export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map((item) => 
      Object.values(item).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"`
          : value
      ).join(",")
    );
    
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If not admin, show access denied
  if (user?.role !== UserRole.ADMIN) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center h-full py-20">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-lg text-gray-700 mb-6">
            You do not have permission to access the admin dashboard.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.totalUsers || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.totalCollections || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Waste (kg)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.totalWaste?.toFixed(2) || "0.00"
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users (Past Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stats?.activeUsers || 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() =>
                  selectedTab === "users" ? refetchUsers() : refetchCollections()
                }
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  exportToCSV(
                    selectedTab === "users" ? filteredUsers : filteredCollections,
                    selectedTab
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DataTable columns={userColumns} data={filteredUsers} />
              )}
            </TabsContent>

            <TabsContent value="collections">
              {isLoadingCollections ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <DataTable columns={collectionColumns} data={filteredCollections} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">ID</Label>
                    <p>{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p>{selectedUser.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Username</Label>
                    <p>{selectedUser.username}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Role</Label>
                    <div className="flex items-center gap-2">
                      <Badge>
                        {selectedUser.role.charAt(0).toUpperCase() +
                          selectedUser.role.slice(1)}
                      </Badge>
                      {selectedUser.role !== UserRole.ADMIN && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => promoteToAdmin(selectedUser.id)}
                          disabled={isPromotingUser}
                        >
                          {isPromotingUser ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserCog className="h-4 w-4 mr-2" />
                          )}
                          Promote to Admin
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>
                      {new Date(selectedUser.createdAt).toLocaleDateString()} ({formatDistance(new Date(selectedUser.createdAt), new Date(), { addSuffix: true })})
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Email Verified</Label>
                    <p>{selectedUser.emailVerified ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Onboarding Completed</Label>
                    <p>{selectedUser.onboardingCompleted ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p>{selectedUser.address || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p>{selectedUser.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Sustainability Score
                    </Label>
                    <p>{selectedUser.sustainabilityScore || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUserDialogOpen(false)}>
              Close
            </Button>
            <Button variant="default">Edit User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}