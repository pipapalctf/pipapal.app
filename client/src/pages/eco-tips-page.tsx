import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, ThumbsUp, ThumbsDown, Share, Award, Bookmark, BookmarkCheck, RefreshCw,
  Sparkles, Lightbulb, Search, Leaf, Droplet, Zap, Car, Recycle, TreePine, Trash2
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EcoTip } from "@shared/schema";
import { ecoTipCategories } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

// Predefined custom tips that will be displayed in the "Custom" tab
// These don't rely on the OpenAI API and are always available
const PREDEFINED_CUSTOM_TIPS = [
  {
    id: "custom-1",
    title: "How to Recycle Old Tires Properly",
    content: "Old tires can be recycled at tire retailers or local recycling centers. Many municipalities offer free tire collection events.\n\n**Did you know?** Only about 35% of tires are recycled properly, yet 100% of a tire can be reused!\n\n**DIY Project:** Create a colorful tire planter by cleaning an old tire, painting it with outdoor paint, adding drainage holes, and filling with soil and plants. Perfect for flowers or growing vegetables in small spaces.",
    category: "recycling",
    isCustom: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "custom-2",
    title: "Electronic Waste Recycling Guide",
    content: "Recycle electronics at dedicated e-waste centers or retailer take-back programs like Best Buy, Staples, and Apple. Always remove personal data before recycling.\n\n**Did you know?** For every million cell phones recycled, 35,000 lbs of copper, 772 lbs of silver, 75 lbs of gold, and 33 lbs of palladium can be recovered!\n\n**DIY Project:** Transform an old laptop into a digital photo frame by removing the screen assembly, installing photo frame software, and creating a custom stand from reclaimed wood.",
    category: "waste",
    isCustom: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: "custom-3",
    title: "Composting Coffee Grounds Tips",
    content: "Coffee grounds add valuable nitrogen to compost. Mix 1 part grounds with 4 parts carbon materials like dried leaves or shredded newspaper.\n\n**Did you know?** Coffee grounds help attract earthworms to your compost, which accelerate decomposition and increase nutrient content!\n\n**DIY Project:** Create a coffee ground scrub by mixing dried coffee grounds with coconut oil and a few drops of essential oil. Store in a sealed jar for a natural exfoliating body scrub that's plastic-free.",
    category: "composting",
    isCustom: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
  {
    id: "custom-4",
    title: "Bathroom Plastic Reduction Methods",
    content: "Replace plastic bottles with solid shampoo bars, bamboo toothbrushes, refillable containers, and metal razors. Choose products with compostable packaging.\n\n**Did you know?** The average person uses about 156 plastic bottles per year in the bathroom alone, most of which end up in landfills!\n\n**DIY Project:** Make your own toothpaste by mixing 2 tbsp coconut oil, 1 tbsp baking soda, 10 drops peppermint essential oil, and 1 tsp stevia. Store in a small glass jar and apply with a bamboo applicator.",
    category: "plastic",
    isCustom: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    id: "custom-5",
    title: "Energy-Efficient Home Cooking Guide",
    content: "Use pressure cookers to reduce cooking time by 70%. Match pot size to burner size and keep lids on when cooking. Turn off electric stovetops 5 minutes before cooking is complete.\n\n**Did you know?** Pressure cookers use 50-75% less energy than conventional cooking methods, saving both time and electricity!\n\n**DIY Project:** Create a heat-retaining cooking box by lining a cardboard box with reflective bubble wrap insulation. After bringing food to temperature on the stove, place the covered pot into the box to continue cooking without using additional energy.",
    category: "energy",
    isCustom: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
  },
  {
    id: "custom-6",
    title: "Rainwater Collection System Setup",
    content: "Install a rain barrel under downspouts with mosquito screens and overflow outlets. A 50-gallon barrel can supply water for a small garden.\n\n**Did you know?** A 1,000 sq. ft. roof can collect approximately 600 gallons of water from just 1 inch of rainfall!\n\n**DIY Project:** Create a decorative rain chain by connecting copper cups or funnels with small chains. Install where a downspout would normally go to guide rainwater directly into your collection barrel while adding visual interest to your home.",
    category: "water",
    isCustom: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  }
];

export default function EcoTipsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
  const [savedTips, setSavedTips] = useState<number[]>([]);
  const [likedTips, setLikedTips] = useState<number[]>([]);
  const [customTipPrompt, setCustomTipPrompt] = useState("");
  const [customLocalTips, setCustomLocalTips] = useState(PREDEFINED_CUSTOM_TIPS);
  
  const { data: ecoTips, isLoading } = useQuery<EcoTip[]>({
    queryKey: ["/api/ecotips"],
  });
  
  const generateTipMutation = useMutation({
    mutationFn: async (payload: { category: string, customPrompt?: string }) => {
      const res = await apiRequest("POST", "/api/ecotips/generate", payload);
      return { 
        ...await res.json(),
        _requestPayload: payload // Keep track of what we requested
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecotips"] });
      
      // Automatically select the "newest" tab to show the new tip
      setCurrentTab("newest");
      
      // Clear category filter only for non-custom prompts
      if (data._requestPayload?.customPrompt) {
        // For custom prompts, don't clear category filter
      } else {
        setSelectedCategory(null);
      }
      
      toast({
        title: "New tip generated",
        description: `'${data.title}' has been added to your collection`,
      });
      
      setCustomTipPrompt(""); // Reset the custom prompt input after successful generation
      
      // Scroll to the tips section, with a delay to allow for DOM updates
      setTimeout(() => {
        // First try to scroll to the newest tip if it exists
        const newestTip = document.getElementById("newest-tip");
        if (newestTip) {
          newestTip.scrollIntoView({ behavior: "smooth", block: "center" });
          
          // Add a subtle highlight animation to draw attention
          newestTip.classList.add('animate-pulse');
          setTimeout(() => {
            newestTip.classList.remove('animate-pulse');
          }, 2000);
        } else {
          // Otherwise just scroll to the content section
          const tipsSection = document.getElementById("eco-tips-content");
          if (tipsSection) {
            tipsSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }, 300); // Slightly longer delay to ensure tips are loaded
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
    generateTipMutation.mutate({ category });
  };
  
  const handleGenerateCustomTip = () => {
    if (!customTipPrompt.trim()) {
      toast({
        title: "Please enter a topic",
        description: "Enter a specific sustainability topic you'd like a tip about",
        variant: "destructive"
      });
      return;
    }
    
    generateTipMutation.mutate({ 
      category: selectedCategory || "recycling", 
      customPrompt: customTipPrompt.trim() 
    });
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
    // Determine if this is a custom tip for filtering
    const isCustomTip = (
      !["Proper Recycling Techniques", "Save Water With Shower Buckets", 
       "Unplug To Save Energy", "Zero-Waste Shopping", "Ditch Single-Use Plastics", 
       "Start Simple Composting", "Green Commuting", "Eco-Friendly Daily Habits"].includes(tip.title) &&
      (tip.title.includes("How") || tip.title.includes("Tips") || 
       tip.title.includes("Guide") || tip.title.length > 20)
    );
    
    const matchesTab = 
      currentTab === "all" || 
      (currentTab === "saved" && savedTips.includes(tip.id)) ||
      (currentTab === "newest" && tipCreatedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ||
      (currentTab === "custom" && isCustomTip);
    
    return matchesSearch && matchesCategory && matchesTab;
  });
  
  // Get the correct icon for category
  const getCategoryIcon = (categoryValue: string) => {
    switch(categoryValue) {
      case 'water': return <Droplet className="h-5 w-5" />;
      case 'energy': return <Zap className="h-5 w-5" />; 
      case 'waste': return <Trash2 className="h-5 w-5" />;
      case 'plastic': return <Recycle className="h-5 w-5" />;
      case 'composting': return <Leaf className="h-5 w-5" />;
      case 'recycling': return <Recycle className="h-5 w-5" />;
      case 'transportation': return <Car className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };
  
  // Get color scheme for category
  const getCategoryColors = (categoryValue: string) => {
    switch(categoryValue) {
      case 'water': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-400 to-blue-600' };
      case 'energy': return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200', gradient: 'from-yellow-400 to-yellow-600' };
      case 'waste': return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', gradient: 'from-orange-400 to-orange-600' };
      case 'plastic': return { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', gradient: 'from-indigo-400 to-indigo-600' };
      case 'composting': return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-400 to-green-600' };
      case 'recycling': return { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-400 to-emerald-600' };
      case 'transportation': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-400 to-purple-600' };
      default: return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', gradient: 'from-primary/70 to-primary' };
    }
  };
  
  // Render formatted tip content with special sections
  const TipContent = ({ content }: { content: string }) => {
    return (
      <>
        {content.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('**Did you know?**')) {
            return (
              <div key={idx} className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">
                  💡 Did you know?
                </p>
                <p className="text-sm text-blue-700">
                  {paragraph.replace('**Did you know?**', '').trim()}
                </p>
              </div>
            );
          } else if (paragraph.startsWith('**DIY Project:**')) {
            return (
              <div key={idx} className="mt-3 p-2 bg-green-50 rounded-md border border-green-100">
                <p className="text-sm text-green-800 font-medium">
                  🛠️ DIY Project
                </p>
                <p className="text-sm text-green-700">
                  {paragraph.replace('**DIY Project:**', '').trim()}
                </p>
              </div>
            );
          } else {
            return (
              <p key={idx} className="text-sm text-gray-700 mb-2">
                {paragraph}
              </p>
            );
          }
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-primary/5 border-b">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-1">
                  <div className="mb-2 flex items-center space-x-2">
                    <Badge variant="outline" className="bg-white/50 border-primary/30 text-primary px-3 py-1 rounded-full">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      AI-Powered
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-montserrat">
                    Sustainable Living Tips & Tricks
                  </h1>
                  <p className="text-gray-600 mb-6 text-lg">
                    Discover practical, everyday actions to reduce your environmental footprint. Our AI-powered 
                    eco-tips provide personalized suggestions for sustainable living.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {ecoTipCategories.slice(0, 4).map(category => (
                      <Button 
                        key={category.value}
                        variant="outline"
                        size="sm"
                        className={`rounded-full ${selectedCategory === category.value ? 'bg-primary/10 border-primary/30' : 'bg-white/50'}`}
                        onClick={() => setSelectedCategory(category.value)}
                      >
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(category.value)}
                          <span>{category.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="relative w-full md:w-2/5 max-w-sm flex-shrink-0">
                  <div className="p-4 bg-white shadow-lg rounded-lg border border-gray-100">
                    <div className="mb-4 flex items-start gap-3">
                      <IconBadge 
                        icon="lightbulb" 
                        bgColor="bg-primary/10"
                        textColor="text-primary"
                        size="lg"
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0"> {/* Add min-width for proper wrapping */}
                        <h3 className="font-semibold text-lg break-words">Generate New Tip</h3>
                        <p className="text-sm text-gray-500">AI-powered sustainability advice</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 break-words">
                        Choose a category and get an AI-generated tip to help you live more sustainably:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ecoTipCategories.slice(0, 4).map(category => (
                          <Button
                            key={category.value}
                            variant="outline"
                            size="sm"
                            className="h-auto py-2 justify-start"
                            onClick={() => handleGenerateTip(category.value)}
                            disabled={generateTipMutation.isPending}
                          >
                            <div className="flex items-center min-w-0">
                              {generateTipMutation.isPending && 
                               generateTipMutation.variables && 
                               typeof generateTipMutation.variables === 'object' &&
                               'category' in generateTipMutation.variables &&
                               generateTipMutation.variables.category === category.value ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                              ) : (
                                <span className="mr-2 flex-shrink-0">{getCategoryIcon(category.value)}</span>
                              )}
                              <span className="truncate">{category.label}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => handleGenerateTip(ecoTipCategories[Math.floor(Math.random() * ecoTipCategories.length)].value)}
                        disabled={generateTipMutation.isPending}
                      >
                        {generateTipMutation.isPending ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Generating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Sparkles className="mr-2 h-4 w-4" />
                            <span>Generate Random Tip</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-green-100 rounded-full -z-10"></div>
                  <div className="absolute -top-3 -left-3 w-16 h-16 bg-blue-100 rounded-full -z-10"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Custom Tip Generator Section */}
          <div className="mt-8 mb-4">
            <Card className="bg-gradient-to-br from-primary-50 to-primary/5 border border-primary/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-primary mb-2 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      AI Generator
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Let our AI create personalized eco-tips tailored to your sustainability interests.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-primary mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1.5" />
                          Ask About Specific Topics
                        </h4>
                        <Input
                          placeholder="e.g., how to recycle old tires"
                          value={customTipPrompt}
                          onChange={(e) => setCustomTipPrompt(e.target.value)}
                          className="bg-white/90 border-primary/20"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <select 
                            className="w-full h-10 rounded-md border border-primary/30 px-3 py-2 text-sm bg-white/90"
                            value={selectedCategory || "recycling"}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                          >
                            {ecoTipCategories.map(category => (
                              <option key={category.value} value={category.value}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          onClick={handleGenerateCustomTip}
                          disabled={generateTipMutation.isPending || !customTipPrompt.trim()}
                          className="bg-primary hover:bg-primary/90 text-white px-6"
                        >
                          {generateTipMutation.isPending ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Generating...</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Sparkles className="h-4 w-4 mr-2" />
                              <span>Generate</span>
                            </div>
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Ask about specific sustainability topics like "reusing plastic bottles" or "eco-friendly packaging"
                      </p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block border-l border-primary/10 pl-5">
                    <h4 className="font-medium text-primary mb-3">Quick Generate by Category</h4>
                    <div className="flex flex-col gap-2 max-w-xs">
                      {ecoTipCategories.slice(0, 3).map(category => {
                        const colors = getCategoryColors(category.value);
                        return (
                          <Button
                            key={category.value}
                            variant="outline"
                            size="sm"
                            className={`justify-start ${colors.bg} ${colors.text} border ${colors.border} overflow-hidden rounded-md hover:opacity-90 transition-opacity`}
                            onClick={() => handleGenerateTip(category.value)}
                            disabled={generateTipMutation.isPending}
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-2">
                                {generateTipMutation.isPending && 
                                 generateTipMutation.variables && 
                                 typeof generateTipMutation.variables === 'object' && 
                                 'category' in generateTipMutation.variables && 
                                 generateTipMutation.variables.category === category.value ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  getCategoryIcon(category.value)
                                )}
                              </div>
                              <span>Generate {category.label} Tip</span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Content Section */}
        <section className="container mx-auto px-4 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg font-montserrat">
                      <Search className="h-4 w-4 mr-2" />
                      Find Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tips..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Categories</h3>
                      <div className="space-y-1.5">
                        <Button
                          variant={selectedCategory === null ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedCategory(null)}
                        >
                          <Leaf className="mr-2 h-4 w-4" />
                          All Categories
                        </Button>
                        
                        {ecoTipCategories.map(category => {
                          const colors = getCategoryColors(category.value);
                          return (
                            <Button
                              key={category.value}
                              variant={selectedCategory === category.value ? "default" : "outline"}
                              size="sm"
                              className={`w-full justify-start ${selectedCategory === category.value ? `bg-gradient-to-r ${colors.gradient} border-0` : ''}`}
                              onClick={() => setSelectedCategory(category.value)}
                            >
                              {getCategoryIcon(category.value)}
                              <span className="ml-2">{category.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-b from-primary/5 to-transparent border-primary/20 overflow-hidden md:hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg font-montserrat text-primary">
                      <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                      Quick Generate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ecoTipCategories.map(category => {
                        const colors = getCategoryColors(category.value);
                        return (
                          <Button
                            key={category.value}
                            variant="outline"
                            size="sm"
                            className={`w-full px-3 py-2.5 ${colors.bg} ${colors.text} border ${colors.border} overflow-hidden rounded-md hover:opacity-90 transition-opacity`}
                            onClick={() => handleGenerateTip(category.value)}
                            disabled={generateTipMutation.isPending}
                          >
                            <div className="flex items-center w-full min-w-0">
                              <div className="flex-shrink-0 mr-2">
                                {generateTipMutation.isPending && 
                                 generateTipMutation.variables && 
                                 typeof generateTipMutation.variables === 'object' && 
                                 'category' in generateTipMutation.variables && 
                                 generateTipMutation.variables.category === category.value ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  getCategoryIcon(category.value)
                                )}
                              </div>
                              <span className="truncate text-sm">Generate {category.label}</span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Content */}
              <div id="eco-tips-content" className="lg:col-span-3">
                <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="mb-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <TreePine className="h-4 w-4" /> All Tips
                    </TabsTrigger>
                    <TabsTrigger value="newest" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Newest
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" /> Custom
                    </TabsTrigger>
                    <TabsTrigger value="saved" className="flex items-center gap-2">
                      <BookmarkCheck className="h-4 w-4" /> Saved ({savedTips.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading your eco tips...</p>
                  </div>
                ) : (currentTab === "custom") ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Show predefined custom tips */}
                    {customLocalTips.map(tip => {
                      const categoryInfo = ecoTipCategories.find(cat => cat.value === tip.category);
                      const colors = getCategoryColors(tip.category || 'default');
                      
                      return (
                        <Card 
                          key={tip.id} 
                          className="overflow-hidden flex flex-col h-full border hover:shadow-md transition-shadow border-primary/50 shadow-sm"
                        >
                          <div className="h-1.5 bg-gradient-to-r w-full" style={{ backgroundImage: `linear-gradient(to right, ${colors.text}, ${colors.text})` }}></div>
                          <CardHeader className="pb-3 bg-primary/5">
                            <div className="flex items-start">
                              <div className={`p-2 rounded-full ${colors.bg} mr-3 flex-shrink-0`}>
                                {getCategoryIcon(tip.category)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg font-semibold mb-1 break-words">
                                  {tip.title}
                                </CardTitle>
                                <div className="flex items-center flex-wrap gap-2">
                                  <Badge variant="outline" className={`${colors.text} ${colors.bg} border-0 text-xs capitalize`}>
                                    {categoryInfo?.label || tip.category}
                                  </Badge>
                                  <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Custom
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {tip.createdAt.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 flex-grow">
                            <p className="text-sm text-gray-700 break-words">{tip.content}</p>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center pt-3 border-t">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-400"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              <span className="text-xs">Like</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-primary"
                            >
                              <Bookmark className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                    
                    {/* Also show any filtered tips from the API that are custom */}
                    {filteredTips && filteredTips.map(tip => {
                      const categoryInfo = ecoTipCategories.find(cat => cat.value === tip.category);
                      const createdAt = tip.createdAt ? new Date(tip.createdAt) : new Date();
                      const isNewTip = createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000;
                      const isSaved = savedTips.includes(tip.id);
                      const isLiked = likedTips.includes(tip.id);
                      // We're in the custom tab, so all displayed API tips should be custom
                      const isCustomTip = true;
                      const colors = getCategoryColors(tip.category || 'default');
                      
                      return (
                        <Card 
                          key={tip.id} 
                          className="overflow-hidden flex flex-col h-full border hover:shadow-md transition-shadow border-primary/50 shadow-sm"
                          id={isNewTip ? 'newest-tip' : undefined}
                        >
                          <div className="h-1.5 bg-gradient-to-r w-full" style={{ backgroundImage: `linear-gradient(to right, ${colors.text}, ${colors.text})` }}></div>
                          <CardHeader className="pb-3 bg-primary/5">
                            <div className="flex items-start">
                              <div className={`p-2 rounded-full ${colors.bg} mr-3 flex-shrink-0`}>
                                {getCategoryIcon(tip.category)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg font-semibold mb-1 break-words">
                                  {tip.title}
                                </CardTitle>
                                <div className="flex items-center flex-wrap gap-2">
                                  <Badge variant="outline" className={`${colors.text} ${colors.bg} border-0 text-xs capitalize`}>
                                    {categoryInfo?.label || tip.category}
                                  </Badge>
                                  {isNewTip && (
                                    <Badge variant="default" className="bg-blue-500 text-xs">
                                      New
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Custom
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {createdAt.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 flex-grow">
                            <p className="text-sm text-gray-700 break-words">{tip.content}</p>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center pt-3 border-t">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={isLiked ? "text-green-500" : "text-gray-400"}
                                onClick={() => handleLikeTip(tip.id)}
                                disabled={isLiked}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                <span className="text-xs">{isLiked ? 'Helpful' : 'Like'}</span>
                              </Button>
                            </div>
                            <Button 
                              variant={isSaved ? "default" : "outline"} 
                              size="sm" 
                              className={isSaved ? "bg-primary text-white" : "text-primary"}
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
                ) : filteredTips && filteredTips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTips.map(tip => {
                      const categoryInfo = ecoTipCategories.find(cat => cat.value === tip.category);
                      const createdAt = tip.createdAt ? new Date(tip.createdAt) : new Date();
                      const isNewTip = createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000;
                      const isSaved = savedTips.includes(tip.id);
                      const isLiked = likedTips.includes(tip.id);
                                          // Get the isCustomTip value from our filtering function above
                      // to keep detection logic consistent
                      const isCustomTip = (
                        // Not one of the default tip titles
                        !["Proper Recycling Techniques", "Save Water With Shower Buckets", 
                         "Unplug To Save Energy", "Zero-Waste Shopping", "Ditch Single-Use Plastics", 
                         "Start Simple Composting", "Green Commuting", "Eco-Friendly Daily Habits"].includes(tip.title) &&
                        // And either has a specific word pattern or is longer than generic titles
                        (tip.title.includes("How") || tip.title.includes("Tips") || 
                         tip.title.includes("Guide") || tip.title.length > 20)
                      );
                      const colors = getCategoryColors(tip.category || 'default');
                      
                      return (
                        <Card 
                          key={tip.id} 
                          className={`overflow-hidden flex flex-col h-full border hover:shadow-md transition-shadow ${isCustomTip ? 'border-primary/50 shadow-sm' : ''}`}
                          id={isNewTip ? 'newest-tip' : undefined}
                        >
                          <div className="h-1.5 bg-gradient-to-r w-full" style={{ backgroundImage: `linear-gradient(to right, ${colors.text}, ${colors.text})` }}></div>
                          <CardHeader className={`pb-3 ${isCustomTip ? 'bg-primary/5' : ''}`}>
                            <div className="flex items-start">
                              <div className={`p-2 rounded-full ${colors.bg} mr-3 flex-shrink-0`}>
                                {getCategoryIcon(tip.category)}
                              </div>
                              <div className="min-w-0 flex-1"> {/* Add min-width to ensure proper text wrapping */}
                                <CardTitle className="text-lg font-semibold mb-1 break-words">
                                  {tip.title}
                                </CardTitle>
                                <div className="flex items-center flex-wrap gap-2">
                                  <Badge variant="outline" className={`${colors.text} ${colors.bg} border-0 text-xs capitalize`}>
                                    {categoryInfo?.label || tip.category}
                                  </Badge>
                                  {isNewTip && (
                                    <Badge variant="default" className="bg-blue-500 text-xs">
                                      New
                                    </Badge>
                                  )}
                                  {isCustomTip && (
                                    <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Custom
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {createdAt.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 flex-grow">
                            <p className="text-sm text-gray-700 break-words">{tip.content}</p>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center pt-3 border-t">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={isLiked ? "text-green-500" : "text-gray-400"}
                                onClick={() => handleLikeTip(tip.id)}
                                disabled={isLiked}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                <span className="text-xs">{isLiked ? 'Helpful' : 'Like'}</span>
                              </Button>
                            </div>
                            <Button 
                              variant={isSaved ? "default" : "outline"} 
                              size="sm" 
                              className={isSaved ? "bg-primary text-white" : "text-primary"}
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
                  <Card className="text-center py-12 border-dashed border-2">
                    <CardContent>
                      <div className="mb-5 bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
                        <Lightbulb className="h-10 w-10 text-primary/70" />
                      </div>
                      <h3 className="text-xl font-montserrat font-medium text-gray-800 mb-3">
                        No eco tips found
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {searchTerm ? "Try a different search term or" : "Start by"} generating a sustainable living tip 
                        to help reduce your environmental footprint.
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
                          <Sparkles className="h-4 w-4" />
                        )}
                        Generate My First Tip
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
