import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/shared/navbar";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Leaf, Users, Trophy,
  ChevronDown, ChevronUp, Zap, AlertCircle, Star
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
  communityComparison: {
    userKg: number;
    communityAvgKg: number;
    role: string;
    city: string;
  };
  weeklyChallenge: {
    title: string;
    description: string;
    reward: string;
    goalKg: number;
    progressKg: number;
    steps: string[];
  };
  sustainabilityLevel: string;
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

function getLevelColor(level: string): string {
  if (level.startsWith("Level 6")) return "text-purple-400 bg-purple-900/40 border-purple-700";
  if (level.startsWith("Level 5")) return "text-blue-300 bg-blue-900/40 border-blue-700";
  if (level.startsWith("Level 4")) return "text-green-300 bg-green-900/40 border-green-700";
  if (level.startsWith("Level 3")) return "text-emerald-300 bg-emerald-900/40 border-emerald-700";
  if (level.startsWith("Level 2")) return "text-teal-300 bg-teal-900/40 border-teal-700";
  return "text-lime-300 bg-lime-900/40 border-lime-700";
}

function CommunityBar({ comparison }: { comparison: EcoBuddyInsights["communityComparison"] }) {
  const { userKg, communityAvgKg, city } = comparison;
  const max = Math.max(userKg, communityAvgKg, 1);
  const userPct = Math.round((userKg / max) * 100);
  const avgPct = Math.round((communityAvgKg / max) * 100);
  const isAhead = userKg >= communityAvgKg;
  const diff = Math.abs(userKg - communityAvgKg).toFixed(1);
  const noData = communityAvgKg === 0;

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Your impact vs {city} average</h3>
          <p className="text-xs text-muted-foreground">Last 2 weeks · same role</p>
        </div>
      </div>

      {noData ? (
        <p className="text-sm text-muted-foreground">
          Not enough community data yet — you'll see a comparison as more users join PipaPal in {city}.
        </p>
      ) : (
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-foreground">You</span>
              <span className="text-xs font-bold text-green-700 dark:text-green-400">{userKg.toFixed(1)} kg</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${userPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-muted-foreground">{city} avg</span>
              <span className="text-xs font-medium text-muted-foreground">{communityAvgKg.toFixed(1)} kg</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-400 transition-all"
                style={{ width: `${avgPct}%` }}
              />
            </div>
          </div>
          <p className="text-xs mt-2 font-medium">
            {isAhead
              ? <span className="text-green-700 dark:text-green-400">You're {diff}kg ahead of the local average — great work!</span>
              : <span className="text-orange-700 dark:text-orange-400">{diff}kg behind the local average — a couple more pickups will close that gap.</span>}
          </p>
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: EcoBuddyInsight }) {
  const [expanded, setExpanded] = useState(false);
  const colors = insightColors[insight.type];
  const firstAction = insight.actions[0];
  const restActions = insight.actions.slice(1);

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
          <h3 className="font-semibold text-sm leading-snug mb-2">{insight.title}</h3>

          {/* First action always visible */}
          {firstAction && (
            <div className="flex items-start gap-2 text-sm mb-1">
              <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">→</span>
              <span className="text-foreground/80 font-medium">{firstAction}</span>
            </div>
          )}

          {expanded && (
            <>
              <p className="text-sm text-muted-foreground my-2 leading-relaxed">{insight.explanation}</p>
              <div className="space-y-1.5">
                {restActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">→</span>
                    <span className="text-foreground/80">{action}</span>
                  </div>
                ))}
              </div>
            </>
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
  if (trend === "up") return <TrendingUp className="h-5 w-5 text-green-300" />;
  if (trend === "down") return <TrendingDown className="h-5 w-5 text-red-300" />;
  return <Minus className="h-5 w-5 text-blue-300" />;
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
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

export default function EcoTipsPage() {
  const { data: insights, isLoading, isError, refetch, isFetching } = useQuery<EcoBuddyInsights>({
    queryKey: ["/api/eco-buddy/tips"],
    staleTime: 0,
  });

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
            <p className="text-muted-foreground text-sm mt-0.5">Personalised insights from your own impact data</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
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
                <Button onClick={() => refetch()} size="sm" variant="outline">Try again</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">

            {/* Hero card — greeting + score + level */}
            <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-green-600 to-emerald-700 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                    🌿
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base leading-snug mb-1">{insights.greeting}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <TrendIcon trend={insights.overallTrend} />
                      <span className="text-sm text-green-100">{insights.behaviorSummary}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-green-100">
                    <Star className="h-4 w-4 text-yellow-300" />
                    <span className="font-medium text-white">{insights.sustainabilityScore ?? 0} pts</span>
                  </div>
                  {insights.sustainabilityLevel && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getLevelColor(insights.sustainabilityLevel)}`}>
                      {insights.sustainabilityLevel}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Behavioural insight cards */}
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

            {/* Community comparison bar */}
            {insights.communityComparison && (
              <CommunityBar comparison={insights.communityComparison} />
            )}

            {/* Weekly challenge with progress */}
            {insights.weeklyChallenge && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-semibold text-sm">{insights.weeklyChallenge.title}</h3>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs">This week</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insights.weeklyChallenge.description}</p>
                  </div>
                </div>

                {/* Progress bar */}
                {insights.weeklyChallenge.goalKg > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-foreground/70">This week's progress</span>
                      <span className="text-amber-700 dark:text-amber-400">
                        {insights.weeklyChallenge.progressKg.toFixed(1)} / {insights.weeklyChallenge.goalKg} kg
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, (insights.weeklyChallenge.progressKg / insights.weeklyChallenge.goalKg) * 100)}
                      className="h-2.5 bg-amber-200 dark:bg-amber-900/60 [&>div]:bg-amber-500"
                    />
                    {insights.weeklyChallenge.progressKg >= insights.weeklyChallenge.goalKg && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">Goal reached! 🎉</p>
                    )}
                  </div>
                )}

                {/* Steps */}
                {insights.weeklyChallenge.steps?.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {insights.weeklyChallenge.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
                        <span className="text-foreground/80">{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-sm pt-1 border-t border-amber-200 dark:border-amber-800/60">
                  <span className="text-amber-600 dark:text-amber-400">🏅</span>
                  <span className="text-foreground/80 font-medium">{insights.weeklyChallenge.reward}</span>
                </div>
              </div>
            )}

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
