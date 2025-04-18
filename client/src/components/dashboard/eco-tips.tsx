import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EcoTip } from "@shared/schema";
import { Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ecoTipCategories } from "@/lib/types";

export default function EcoTips() {
  const { toast } = useToast();
  const [selectedTip, setSelectedTip] = useState<EcoTip | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  const { data: ecoTips, isLoading } = useQuery<EcoTip[]>({
    queryKey: ["/api/ecotips"],
  });
  
  const generateTipMutation = useMutation({
    mutationFn: async (category: string) => {
      const res = await apiRequest("POST", "/api/ecotips/generate", { category });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecotips"] });
      setShowGenerateDialog(false);
      toast({
        title: "New tip generated",
        description: `A new ${selectedCategory} eco tip has been added to your collection`
      });
      // Show the newly created tip
      setSelectedTip(data);
      setShowDetailsDialog(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate tip",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleLearnMore = (tip: EcoTip) => {
    setSelectedTip(tip);
    setShowDetailsDialog(true);
  };
  
  const handleGeneratePersonalizedTip = () => {
    setShowGenerateDialog(true);
  };
  
  const submitGenerateTip = () => {
    if (!selectedCategory) {
      toast({
        title: "Category required",
        description: "Please select a category for your personalized tip",
        variant: "destructive"
      });
      return;
    }
    generateTipMutation.mutate(selectedCategory);
  };
  
  // Function to get category description for the detailed tip view
  const getCategoryDescription = (category: string) => {
    switch(category) {
      case 'water':
        return "Water conservation is crucial for preserving our planet's most precious resource. By adopting these practices, you can save thousands of gallons annually.";
      case 'energy':
        return "Energy conservation reduces your carbon footprint and saves money on utility bills. Small changes can lead to significant environmental impact.";
      case 'waste':
        return "Reducing waste helps minimize landfill usage and pollution. Every item diverted from the trash makes a difference.";
      case 'plastic':
        return "Plastic pollution is devastating to marine life and ecosystems. Reducing single-use plastics creates a healthier planet.";
      case 'composting':
        return "Composting returns nutrients to the soil and reduces methane emissions from landfills, creating a natural cycle of renewal.";
      case 'recycling':
        return "Recycling conserves natural resources, reduces pollution, and saves energy compared to producing new materials.";
      default:
        return "Making sustainable choices helps preserve natural resources and protect our planet for future generations.";
    }
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
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-sm text-primary font-medium"
                    onClick={() => handleLearnMore(tip)}
                  >
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
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Get Personalized Tips
          </Button>
        </div>
      </CardContent>
      
      {/* Detailed Eco Tip Dialog */}
      {selectedTip && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <IconBadge 
                  icon={selectedTip.icon || 'lightbulb'} 
                  size="lg"
                  bgColor={
                    selectedTip.category === 'water' ? 'bg-blue-100' : 
                    selectedTip.category === 'energy' ? 'bg-yellow-100' : 
                    'bg-primary/20'
                  }
                  textColor={
                    selectedTip.category === 'water' ? 'text-blue-600' : 
                    selectedTip.category === 'energy' ? 'text-yellow-600' : 
                    'text-primary'
                  }
                />
                <div>
                  <DialogTitle className="text-xl">{selectedTip.title}</DialogTitle>
                  <DialogDescription>
                    {ecoTipCategories.find(cat => cat.value === selectedTip.category)?.label || 'General Eco Tip'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-6">
              <div className="bg-gray-50/70 rounded-lg p-5 mb-6">
                <p className="text-base leading-relaxed">{selectedTip.content}</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Why This Matters</h4>
                <p className="text-sm text-gray-600">
                  {getCategoryDescription(selectedTip.category)}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Generate Personalized Tip Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Generate Personalized Eco Tip</DialogTitle>
            <DialogDescription>
              Choose a category that interests you and we'll create a personalized eco-friendly tip using AI.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tip Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {ecoTipCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center">
                        <IconBadge 
                          icon={category.icon} 
                          size="xs" 
                          className="mr-2"
                          bgColor={
                            category.value === 'water' ? 'bg-blue-100' : 
                            category.value === 'energy' ? 'bg-yellow-100' : 
                            'bg-primary/20'
                          }
                          textColor={
                            category.value === 'water' ? 'text-blue-600' : 
                            category.value === 'energy' ? 'text-yellow-600' : 
                            'text-primary'
                          }
                        />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitGenerateTip}
              disabled={generateTipMutation.isPending || !selectedCategory}
            >
              {generateTipMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Tip
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}