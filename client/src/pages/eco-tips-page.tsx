import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ThumbsUp, ThumbsDown, Share, Award, Bookmark, BookmarkCheck, RefreshCw } from "lucide-react";
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
  const [currentTab, setCurrentTab] = useState("all");
  const [savedTips, setSavedTips] = useState<number[]>([]);
  const [likedTips, setLikedTips] = useState<number[]>([]);
  
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
      toast({
        title: "New tip generated",
        description: `'${data.title}' has been added to your collection`,
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
  
  const handleSaveTip = (tipId: number) => {
    if (savedTips.includes(tipId)) {
      setSavedTips(savedTips.filter(id => id !== tipId));
      toast({
        title: "Removed from saved",
        description: "Tip removed from your saved collection"
      });
    } else {
      setSavedTips([...savedTips, tipId]);
      toast({
        title: "Saved",
        description: "Tip saved to your collection"
      });
    }
  };
  
  const handleLikeTip = (tipId: number) => {
    if (!likedTips.includes(tipId)) {
      setLikedTips([...likedTips, tipId]);
      toast({
        title: "Thanks for the feedback!",
        description: "We'll use this to improve future tips",
      });
    }
  };
  
  // Filter tips based on search term, category, and current tab
  const filteredTips = ecoTips?.filter(tip => {
    const matchesSearch = !searchTerm || 
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || tip.category === selectedCategory;
    
    const tipCreatedAt = tip.createdAt ? new Date(tip.createdAt) : new Date();
    const matchesTab = 
      currentTab === "all" || 
      (currentTab === "saved" && savedTips.includes(tip.id)) ||
      (currentTab === "newest" && tipCreatedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return matchesSearch && matchesCategory && matchesTab;
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
              <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> All Tips
                  </TabsTrigger>
                  <TabsTrigger value="newest" className="flex items-center gap-2">
                    <Award className="h-4 w-4" /> Newest
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="flex items-center gap-2">
                    <BookmarkCheck className="h-4 w-4" /> Saved ({savedTips.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : filteredTips && filteredTips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTips.map(tip => {
                    const categoryInfo = ecoTipCategories.find(cat => cat.value === tip.category);
                    const createdAt = tip.createdAt ? new Date(tip.createdAt) : new Date();
                    const isNewTip = createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000;
                    const isSaved = savedTips.includes(tip.id);
                    const isLiked = likedTips.includes(tip.id);
                    
                    return (
                      <Card key={tip.id} className="overflow-hidden flex flex-col h-full">
                        <div className={`bg-primary-50 p-4 border-b relative`}>
                          <div className="flex items-center">
                            <IconBadge 
                              icon={tip.icon || categoryInfo?.icon || 'lightbulb'} 
                              bgColor={'bg-primary-100'}
                              textColor={'text-primary-600'}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <h3 className="font-montserrat font-semibold text-lg text-secondary">
                                {tip.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {categoryInfo?.label || tip.category}
                                </Badge>
                                {isNewTip && (
                                  <Badge variant="default" className="bg-blue-500 text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-5 flex-grow">
                          <p className="text-gray-700">{tip.content}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center p-4 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={isLiked ? "text-green-500" : "text-gray-400"}
                              onClick={() => handleLikeTip(tip.id)}
                              disabled={isLiked}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-400"
                              onClick={() => handleLikeTip(tip.id)} // We're just tracking likes for now
                              disabled={isLiked}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-gray-500 ml-1">
                              {createdAt.toLocaleDateString()}
                            </span>
                          </div>
                          <Button 
                            variant={isSaved ? "default" : "outline"} 
                            size="sm" 
                            className={`h-8 px-3 ${isSaved ? "bg-primary text-white" : "text-primary"}`}
                            onClick={() => handleSaveTip(tip.id)}
                          >
                            {isSaved ? <BookmarkCheck className="h-4 w-4 mr-1" /> : <Bookmark className="h-4 w-4 mr-1" />}
                            {isSaved ? "Saved" : "Save"}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mb-4 text-4xl text-gray-300">
                      <RefreshCw className="mx-auto h-12 w-12" />
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
                        setCurrentTab("all");
                        handleGenerateTip("recycling");
                      }}
                      disabled={generateTipMutation.isPending}
                      className="gap-2"
                    >
                      {generateTipMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
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
