import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EcoTip } from "@shared/schema";
import { ecoTipCategories } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

export default function EcoTipsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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
  
  const handleGenerateTip = (category: string) => {
    generateTipMutation.mutate(category);
  };
  
  // Filter tips based on search term and category
  const filteredTips = ecoTips?.filter(tip => {
    const matchesSearch = !searchTerm || 
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || tip.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-secondary">
              AI-Powered EcoTips
            </h1>
            <p className="text-gray-600 mt-1">
              Discover practical tips for sustainable living and waste management
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      placeholder="Search tips..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-4"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Categories</h3>
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(null)}
                      >
                        All Categories
                      </Button>
                      
                      {ecoTipCategories.map(category => (
                        <Button
                          key={category.value}
                          variant={selectedCategory === category.value ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedCategory(category.value)}
                        >
                          <i className={`fas fa-${category.icon} mr-2`}></i>
                          {category.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary">
                    <i className="fas fa-lightbulb mr-2"></i>
                    Generate Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    Get AI-generated tips for specific categories to enhance your sustainability journey.
                  </p>
                  <div className="space-y-2">
                    {ecoTipCategories.map(category => (
                      <Button
                        key={category.value}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleGenerateTip(category.value)}
                        disabled={generateTipMutation.isPending}
                      >
                        {generateTipMutation.isPending && generateTipMutation.variables === category.value ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <i className={`fas fa-${category.icon} mr-2`}></i>
                        )}
                        Generate {category.label} Tip
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : filteredTips && filteredTips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTips.map(tip => {
                    const categoryInfo = ecoTipCategories.find(cat => cat.value === tip.category);
                    
                    return (
                      <Card key={tip.id} className="overflow-hidden">
                        <div className={`bg-${tip.category === 'water' ? 'blue' : tip.category === 'energy' ? 'yellow' : 'primary'}-50 p-4 border-b`}>
                          <div className="flex items-center">
                            <IconBadge 
                              icon={tip.icon || categoryInfo?.icon || 'lightbulb'} 
                              bgColor={
                                tip.category === 'water' ? 'bg-blue-100' : 
                                tip.category === 'energy' ? 'bg-yellow-100' : 
                                'bg-green-100'
                              }
                              textColor={
                                tip.category === 'water' ? 'text-blue-600' : 
                                tip.category === 'energy' ? 'text-yellow-600' : 
                                'text-green-600'
                              }
                              className="mr-3"
                            />
                            <div>
                              <h3 className="font-montserrat font-semibold text-lg text-secondary">
                                {tip.title}
                              </h3>
                              <p className="text-xs text-gray-500 capitalize">
                                {categoryInfo?.label || tip.category}
                              </p>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <p className="text-gray-700">{tip.content}</p>
                          
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                              {new Date(tip.createdAt).toLocaleDateString()}
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-primary">
                              <i className="fas fa-bookmark mr-2"></i>
                              Save
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mb-4 text-4xl text-gray-300">
                      <i className="fas fa-lightbulb"></i>
                    </div>
                    <h3 className="text-xl font-montserrat font-medium text-secondary mb-2">
                      No eco tips found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm ? "Try a different search term or" : "Start by"} generating some tips!
                    </p>
                    <Button 
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory(null);
                        handleGenerateTip("recycling");
                      }}
                      disabled={generateTipMutation.isPending}
                    >
                      {generateTipMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <i className="fas fa-plus mr-2"></i>
                      )}
                      Generate New Tip
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
