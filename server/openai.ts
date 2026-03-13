import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type EcoTipResponse = {
  title: string;
  content: string;
  icon: string;
}

export async function generateEcoTip(category: string, customPrompt?: string): Promise<EcoTipResponse> {
  try {
    // If no API key is provided, return a predefined tip
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy-key-for-development") {
      return getFallbackEcoTip(category, customPrompt);
    }
    
    let prompt = "";
    
    if (customPrompt) {
      // Much more explicit and forceful prompt for custom queries
      prompt = `IMPORTANT: You MUST generate a HIGHLY SPECIFIC eco-friendly tip that DIRECTLY addresses this EXACT user query: "${customPrompt}".
      
      RULES:
      1. Your response MUST mention "${customPrompt}" by name in both the title and content
      2. AVOID generic advice about ${category} - focus ONLY on "${customPrompt}"
      3. Your response MUST include SPECIFIC methods, steps, or techniques for "${customPrompt}"
      4. Do NOT generalize - stay COMPLETELY focused on "${customPrompt}" 
      5. Include ACTUAL techniques, locations, or resources for "${customPrompt}" whenever possible
      
      EXAMPLES:
      - Query: "recycling old tires"
        BAD response: "General recycling tips..."
        GOOD response: "Recycle old tires by taking them to tire retailers who offer recycling programs, or repurpose them as garden planters by cutting them in half..."
        
      - Query: "composting coffee grounds"
        BAD response: "Composting guidelines..."  
        GOOD response: "Coffee grounds add nitrogen to compost - mix 1 part grounds with 4 parts carbon materials like dried leaves..."
      
      The user will ONLY be satisfied if you provide SPECIFIC, ACTIONABLE information about "${customPrompt}" - not general environmental advice.`;
    } else {
      prompt = `Generate a practical eco-friendly tip related to "${category}". The tip should be actionable advice for sustainable living that users of the PipaPal waste management app can immediately implement.`;
    }
    
    prompt += `
    
    Format the response as JSON with these fields:
    - title: A short, specific title that EXPLICITLY mentions what the tip is about (maximum 50 characters). For example, if it's about recycling tires, the title MUST contain the word "tires" - such as "Recycling Old Tires Methods" or "Tire Recycling & Reuse Options"
    - content: Detailed, specific advice with practical steps (maximum 250 characters). Include exactly HOW to accomplish the task, WHERE to take items if relevant, and WHAT equipment or resources are needed. Be specific, not generic.
    - icon: A single Font Awesome icon name that represents this tip (e.g., 'recycle', 'leaf', 'tint', 'trash', 'seedling', etc.)
    
    The tip should be factual, environmentally sound, and focused on reducing waste or improving recycling habits. Make it engaging and motivational for users.`;

    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an environmental sustainability expert providing EXTREMELY specific eco-friendly tips. Focus exclusively on the exact query provided by the user. Always include the specific topic by name in both title and content. Provide detailed implementation steps, not generalized advice. Include real-world resources when relevant. Never drift into general advice when a specific topic is requested. Your responses should be laser-focused on exactly what was asked."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as EcoTipResponse;
    return result;
  } catch (error) {
    console.error("Error generating EcoTip:", error);
    // When API fails (quota exceeded, etc.), use our fallback system with caching
    const result = getFallbackEcoTip(category, customPrompt);
    
    // Store in cache for future use if it's a custom prompt
    if (customPrompt) {
      const cacheKey = `${category}:${customPrompt.toLowerCase().trim()}`;
      cachedResponses[cacheKey] = result;
    }
    
    return result;
  }
}

// Cached responses for common prompts
const cachedResponses: Record<string, EcoTipResponse> = {};

function getFallbackEcoTip(category: string, customPrompt?: string): EcoTipResponse {
  // If there's a custom prompt, try to find a specific match in our expanded database
  if (customPrompt) {
    const normalizedPrompt = customPrompt.toLowerCase().trim();
    
    // Check cache first
    const cacheKey = `${category}:${normalizedPrompt}`;
    if (cachedResponses[cacheKey]) {
      return cachedResponses[cacheKey];
    }
    
    // Try to match against known custom prompts
    const customTips: Record<string, EcoTipResponse> = {
      // Clothing/Textiles
      "recycle old clothes": {
        title: "Recycling Old Clothes Effectively",
        content: "Donate wearable clothes to local charities, use textile recycling bins at collection points, or repurpose into cleaning rags. In Kenya, organizations like TEXFAD and Takataka Solutions accept textile waste.",
        icon: "tshirt"
      },
      "reuse clothing": {
        title: "Creative Clothing Reuse Ideas",
        content: "Transform old t-shirts into tote bags, make cushion covers from jeans, create pet beds from sweaters, or design fabric planters. Consider skill-sharing workshops to learn upcycling techniques.",
        icon: "recycle"
      },
      
      // Electronic Waste
      "recycle electronics": {
        title: "E-Waste Recycling Solutions",
        content: "Take electronics to certified e-waste recyclers like Waste Electrical & Electronic Equipment Centre in Nairobi. Remove batteries before recycling. Call WEEE Centre at +254 719 019 901 for collection.",
        icon: "laptop"
      },
      "old phone recycling": {
        title: "Mobile Phone Recycling Options",
        content: "Return old phones to Safaricom stores for their e-waste program, or contact Computer for Schools Kenya (CFSK) who refurbish and donate devices to schools. Remove SIM cards and reset before donating.",
        icon: "mobile"
      },
      
      // Plastics
      "plastic bottle reuse": {
        title: "Creative Plastic Bottle Repurposing",
        content: "Create vertical gardens, make self-watering planters, build bird feeders, or use as storage containers. Cut bottles to make funnels, scoops, or organizers for small items.",
        icon: "wine-bottle"
      },
      "plastic bag recycling": {
        title: "Plastic Bag Management Tips",
        content: "Collect and return clean plastic bags to grocery stores with recycling bins. Reuse as trash bags or for pet waste collection. Consider switching to reusable shopping bags made of cloth or mesh.",
        icon: "shopping-bag"
      },
      
      // Food Waste
      "kitchen waste composting": {
        title: "Kitchen Waste Composting Guide",
        content: "Use a small bin for vegetable scraps, coffee grounds, and eggshells. Avoid meat, dairy, and oils. In urban areas without gardens, try bokashi composting which works in sealed containers for apartments.",
        icon: "seedling"
      },
      "reduce food waste": {
        title: "Food Waste Reduction Strategies",
        content: "Plan meals before shopping, store food properly (fruits separate from vegetables), use leftovers creatively, freeze surplus food, and understand that 'best before' differs from 'use by' dates.",
        icon: "carrot"
      },
      
      // Water Conservation
      "water saving tips": {
        title: "Household Water Conservation",
        content: "Install water-saving showerheads, fix leaking taps (saving up to 20,000L yearly), collect rainwater for gardening, and reuse greywater from laundry for flushing toilets or watering plants.",
        icon: "tint"
      },
      "save water in drought": {
        title: "Drought-Time Water Saving",
        content: "Prioritize essential water use, take shorter showers (5 mins max), use dishwashers only when full, and water gardens early morning or evening. In Kenya, contact Water Resource Authority for local restrictions.",
        icon: "tint-slash"
      },
      
      // Paper
      "paper recycling": {
        title: "Effective Paper Recycling",
        content: "Separate clean paper from contaminated, remove plastic windows from envelopes, flatten cardboard boxes. In Nairobi, contact Mr. Green Africa or Takataka Solutions for collection services.",
        icon: "newspaper"
      },
      "reduce paper usage": {
        title: "Paperless Living Strategies",
        content: "Go digital with bills and statements, use both sides when printing, reuse single-sided paper for notes, and opt out of junk mail through digital subscriptions and e-receipts.",
        icon: "file"
      }
    };
    
    // Check for direct matches first
    if (customTips[normalizedPrompt]) {
      return customTips[normalizedPrompt];
    }
    
    // If no direct match, check for partial matches
    for (const [key, tip] of Object.entries(customTips)) {
      if (normalizedPrompt.includes(key) || key.includes(normalizedPrompt)) {
        return tip;
      }
    }
    
    // For keywords in prompt, try to find relevant tips
    const keywords = normalizedPrompt.split(/\s+/);
    for (const keyword of keywords) {
      if (keyword.length < 4) continue; // Skip short words
      
      for (const [key, tip] of Object.entries(customTips)) {
        if (key.includes(keyword)) {
          return tip;
        }
      }
    }
  }
  
  // If no custom match found or no custom prompt provided, fall back to category-based tips
  const fallbackTips: Record<string, EcoTipResponse> = {
    "water": {
      title: "Save Water With Shower Buckets",
      content: "Place a bucket in your shower to catch excess water while waiting for it to warm up, then use it to water plants.",
      icon: "tint"
    },
    "energy": {
      title: "Unplug To Save Energy",
      content: "Unplug electronics and chargers when not in use. Even when turned off, they consume standby power.",
      icon: "bolt"
    },
    "waste": {
      title: "Zero-Waste Shopping",
      content: "Bring your own containers to bulk stores and farmers markets to reduce packaging waste.",
      icon: "shopping-basket"
    },
    "plastic": {
      title: "Ditch Single-Use Plastics",
      content: "Replace disposable items with reusable alternatives like metal straws, cloth bags, and glass containers.",
      icon: "ban"
    },
    "composting": {
      title: "Start Simple Composting",
      content: "Begin composting with fruit and vegetable scraps, coffee grounds, and eggshells in a small kitchen bin.",
      icon: "seedling"
    },
    "recycling": {
      title: "Proper Recycling Techniques",
      content: "Rinse containers before recycling and learn your local recycling rules to maximize effectiveness.",
      icon: "recycle"
    },
    "transportation": {
      title: "Green Commuting",
      content: "Try biking, walking, or public transportation once a week instead of driving to reduce carbon emissions.",
      icon: "bicycle"
    }
  };
  
  return fallbackTips[category] || {
    title: "Eco-Friendly Daily Habits",
    content: "Incorporate one new sustainable habit each week, like using reusable water bottles or turning off lights when leaving a room.",
    icon: "leaf"
  };
}

export interface EcoBuddyInsight {
  id: string;
  type: 'drop' | 'spike' | 'improvement' | 'missed' | 'neutral';
  emoji: string;
  title: string;
  explanation: string;
  actions: string[];
}

export interface EcoBuddyInsights {
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
  sustainabilityScore: number;
  overallTrend: 'up' | 'down' | 'stable';
}

interface EcoBuddyContext {
  name: string;
  city: string;
  recentCompletedCount: number;
  previousCompletedCount: number;
  cancelledCount: number;
  totalRecentKg: number;
  totalPreviousKg: number;
  typeChanges: Array<{ type: string; recentKg: number; previousKg: number; pct: number }>;
  sustainabilityScore: number;
  cohortSize: number;
  role: string;
  communityAvgKg: number;
  weeklyProgressKg: number;
  // Cumulative all-time impact (from /api/impact data, role-aware)
  totalWaterSaved?: number;
  totalCo2Reduced?: number;
  totalKgAllTime?: number;
}

export async function generateEcoBuddyInsights(ctx: EcoBuddyContext): Promise<EcoBuddyInsights> {
  const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "dummy-key-for-development";

  const changeDesc = ctx.typeChanges.length > 0
    ? ctx.typeChanges.map(c => `${c.type}: ${c.recentKg.toFixed(1)}kg this period vs ${c.previousKg.toFixed(1)}kg previous (${c.pct > 0 ? '+' : ''}${c.pct}%)`).join('; ')
    : 'No recent collections to compare';

  const roleLabel = ctx.role === 'collector' ? 'Waste Collector (accepts and completes pickup jobs)'
    : ctx.role === 'recycler' ? 'Recycler (processes drop-offs from collectors)'
    : ctx.role === 'organization' ? 'Organization / Business'
    : 'Household';

  const allTimeDesc = (ctx.totalKgAllTime ?? 0) > 0
    ? `All-time: ${(ctx.totalKgAllTime ?? 0).toFixed(0)}kg diverted, ${(ctx.totalCo2Reduced ?? 0).toFixed(0)}kg CO₂ saved, ${(ctx.totalWaterSaved ?? 0).toFixed(0)}L water saved`
    : 'No all-time data yet';

  if (hasApiKey) {
    try {
      const prompt = `You are Eco Buddy, a friendly and insightful eco-behavior companion for PipaPal, a Kenyan waste management platform.

Analyze this user's waste recycling behavior and generate personalized insights:

User: ${ctx.name}
City: ${ctx.city}, Kenya
Role: ${roleLabel}
Sustainability Score: ${ctx.sustainabilityScore} points
Recent period (last 2 weeks): ${ctx.recentCompletedCount} completed pickups, ${ctx.totalRecentKg.toFixed(1)}kg total
Previous period (2-4 weeks ago): ${ctx.previousCompletedCount} completed pickups, ${ctx.totalPreviousKg.toFixed(1)}kg total
This week so far: ${ctx.weeklyProgressKg.toFixed(1)}kg
Cancelled this period: ${ctx.cancelledCount}
Waste type changes: ${changeDesc}
${allTimeDesc}
Community average for same-role users in ${ctx.city}: ${ctx.communityAvgKg.toFixed(1)}kg in last 2 weeks
Similar users in ${ctx.city}: ${ctx.cohortSize} people with the same role

Generate a JSON response with this exact structure:
{
  "greeting": "Short personal greeting (1-2 sentences, conversational, mention their name and one specific observation)",
  "behaviorSummary": "One sentence summary of their eco behavior this period",
  "insights": [
    {
      "id": "insight-1",
      "type": "drop|spike|improvement|missed|neutral",
      "emoji": "single emoji",
      "title": "Short title (max 60 chars) — specific, not generic",
      "explanation": "2-3 sentences explaining why this matters with real impact context for Kenya",
      "actions": ["specific action 1 with clear next step", "specific action 2", "specific action 3"]
    }
  ],
  "communityComparison": {
    "userKg": ${ctx.totalRecentKg.toFixed(1)},
    "communityAvgKg": ${ctx.communityAvgKg.toFixed(1)},
    "role": "${ctx.role}",
    "city": "${ctx.city}"
  },
  "weeklyChallenge": {
    "title": "This week's eco challenge title",
    "description": "Specific actionable challenge for this user based on their patterns (1 sentence)",
    "reward": "What they'll gain (e.g., score points, environmental impact)",
    "goalKg": <a realistic kg target for this week based on their role and recent pace>,
    "progressKg": ${ctx.weeklyProgressKg.toFixed(1)},
    "steps": ["Step 1 — concrete action", "Step 2 — concrete action", "Step 3 — concrete action"]
  },
  "sustainabilityLevel": "Level X — [Title]",
  "overallTrend": "up|down|stable"
}

Rules:
- Be specific to Kenya, Nairobi/Kenyan context (mention actual recyclers, organizations if helpful)
- 2-4 insights max, prioritize the most significant behavioral changes
- Each insight MUST include 3 concrete actions — not vague advice, real next steps
- Tailor advice to the user's role: collectors should accept more jobs & expand routes; recyclers should focus on processing volume & waste types; households should schedule pickups more consistently
- sustainabilityLevel: use score ${ctx.sustainabilityScore} — Level 1 (0-49) "Green Beginner", Level 2 (50-149) "Eco Starter", Level 3 (150-299) "Eco Aware", Level 4 (300-499) "Eco Champion", Level 5 (500-749) "Sustainability Hero", Level 6 (750+) "Planet Guardian"
- weeklyChallenge goalKg: set a stretch but achievable target — for households aim 20-30% above their recent weekly avg; for collectors 30-50% above; for recyclers 20-40% above
- If they have no recent activity, reference their all-time stats to show their overall contribution before suggesting next steps
- Tone: encouraging, honest, like a knowledgeable friend not a corporate bot
- Mention real impact numbers when possible (e.g., "3kg of plastic saves 150 liters of water")`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are Eco Buddy, a personalized eco-behavior companion. Respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });

      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content) as EcoBuddyInsights;
      // Always use the fresh DB score — don't rely on AI to echo it back correctly
      parsed.sustainabilityScore = ctx.sustainabilityScore;
      return parsed;
    } catch (error) {
      console.error("Error generating eco buddy insights:", error);
    }
  }

  return getFallbackEcoBuddyInsights(ctx);
}

function getFallbackEcoBuddyInsights(ctx: EcoBuddyContext): EcoBuddyInsights {
  const trend = ctx.totalRecentKg > ctx.totalPreviousKg ? 'up' : ctx.totalRecentKg < ctx.totalPreviousKg ? 'down' : 'stable';
  const dropTypes = ctx.typeChanges.filter(c => c.pct < -10).sort((a, b) => a.pct - b.pct);
  const riseTypes = ctx.typeChanges.filter(c => c.pct > 10).sort((a, b) => b.pct - a.pct);
  const hasCollections = ctx.recentCompletedCount > 0;
  const isCollector = ctx.role === 'collector';
  const isRecycler = ctx.role === 'recycler';
  const allTimeKg = ctx.totalKgAllTime ?? 0;
  const allTimeCo2 = ctx.totalCo2Reduced ?? 0;
  const allTimeWater = ctx.totalWaterSaved ?? 0;

  const insights: EcoBuddyInsight[] = [];

  if (!hasCollections) {
    if (isCollector) {
      insights.push({
        id: 'no-recent-activity',
        type: 'neutral',
        emoji: '🚛',
        title: allTimeKg > 0 ? `No jobs completed this period — but you've moved ${allTimeKg.toFixed(0)}kg all-time!` : "No pickups completed yet this period",
        explanation: allTimeKg > 0
          ? `Your all-time impact of ${allTimeKg.toFixed(0)}kg collected has saved ${allTimeCo2.toFixed(0)}kg of CO₂ and ${allTimeWater.toFixed(0)}L of water. The last 2 weeks show a quiet stretch — check for new jobs near you.`
          : "Accepting and completing pickup jobs is how you build your eco score and earnings. More activity means more impact data to track here.",
        actions: [
          "Check available pickups in your area on the Collections page",
          "Expand your route to nearby neighbourhoods for more job variety",
          "Complete at least 2 jobs this week to maintain your collector rating"
        ]
      });
    } else if (isRecycler) {
      insights.push({
        id: 'no-recent-activity',
        type: 'neutral',
        emoji: '♻️',
        title: allTimeKg > 0 ? `Quiet period — but you've processed ${allTimeKg.toFixed(0)}kg all-time!` : "No drop-offs processed yet this period",
        explanation: allTimeKg > 0
          ? `Your cumulative processing of ${allTimeKg.toFixed(0)}kg has saved ${allTimeCo2.toFixed(0)}kg of CO₂. Keep accepting drop-off deliveries to keep that number climbing.`
          : "Processing drop-offs from collectors is how your impact is tracked. Each kg you process saves roughly 2kg of CO₂ compared to landfill.",
        actions: [
          "Confirm pending drop-off requests to encourage more deliveries",
          "Ensure your accepted waste types are up to date",
          "Share your drop-off code with collectors in your area"
        ]
      });
    } else {
      insights.push({
        id: 'no-activity',
        type: 'neutral',
        emoji: '📦',
        title: "No pickups scheduled yet this period",
        explanation: "Getting started with regular pickups is the most impactful thing you can do. Even one scheduled pickup per week significantly reduces your landfill contribution.",
        actions: [
          "Schedule your first pickup this week — it takes under 2 minutes",
          "Start with plastic or paper — easy to separate and high value",
          "Set a recurring weekly reminder for waste sorting"
        ]
      });
    }
  } else {
    if (dropTypes.length > 0) {
      const drop = dropTypes[0];
      insights.push({
        id: `drop-${drop.type}`,
        type: 'drop',
        emoji: '📉',
        title: `Your ${drop.type} recycling dropped ${Math.abs(drop.pct)}% this period`,
        explanation: `You recycled ${drop.previousKg.toFixed(1)}kg of ${drop.type} last period but only ${drop.recentKg.toFixed(1)}kg recently. In Kenya, ${drop.type} that isn't recycled often ends up in rivers or informal dumps — your consistency makes a real difference.`,
        actions: [
          `Separate your ${drop.type} waste immediately after use — don't mix it`,
          "Schedule a dedicated pickup for this waste type this week",
          `Contact Mr. Green Africa or PipaPal to see if there's increased demand for ${drop.type}`
        ]
      });
    }

    if (riseTypes.length > 0) {
      const rise = riseTypes[0];
      insights.push({
        id: `spike-${rise.type}`,
        type: 'improvement',
        emoji: '🎉',
        title: `Great job — ${rise.type} recycling up ${rise.pct}%!`,
        explanation: `You increased your ${rise.type} recycling from ${rise.previousKg.toFixed(1)}kg to ${rise.recentKg.toFixed(1)}kg. That's ${(rise.recentKg * 2).toFixed(0)}kg of CO₂ emissions avoided. Keep this momentum going!`,
        actions: [
          "Share your approach with neighbors to multiply the impact",
          "Try to maintain or exceed this level next period",
          "Explore if you can add another waste type to your routine"
        ]
      });
    }

    if (ctx.cancelledCount > 0) {
      insights.push({
        id: 'missed-pickups',
        type: 'missed',
        emoji: '⏰',
        title: `${ctx.cancelledCount} pickup${ctx.cancelledCount > 1 ? 's' : ''} cancelled this period`,
        explanation: "Missed pickups mean waste often goes to landfill instead of being recycled. The best way to avoid this is building a consistent routine around your collection days.",
        actions: [
          "Set a phone reminder the day before each scheduled pickup",
          "Keep a small bin for sorted waste near your front door",
          "Reschedule immediately if you need to cancel — don't leave it empty"
        ]
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: 'steady',
      type: 'neutral',
      emoji: '✅',
      title: "Steady pace — looking good this period",
      explanation: "Your recycling activity is consistent. The next step is to increase volume or add new waste types to further boost your eco score.",
      actions: [
        "Try adding one new waste category this month",
        "Invite a neighbor to start recycling with you",
        "Check if you qualify for any PipaPal eco rewards"
      ]
    });
  }

  const greetingActivity = hasCollections
    ? (isCollector ? `You've completed ${ctx.recentCompletedCount} job${ctx.recentCompletedCount !== 1 ? 's' : ''} this period (${ctx.totalRecentKg.toFixed(1)}kg) — here's what your data is telling me.`
      : isRecycler ? `You've processed ${ctx.totalRecentKg.toFixed(1)}kg of materials this period — here's your impact breakdown.`
      : `You've recycled ${ctx.totalRecentKg.toFixed(1)}kg this period — here's what your data is telling me.`)
    : (allTimeKg > 0
      ? `Your all-time contribution of ${allTimeKg.toFixed(0)}kg is making a real difference — let's keep that momentum going.`
      : isCollector ? "Ready for your next pickup job? Let's get you on the road." : isRecycler ? "Let's track your first drop-off and start building your impact." : "Let's get your eco journey started!");

  const challengeTitle = isCollector ? (hasCollections ? "Push for 5 jobs this week" : "First job challenge")
    : isRecycler ? (hasCollections ? "Process a new waste type this week" : "First drop-off challenge")
    : (hasCollections ? "Double your plastic this week" : "First pickup challenge");

  const challengeDesc = isCollector
    ? (hasCollections ? `You completed ${ctx.recentCompletedCount} job${ctx.recentCompletedCount !== 1 ? 's' : ''} recently. Push to 5 this week to boost your earnings and eco score.` : "Accept and complete your first pickup job this week to kickstart your collector journey.")
    : isRecycler
    ? (hasCollections ? `You processed ${ctx.totalRecentKg.toFixed(1)}kg recently. Try processing a waste type you haven't handled before to diversify your impact.` : "Accept your first drop-off delivery this week to start building your processing record.")
    : (hasCollections ? `You recycled ${(ctx.totalRecentKg / 2).toFixed(1)}kg of plastic last period. Try to reach ${ctx.totalRecentKg.toFixed(1)}kg this week by separating more consistently.` : "Schedule and complete your first pickup this week to kickstart your sustainability score.");

  // Sustainability level from score
  const score = ctx.sustainabilityScore;
  const sustainabilityLevel = score >= 750 ? "Level 6 — Planet Guardian"
    : score >= 500 ? "Level 5 — Sustainability Hero"
    : score >= 300 ? "Level 4 — Eco Champion"
    : score >= 150 ? "Level 3 — Eco Aware"
    : score >= 50 ? "Level 2 — Eco Starter"
    : "Level 1 — Green Beginner";

  // Weekly challenge goal — stretch target based on role and recent pace
  const weeklyAvgKg = ctx.totalRecentKg / 2; // 2-week period → weekly avg
  const goalKg = isCollector
    ? Math.max(10, Math.round(weeklyAvgKg * 1.4))
    : isRecycler
    ? Math.max(50, Math.round(weeklyAvgKg * 1.3))
    : Math.max(5, Math.round(weeklyAvgKg * 1.25));

  const challengeSteps = isCollector
    ? ["Accept 1 new pickup job today from the Collections page", "Complete 2 jobs before midweek to stay on pace", `Reach ${goalKg}kg total by Sunday to earn the weekly badge`]
    : isRecycler
    ? ["Review and confirm any pending drop-off requests today", "Update your accepted waste types to attract more deliveries", `Process ${goalKg}kg this week — you're at ${ctx.weeklyProgressKg.toFixed(1)}kg so far`]
    : hasCollections
    ? ["Sort your kitchen waste into separate bags today", "Schedule a pickup for later this week on the app", `Hit ${goalKg}kg this week — you've already collected ${ctx.weeklyProgressKg.toFixed(1)}kg`]
    : ["Open the app and schedule your first pickup — takes 2 minutes", "Start with plastic or paper — easiest to separate", "Leave sorted bags by the door the night before your pickup"];

  return {
    greeting: `Hey ${ctx.name}! ${greetingActivity}`,
    behaviorSummary: trend === 'up'
      ? `Your ${isCollector ? 'collection' : 'recycling'} volume is up ${((ctx.totalRecentKg - ctx.totalPreviousKg) / Math.max(ctx.totalPreviousKg, 1) * 100).toFixed(0)}% vs last period — great momentum.`
      : trend === 'down'
      ? `Your ${isCollector ? 'collection' : 'recycling'} volume dipped this period — here's a clear plan to bounce back.`
      : `Your ${isCollector ? 'collection' : 'recycling'} activity is holding steady — let's push it further.`,
    insights,
    communityComparison: {
      userKg: ctx.totalRecentKg,
      communityAvgKg: ctx.communityAvgKg,
      role: ctx.role,
      city: ctx.city,
    },
    weeklyChallenge: {
      title: challengeTitle,
      description: challengeDesc,
      reward: hasCollections ? "+50 eco points and a badge upgrade" : "+100 eco points for your first action",
      goalKg,
      progressKg: ctx.weeklyProgressKg,
      steps: challengeSteps,
    },
    sustainabilityLevel,
    sustainabilityScore: ctx.sustainabilityScore,
    overallTrend: trend,
  };
}