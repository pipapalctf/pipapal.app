import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Sparkles, Lightbulb, Search, Leaf, Droplet, Zap, Car, Recycle,
  Trash2, Award, TrendingUp, Scale, BarChart3, ArrowRight,
  RefreshCw, ChevronRight, Target, Flame, Globe, AlertCircle, MessageCircle, Send
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

type AskResponse = {
  title: string;
  answer: string;
  suggestions: string[];
};

const wasteTypeCategories: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  plastic: { label: 'Plastic', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  paper: { label: 'Paper', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  organic: { label: 'Organic', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  metal: { label: 'Metal', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  glass: { label: 'Glass', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  electronic: { label: 'Electronic', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  hazardous: { label: 'Hazardous', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  cardboard: { label: 'Cardboard', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  general: { label: 'General', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
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
  const [activeTab, setActiveTab] = useState("personalized");
  const [askInput, setAskInput] = useState("");
  const [askResult, setAskResult] = useState<AskResponse | null>(null);
  const [selectedWasteFilter, setSelectedWasteFilter] = useState<string | null>(null);

  const { data: personalizedData, isLoading: personalizedLoading, refetch: refetchPersonalized } = useQuery<PersonalizedResponse>({
    queryKey: ['/api/ecotips/personalized'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ecotips/ask", { question });
      return res.json() as Promise<AskResponse>;
    },
    onSuccess: (data) => {
      setAskResult(data);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to get answer", description: error.message, variant: "destructive" });
    }
  });

  const handleAsk = (question?: string) => {
    const q = question || askInput.trim();
    if (!q) {
      toast({ title: "Enter a question", description: "Type a question about your waste management habits", variant: "destructive" });
      return;
    }
    if (question) setAskInput(question);
    askMutation.mutate(q);
  };

  const profile = personalizedData?.profile;
  const personalizedTips = personalizedData?.tips || [];

  const filteredTips = selectedWasteFilter
    ? personalizedTips.filter(tip =>
        tip.title.toLowerCase().includes(selectedWasteFilter) ||
        tip.content.toLowerCase().includes(selectedWasteFilter) ||
        tip.reason.toLowerCase().includes(selectedWasteFilter)
      )
    : personalizedTips;

  const userWasteTypes = profile?.topWasteTypes.map(wt => wt.name.toLowerCase()) || [];

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
                  Based on Your Impact
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                Your Eco Tips
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Personalized tips based on your waste management data and environmental impact metrics.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6">
          {profile && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Your Impact Metrics
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
                    <div className="text-xl font-bold text-teal-700">{profile.recyclingRate}%</div>
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
                    <span className="text-xs text-muted-foreground">Your waste profile:</span>
                    {profile.topWasteTypes.slice(0, 5).map((wt) => {
                      const config = wasteTypeCategories[wt.name.toLowerCase()] || wasteTypeCategories.general;
                      return (
                        <Badge key={wt.name} variant="outline" className={`capitalize text-xs ${config.bgColor} ${config.color} ${config.borderColor}`}>
                          {wt.name} ({formatNumber(wt.value)} kg)
                        </Badge>
                      );
                    })}
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
                By Waste Type
              </TabsTrigger>
              <TabsTrigger value="ask" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Ask AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personalized" className="mt-0 space-y-4">
              {personalizedLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">Analyzing your impact data...</p>
                </div>
              ) : !user ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Sign in for personalized tips</h3>
                  <p className="text-muted-foreground">Log in to get eco-tips based on your waste management data.</p>
                </Card>
              ) : personalizedTips.length === 0 ? (
                <Card className="p-8 text-center">
                  <Leaf className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">No tips yet</h3>
                  <p className="text-muted-foreground mb-4">Start scheduling waste collections to get tips based on your activity.</p>
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
                      Based on Your Impact Data
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
              {personalizedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !user ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Sign in to view tips</h3>
                  <p className="text-muted-foreground">Log in to see tips organized by your waste types.</p>
                </Card>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={!selectedWasteFilter ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => setSelectedWasteFilter(null)}
                    >
                      All Tips
                    </Button>
                    {userWasteTypes.map(wt => {
                      const config = wasteTypeCategories[wt] || wasteTypeCategories.general;
                      return (
                        <Button
                          key={wt}
                          variant="outline"
                          size="sm"
                          className={`rounded-full capitalize ${selectedWasteFilter === wt ? `${config.bgColor} ${config.color} ${config.borderColor}` : ''}`}
                          onClick={() => setSelectedWasteFilter(selectedWasteFilter === wt ? null : wt)}
                        >
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>

                  {filteredTips.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold text-lg mb-1">No tips for this waste type</h3>
                      <p className="text-muted-foreground">Try selecting a different waste type or view all tips.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTips.map((tip, index) => {
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
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="ask" className="mt-0">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Ask About Your Impact
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your waste management data and get personalized advice based on your metrics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., How can I improve my recycling rate?"
                      value={askInput}
                      onChange={(e) => setAskInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && askInput.trim()) handleAsk();
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleAsk()}
                      disabled={askMutation.isPending || !askInput.trim()}
                    >
                      {askMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center">Try asking:</span>
                    {[
                      "How can I improve my recycling rate?",
                      "What's my environmental impact?",
                      "How to reduce my waste?",
                      ...(userWasteTypes[0] ? [`Tips for my ${userWasteTypes[0]} waste`] : []),
                      "How can I earn more badges?",
                    ].map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleAsk(suggestion)}
                        disabled={askMutation.isPending}
                      >
                        <ChevronRight className="h-3 w-3 mr-1 shrink-0" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>

                  {askMutation.isPending && (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Analyzing your data...</p>
                    </div>
                  )}

                  {askResult && !askMutation.isPending && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          {askResult.title}
                        </h3>
                        <div className="bg-muted/30 rounded-lg p-4 text-sm leading-relaxed">
                          {askResult.answer}
                        </div>
                      </div>

                      {askResult.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Follow-up questions:</h4>
                          <div className="flex flex-wrap gap-2">
                            {askResult.suggestions.map((suggestion, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleAsk(suggestion)}
                                disabled={askMutation.isPending}
                              >
                                <ChevronRight className="h-3 w-3 mr-1" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
