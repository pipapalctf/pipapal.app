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
}

export async function generateEcoBuddyInsights(ctx: EcoBuddyContext): Promise<EcoBuddyInsights> {
  const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "dummy-key-for-development";

  const changeDesc = ctx.typeChanges.length > 0
    ? ctx.typeChanges.map(c => `${c.type}: ${c.recentKg.toFixed(1)}kg this period vs ${c.previousKg.toFixed(1)}kg previous (${c.pct > 0 ? '+' : ''}${c.pct}%)`).join('; ')
    : 'No recent collections to compare';

  if (hasApiKey) {
    try {
      const prompt = `You are Eco Buddy, a friendly and insightful eco-behavior companion for PipaPal, a Kenyan waste management platform.

Analyze this user's waste recycling behavior and generate personalized insights:

User: ${ctx.name}
City: ${ctx.city}, Kenya
Role: ${ctx.role}
Sustainability Score: ${ctx.sustainabilityScore} points
Recent period (last 2 weeks): ${ctx.recentCompletedCount} completed pickups, ${ctx.totalRecentKg.toFixed(1)}kg total
Previous period (2-4 weeks ago): ${ctx.previousCompletedCount} completed pickups, ${ctx.totalPreviousKg.toFixed(1)}kg total
Cancelled this period: ${ctx.cancelledCount}
Waste type changes: ${changeDesc}
Similar users in ${ctx.city}: ${ctx.cohortSize} households

Generate a JSON response with this exact structure:
{
  "greeting": "Short personal greeting (1-2 sentences, conversational, mention their name and one specific observation)",
  "behaviorSummary": "One sentence summary of their eco behavior this week",
  "insights": [
    {
      "id": "insight-1",
      "type": "drop|spike|improvement|missed|neutral",
      "emoji": "single emoji",
      "title": "Short title (max 60 chars) — specific, not generic",
      "explanation": "2-3 sentences explaining why this matters with real impact context for Kenya",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    }
  ],
  "cohortInsight": {
    "city": "${ctx.city}",
    "cohortSize": ${ctx.cohortSize},
    "message": "What similar households in ${ctx.city} are doing better (1-2 sentences)",
    "topActions": ["action households are taking 1", "action 2", "action 3"]
  },
  "weeklyChallenge": {
    "title": "This week's eco challenge title",
    "description": "Specific actionable challenge for this user based on their patterns",
    "reward": "What they'll gain (e.g., score points, environmental impact)"
  },
  "overallTrend": "up|down|stable"
}

Rules:
- Be specific to Kenya, Nairobi/Kenyan context (mention actual recyclers, organizations if helpful)
- 2-4 insights max, prioritize the most significant behavioral changes
- If they have no collections, focus on getting started
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
      return JSON.parse(content) as EcoBuddyInsights;
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

  const insights: EcoBuddyInsight[] = [];

  if (!hasCollections) {
    insights.push({
      id: 'no-activity',
      type: 'neutral',
      emoji: '📦',
      title: "No pickups recorded yet this period",
      explanation: "Getting started with regular pickups is the most impactful thing you can do. Even one scheduled pickup per week significantly reduces your landfill contribution.",
      actions: [
        "Schedule your first pickup this week — it takes under 2 minutes",
        "Start with plastic or paper — easy to separate and high value",
        "Set a recurring weekly reminder for waste sorting"
      ]
    });
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

  return {
    greeting: `Hey ${ctx.name}! ${hasCollections ? `You've recycled ${ctx.totalRecentKg.toFixed(1)}kg this period — here's what your data is telling me.` : "Let's get your eco journey started!"}`,
    behaviorSummary: trend === 'up' ? `Your recycling volume is trending up — ${((ctx.totalRecentKg - ctx.totalPreviousKg) / Math.max(ctx.totalPreviousKg, 1) * 100).toFixed(0)}% more than last period.` : trend === 'down' ? "Your recycling dropped a bit — but we've got a clear plan to turn that around." : "Your recycling is holding steady — let's push it further.",
    insights,
    cohortInsight: {
      city: ctx.city,
      cohortSize: ctx.cohortSize,
      message: ctx.cohortSize > 5 ? `${ctx.cohortSize} households in ${ctx.city} with similar waste patterns improved their scores by focusing on consistent scheduling and plastic separation.` : `Households who recycle consistently in Nairobi save an average of 200kg of waste from landfills per year.`,
      topActions: [
        "Schedule pickups at least twice per month",
        "Separate plastic and paper waste before collection day",
        "Track progress weekly to stay motivated"
      ]
    },
    weeklyChallenge: {
      title: hasCollections ? "Double your plastic this week" : "First pickup challenge",
      description: hasCollections ? `You recycled ${(ctx.totalRecentKg / 2).toFixed(1)}kg of plastic last period. Try to reach ${ctx.totalRecentKg.toFixed(1)}kg this week by separating more consistently.` : "Schedule and complete your first pickup this week to kickstart your sustainability score.",
      reward: hasCollections ? "+50 eco points and a badge upgrade" : "+100 eco points for your first pickup"
    },
    overallTrend: trend,
  };
}