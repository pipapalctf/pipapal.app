import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Mailbox, Package, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface MaterialInterest {
  id: number;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  collection: {
    id: number;
    wasteType: string;
    wasteAmount: number;
    address: string;
    completedDate: string | null;
  };
  recycler: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    phone: string | null;
  };
}

export default function InterestsTable() {
  const [selectedInterest, setSelectedInterest] = useState<MaterialInterest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: interests = [], isLoading, error } = useQuery({
    queryKey: ['/api/collector/interests'],
  });

  const handleViewDetails = (interest: MaterialInterest) => {
    setSelectedInterest(interest);
    setDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy - h:mm a');
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading interest requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Failed to load interest requests.</p>
        <p className="text-sm text-gray-500 mt-2">Please try again later.</p>
      </div>
    );
  }

  if (interests.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Mailbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-lg font-medium">No interest requests yet</p>
        <p className="text-sm mt-2">
          When recyclers express interest in your collected materials, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Recycler</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interests.map((interest: MaterialInterest) => (
              <TableRow key={interest.id}>
                <TableCell className="font-medium">
                  {formatDate(interest.createdAt)}
                </TableCell>
                <TableCell>{interest.recycler.fullName}</TableCell>
                <TableCell className="capitalize">{interest.collection.wasteType}</TableCell>
                <TableCell>{interest.collection.wasteAmount} kg</TableCell>
                <TableCell>{getStatusBadge(interest.status)}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewDetails(interest)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Interest Request Details</DialogTitle>
            <DialogDescription>
              Material interest information and recycler contact details
            </DialogDescription>
          </DialogHeader>
          
          {selectedInterest && (
            <div className="space-y-6">
              {/* Recycler Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    Recycler Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{selectedInterest.recycler.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{selectedInterest.recycler.username}</p>
                    <p className="text-xs mt-2">{selectedInterest.recycler.email}</p>
                    {selectedInterest.recycler.phone && (
                      <p className="text-xs">{selectedInterest.recycler.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Material Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Package className="mr-2 h-4 w-4 text-primary" />
                    Material Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Material Type:</span>
                      <span className="text-sm capitalize">{selectedInterest.collection.wasteType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Amount:</span>
                      <span className="text-sm">{selectedInterest.collection.wasteAmount} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <span className="text-sm">{getStatusBadge(selectedInterest.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Pickup Location:</span>
                      <span className="text-sm max-w-[180px] text-right">{selectedInterest.collection.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Collection Date:</span>
                      <span className="text-sm">
                        {selectedInterest.collection.completedDate 
                          ? formatDate(selectedInterest.collection.completedDate)
                          : 'Not completed yet'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Message */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Message from Recycler:</h4>
                <div className="bg-secondary/50 p-3 rounded-md text-sm">
                  {selectedInterest.message || "No message provided."}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </Button>
                {selectedInterest.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      disabled
                    >
                      Decline
                    </Button>
                    <Button
                      variant="default"
                      disabled
                    >
                      Accept
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}