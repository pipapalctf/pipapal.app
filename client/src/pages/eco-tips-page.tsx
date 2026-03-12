import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/shared/navbar";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Leaf, Users, Trophy,
  ChevronDown, ChevronUp, Zap, AlertCircle
} from "lucide-react";

interface EcoBuddyInsight {
  id: string;
  type: "drop" | "spike" | "improvement" | "missed" | "neutral";
  emoji: string;
  title: string;
  explanation: string;
  actions: string[];
}

interface EcoBuddyInsights {
  greeting: string;
  behaviorSummary: string;
  insights: EcoBuddyInsight[];
  cohortInsight: {
    city: string;
    cohortSize: number;
    message: string;
    topActions: string[];
  };
  weeklyChallenge: {
    title: string;
    description: string;
    reward: string;
  };
  overallTrend: "up" | "down" | "stable";
}

const insightColors: Record<EcoBuddyInsight["type"], { bg: string; border: string; badge: string; badgeText: string }> = {
  drop: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    badgeText: "Needs attention",
  },
  spike: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    badgeText: "Notable change",
  },
  improvement: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    badgeText: "Great progress",
  },
  missed: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    badgeText: "Missed pickups",
  },
  neutral: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    badgeText: "Insight",
  },
};

function InsightCard({ insight }: { insight: EcoBuddyInsight }) {
  const [expanded, setExpanded] = useState(false);
  const colors = insightColors[insight.type];

  return (
    <div className={`rounded-xl border p-4 ${colors.bg} ${colors.border} transition-all`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">{insight.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
              {colors.badgeText}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-snug mb-1">{insight.title}</h3>
          {expanded && (
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{insight.explanation}</p>
          )}
          {expanded && (
            <div className="space-y-1.5">
              {insight.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">→</span>
                  <span className="text-foreground/80">{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-5 w-5 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-5 w-5 text-red-500" />;
  return <Minus className="h-5 w-5 text-blue-500" />;
}

function EcoBuddySkeleton() {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}

export default function EcoTipsPage() {
  const { user } = useAuth();
  const { data: insights, isLoading, isError, refetch, isFetching } = useQuery<EcoBuddyInsights>({
    queryKey: ["/api/eco-buddy/tips"],
    staleTime: 0,
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              Eco Buddy
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Personalised insights based on your recycling behaviour</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <EcoBuddySkeleton />
        ) : isError || !insights ? (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <h3 className="font-semibold text-base mb-1">Couldn't load your insights</h3>
                <p className="text-sm text-muted-foreground mb-4">There was a problem generating your Eco Buddy report.</p>
                <Button onClick={handleRefresh} size="sm" variant="outline">Try again</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-green-600 to-emerald-700 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                    🌿
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base leading-snug mb-1">{insights.greeting}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendIcon trend={insights.overallTrend} />
                      <span className="text-sm text-green-100">{insights.behaviorSummary}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm text-green-100">
                    <span className="font-medium text-white">Sustainability score:</span>
                    <span className="text-lg font-bold text-white">{user?.sustainabilityScore ?? 0}</span>
                    <span>pts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {insights.insights.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Your Behavioural Insights
                </h2>
                <div className="space-y-3">
                  {insights.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">
                      How others in {insights.cohortInsight.city} are doing
                    </h3>
                    {insights.cohortInsight.cohortSize > 0 && (
                      <span className="text-xs text-muted-foreground">({insights.cohortInsight.cohortSize} households)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{insights.cohortInsight.message}</p>
                  <div className="space-y-1">
                    {insights.cohortInsight.topActions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                        <span className="text-blue-500 font-bold">•</span>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm">{insights.weeklyChallenge.title}</h3>
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs">This week</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{insights.weeklyChallenge.description}</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-amber-600 dark:text-amber-400">🏅</span>
                    <span className="text-foreground/80 font-medium">{insights.weeklyChallenge.reward}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pb-2">
              Insights based on your last 4 weeks of activity · Updated each time you refresh
            </p>
          </div>
        )}
      </main>
      <MobileNavigation />
    </div>
  );
}
