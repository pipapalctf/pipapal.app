import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@shared/schema';

export default function DevLogin() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  
  // Mutation for the development login
  const devLoginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/dev-login', { 
        email,
        password: 'development-only' // Password isn't checked on the server
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      return await response.json() as User;
    },
    onSuccess: (user) => {
      toast({
        title: 'Development Login Successful',
        description: `Logged in as ${user.email} (${user.role})`,
      });
      
      // Set the user in the query cache
      queryClient.setQueryData(['/api/user'], user);
      
      // Force reload to refresh the app state
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Development Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleDevLogin = (email: string) => {
    devLoginMutation.mutate(email);
  };

  return (
    <Card className="shadow-md border-red-300 bg-red-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-red-700">Development Login</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <p className="text-sm text-red-800">
              This is for development testing only. Select a user to login:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDevLogin('nellys@gmail.com')}
                className="border-red-300 hover:bg-red-100"
              >
                Nelly (Household)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDevLogin('milkahjane@gmail.com')}
                className="border-red-300 hover:bg-red-100"
              >
                Milkah (Collector)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDevLogin('johnking@gmail.com')}
                className="border-red-300 hover:bg-red-100"
              >
                John (Recycler)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDevLogin('lynn@gmail.com')}
                className="border-red-300 hover:bg-red-100"
              >
                Lynn (Organization)
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Or enter any email manually"
                className="h-8"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDevLogin(email)}
                disabled={!email}
                className="border-red-300 hover:bg-red-100"
              >
                Login
              </Button>
            </div>
          </div>
          
          {devLoginMutation.isPending && (
            <div className="text-center text-sm text-red-600">
              Logging in...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}