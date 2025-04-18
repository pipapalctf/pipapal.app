import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EcoTip } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function EcoTips() {
  const { toast } = useToast();
  
  const { data: ecoTips, isLoading } = useQuery<EcoTip[]>({
    queryKey: ["/api/ecotips"],
  });
  
  const generateTipMutation = useMutation({
    mutationFn: async (category: string) => {
      const res = await apiRequest("POST", "/api/ecotips/generate", { category });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecotips"] });
      toast({
        title: "New tip generated",
        description: "A new eco tip has been added to your collection"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate tip",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleGeneratePersonalizedTip = () => {
    const categories = ['water', 'energy', 'waste', 'plastic', 'composting', 'recycling'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    generateTipMutation.mutate(randomCategory);
  };
  
  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle>AI EcoTips</CardTitle>
          <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary font-medium">New</span>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ecoTips && ecoTips.length > 0 ? (
          <>
            {ecoTips.slice(0, 3).map((tip, index) => (
              <div 
                key={tip.id} 
                className={`mb-4 pb-4 ${index < 2 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start mb-2">
                  <IconBadge 
                    icon={tip.icon || 'lightbulb'} 
                    size="sm"
                    bgColor={
                      tip.category === 'water' ? 'bg-blue-100' : 
                      tip.category === 'energy' ? 'bg-yellow-100' : 
                      'bg-primary/20'
                    }
                    textColor={
                      tip.category === 'water' ? 'text-blue-600' : 
                      tip.category === 'energy' ? 'text-yellow-600' : 
                      'text-primary'
                    }
                    className="mr-3 mt-1"
                  />
                  <div>
                    <h4 className="font-medium text-secondary">{tip.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tip.content}</p>
                  </div>
                </div>
                <div className="ml-11">
                  <Button variant="link" className="h-auto p-0 text-sm text-primary font-medium">
                    Learn more
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="py-4 text-center text-gray-500">
            No eco tips available yet
          </div>
        )}

        <div className="mt-5 text-center">
          <Button 
            variant="outline" 
            className="bg-white"
            onClick={handleGeneratePersonalizedTip}
            disabled={generateTipMutation.isPending}
          >
            {generateTipMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <i className="fas fa-brain mr-2"></i>
            )}
            Get Personalized Tips
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
