import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Sparkles, Lightbulb, Search, Leaf, Droplet, Zap, Car, Recycle,
  Trash2, TreePine, Award, TrendingUp, Scale, BarChart3, ArrowRight,
  RefreshCw, ChevronRight, Target, Flame, Globe, AlertCircle
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EcoTip } from "@shared/schema";
import { ecoTipCategories } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import TipContent from "@/components/eco-tips/tip-content";
import { formatNumber } from "@/lib/utils";

type PersonalizedTip = {
  title: string;
  content: string;
  icon: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
};

type UserProfile = {
  role: string;
  totalWasteKg: number;
  topWasteTypes: { name: string; value: number }[];
  co2Reduced: number;
  waterSaved: number;
  totalCollections: number;
  completedCollections: number;
  recyclingRate: number;
  badgeCount: number;
};

type PersonalizedResponse = {
  profile: UserProfile;
  tips: PersonalizedTip[];
};

const getCategoryIcon = (categoryValue: string) => {
  switch (categoryValue) {
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

const getCategoryColors = (categoryValue: string) => {
  switch (categoryValue) {
    case 'water': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-100' };
    case 'energy': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-100' };
    case 'waste': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-100' };
    case 'plastic': return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-100' };
    case 'composting': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', iconBg: 'bg-green-100' };
    case 'recycling': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-100' };
    case 'transportation': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-100' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', iconBg: 'bg-gray-100' };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high': return { label: 'Recommended', color: 'bg-red-100 text-red-700 border-red-200', icon: <Flame className="h-3 w-3" /> };
    case 'medium': return { label: 'Suggested', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Target className="h-3 w-3" /> };
    case 'low': return { label: 'Advanced', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <TrendingUp className="h-3 w-3" /> };
    default: return { label: 'Tip', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Lightbulb className="h-3 w-3" /> };
  }
};

export default function EcoTipsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customTipPrompt, setCustomTipPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("personalized");

  const { data: personalizedData, isLoading: personalizedLoading, refetch: refetchPersonalized } = useQuery<PersonalizedResponse>({
    queryKey: ['/api/ecotips/personalized'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: ecoTips = [], isLoading: tipsLoading } = useQuery<EcoTip[]>({
    queryKey: ["/api/ecotips"],
  });

  const generateTipMutation = useMutation({
    mutationFn: async (payload: { category: string; customPrompt?: string }) => {
      const res = await apiRequest("POST", "/api/ecotips/generate", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecotips"] });
      setActiveTab("library");
      setCustomTipPrompt("");
      toast({ title: "Tip generated", description: `"${data.title}" has been added` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate tip", description: error.message, variant: "destructive" });
    }
  });

  const profile = personalizedData?.profile;
  const personalizedTips = personalizedData?.tips || [];

  const filteredLibraryTips = ecoTips.filter(tip => {
    const matchesSearch = !searchTerm ||
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || tip.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow">
        <section className="border-b bg-gradient-to-br from-green-50 via-emerald-50/30 to-background">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-white/60 border-green-200 text-green-700 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Personalized for You
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                Your Eco Tips
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Tips and insights tailored to your waste management habits, helping you make a bigger environmental impact.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6">
          {profile && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Your Impact Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">Waste Managed</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-700">{formatNumber(profile.totalWasteKg)} kg</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">CO₂ Reduced</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700">{formatNumber(profile.co2Reduced)} kg</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-50 to-white border-cyan-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplet className="h-4 w-4 text-cyan-600" />
                      <span className="text-xs text-muted-foreground">Water Saved</span>
                    </div>
                    <div className="text-xl font-bold text-cyan-700">{formatNumber(profile.waterSaved)} L</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Recycle className="h-4 w-4 text-teal-600" />
                      <span className="text-xs text-muted-foreground">Recycling Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-bold text-teal-700">{profile.recyclingRate}%</div>
                    </div>
                    <Progress value={profile.recyclingRate} className="h-1.5 mt-1" />
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-muted-foreground">Collections</span>
                    </div>
                    <div className="text-xl font-bold text-amber-700">
                      {profile.completedCollections}<span className="text-sm font-normal text-muted-foreground">/{profile.totalCollections}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {profile.topWasteTypes.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Top waste types:</span>
                    {profile.topWasteTypes.slice(0, 4).map((wt) => (
                      <Badge key={wt.name} variant="outline" className="capitalize text-xs">
                        {wt.name} ({formatNumber(wt.value)} kg)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="personalized" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                For You
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-1.5">
                <Lightbulb className="h-4 w-4" />
                Tip Library
              </TabsTrigger>
              <TabsTrigger value="ask" className="gap-1.5">
                <Search className="h-4 w-4" />
                Ask AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personalized" className="mt-0 space-y-4">
              {personalizedLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">Analyzing your behavior and generating tips...</p>
                </div>
              ) : !user ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Sign in for personalized tips</h3>
                  <p className="text-muted-foreground">Log in to get eco-tips based on your waste management activity.</p>
                </Card>
              ) : personalizedTips.length === 0 ? (
                <Card className="p-8 text-center">
                  <Leaf className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">No tips yet</h3>
                  <p className="text-muted-foreground mb-4">Start scheduling waste collections to get personalized tips based on your activity.</p>
                  <Button onClick={() => refetchPersonalized()} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Based on Your Activity
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchPersonalized()}
                      disabled={personalizedLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1.5 ${personalizedLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalizedTips.map((tip, index) => {
                      const priorityConfig = getPriorityConfig(tip.priority);
                      return (
                        <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-tight">{tip.title}</CardTitle>
                              <Badge variant="outline" className={`shrink-0 text-xs ${priorityConfig.color}`}>
                                {priorityConfig.icon}
                                <span className="ml-1">{priorityConfig.label}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                              <span className="text-xs text-primary font-medium">{tip.reason}</span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <TipContent content={tip.content} />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="library" className="mt-0 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tips..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedCategory ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {ecoTipCategories.map(category => {
                  const colors = getCategoryColors(category.value);
                  return (
                    <Button
                      key={category.value}
                      variant="outline"
                      size="sm"
                      className={`rounded-full ${selectedCategory === category.value ? `${colors.bg} ${colors.text} ${colors.border}` : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === category.value ? null : category.value)}
                    >
                      <span className="mr-1.5">{getCategoryIcon(category.value)}</span>
                      {category.label}
                    </Button>
                  );
                })}
              </div>

              {tipsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredLibraryTips.length === 0 ? (
                <Card className="p-8 text-center">
                  <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">No tips found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try a different search term." : "Generate some tips using the Ask AI tab."}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLibraryTips.map(tip => {
                    const colors = getCategoryColors(tip.category);
                    return (
                      <Card key={tip.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-2">
                            <div className={`p-1.5 rounded-md ${colors.iconBg} ${colors.text} shrink-0`}>
                              {getCategoryIcon(tip.category)}
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm leading-tight">{tip.title}</CardTitle>
                              <Badge variant="outline" className={`text-xs mt-1 ${colors.bg} ${colors.text} ${colors.border}`}>
                                {tip.category}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <TipContent content={tip.content} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ask" className="mt-0">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Ask for a Specific Tip
                  </CardTitle>
                  <CardDescription>
                    Enter a topic or question and our AI will generate a detailed, actionable eco-tip for you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      placeholder="e.g., how to recycle old tires in Kenya"
                      value={customTipPrompt}
                      onChange={(e) => setCustomTipPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customTipPrompt.trim()) {
                          generateTipMutation.mutate({
                            category: selectedCategory || "recycling",
                            customPrompt: customTipPrompt.trim()
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground self-center">Category:</span>
                    {ecoTipCategories.map(cat => (
                      <Button
                        key={cat.value}
                        variant={selectedCategory === cat.value ? "default" : "outline"}
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => setSelectedCategory(cat.value)}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (customTipPrompt.trim()) {
                        generateTipMutation.mutate({
                          category: selectedCategory || "recycling",
                          customPrompt: customTipPrompt.trim()
                        });
                      } else {
                        generateTipMutation.mutate({
                          category: selectedCategory || ecoTipCategories[Math.floor(Math.random() * ecoTipCategories.length)].value
                        });
                      }
                    }}
                    disabled={generateTipMutation.isPending}
                  >
                    {generateTipMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />{customTipPrompt.trim() ? 'Generate Tip' : 'Generate Random Tip'}</>
                    )}
                  </Button>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick topics to try:</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Composting in an apartment",
                        "Reducing plastic at home",
                        "E-waste disposal in Kenya",
                        "Rainwater harvesting",
                        "Energy saving cooking tips",
                        "Zero waste shopping"
                      ].map(topic => (
                        <Button
                          key={topic}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setCustomTipPrompt(topic);
                            generateTipMutation.mutate({
                              category: selectedCategory || "recycling",
                              customPrompt: topic
                            });
                          }}
                          disabled={generateTipMutation.isPending}
                        >
                          <ChevronRight className="h-3 w-3 mr-1" />
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNavigation />
      <Footer />
    </div>
  );
}
