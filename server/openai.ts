import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type EcoTipResponse = {
  title: string;
  content: string;
  icon: string;
}

export type UserBehaviorContext = {
  role: string;
  totalWasteKg: number;
  topWasteTypes: { name: string; value: number }[];
  co2Reduced: number;
  waterSaved: number;
  totalCollections: number;
  completedCollections: number;
  recyclingRate: number;
  badges: string[];
  recentActivity: string;
};

export type PersonalizedTipSet = {
  tips: Array<EcoTipResponse & { reason: string; priority: 'high' | 'medium' | 'low' }>;
};

export async function generatePersonalizedTips(context: UserBehaviorContext): Promise<PersonalizedTipSet> {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy-key-for-development") {
      return getPersonalizedFallbackTips(context);
    }

    const prompt = `You are an eco-advisor for PipaPal, a waste management app in Kenya. Generate 4 personalized eco-tips based on this user's actual behavior data:

USER PROFILE:
- Role: ${context.role}
- Total waste managed: ${context.totalWasteKg} kg
- Top waste types: ${context.topWasteTypes.map(t => `${t.name}: ${t.value} kg`).join(', ') || 'None yet'}
- CO₂ reduced: ${context.co2Reduced} kg
- Water saved: ${context.waterSaved} L
- Collections: ${context.completedCollections}/${context.totalCollections} completed
- Recycling rate: ${context.recyclingRate}%
- Badges earned: ${context.badges.join(', ') || 'None yet'}

RULES:
1. Tips must be SPECIFIC to the user's waste types and behavior patterns
2. If they handle lots of plastic, give plastic-specific tips. If organic, composting tips. Etc.
3. If their recycling rate is low, suggest improvement. If high, suggest advanced techniques.
4. If they're new (few collections), give beginner-friendly tips. If experienced, give advanced tips.
5. Make tips relevant to Kenya - mention local resources, organizations, or practices where appropriate.
6. Each tip should have a clear "reason" explaining why it's relevant to THIS user.
7. Assign priority: "high" for tips addressing weaknesses, "medium" for improvements, "low" for advanced.

Format as JSON: { "tips": [{ "title": "...", "content": "...", "icon": "...", "reason": "...", "priority": "high|medium|low" }] }
Content should be 100-200 words with actionable steps.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a sustainability expert for PipaPal, a Kenyan waste management platform. Provide highly personalized, actionable eco-tips based on user behavior data. Focus on practical advice relevant to Kenya." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as PersonalizedTipSet;
    return result;
  } catch (error) {
    console.error("Error generating personalized tips:", error);
    return getPersonalizedFallbackTips(context);
  }
}

function getPersonalizedFallbackTips(context: UserBehaviorContext): PersonalizedTipSet {
  const tips: PersonalizedTipSet['tips'] = [];
  const topType = context.topWasteTypes[0]?.name?.toLowerCase() || '';
  const secondType = context.topWasteTypes[1]?.name?.toLowerCase() || '';
  const isNew = context.totalCollections < 5;
  const lowRecycling = context.recyclingRate < 50;

  const wasteTips: Record<string, EcoTipResponse & { reason: string; priority: 'high' | 'medium' | 'low' }> = {
    plastic: {
      title: "Reduce Your Plastic Footprint",
      content: "Since plastic is your top waste type, consider these steps: Switch to reusable shopping bags (kiondos are great locally-made alternatives). Buy in bulk to reduce packaging. Separate clean plastics for recycling — PET bottles and HDPE containers have the highest value. Contact Mr. Green Africa or Takataka Solutions in Nairobi for plastic collection services.",
      icon: "recycle",
      reason: `Plastic makes up ${context.topWasteTypes[0]?.value || 0} kg of your waste`,
      priority: "high"
    },
    organic: {
      title: "Start Composting Your Organic Waste",
      content: "You generate significant organic waste — perfect for composting! Start with a simple pit compost in your yard or use a bokashi bin for apartments. Mix kitchen scraps (fruit peels, vegetable waste, coffee grounds) with dry materials like dried leaves or newspaper in a 1:3 ratio. In 2-3 months you'll have nutrient-rich soil for gardens. Organizations like Sustainable Waste Management offer composting workshops in Nairobi.",
      icon: "seedling",
      reason: `Organic waste is a major part of your ${context.totalWasteKg} kg total`,
      priority: "high"
    },
    paper: {
      title: "Maximize Your Paper Recycling",
      content: "Paper is a big part of your waste stream. Separate clean paper from contaminated — clean paper fetches better prices at recycling centers. Remove plastic windows from envelopes and staples from documents. Flatten cardboard boxes to save space. Consider going digital for bills and statements. In Nairobi, contact Chandaria Industries or Kenpoly for paper recycling.",
      icon: "newspaper",
      reason: `You dispose of ${context.topWasteTypes.find(t => t.name.toLowerCase() === 'paper')?.value || 0} kg of paper`,
      priority: "high"
    },
    metal: {
      title: "Metal Recycling for Maximum Value",
      content: "Metal is highly valuable for recycling and your waste shows significant metal content. Separate ferrous (magnetic) from non-ferrous metals — aluminium cans and copper have the highest value. Rinse food cans before recycling. Collect aluminium cans separately as they can be sold to local scrap dealers. Steel recycling saves 60% of the energy compared to making new steel.",
      icon: "cog",
      reason: `Metal waste at ${context.topWasteTypes.find(t => t.name.toLowerCase() === 'metal')?.value || 0} kg has high recycling value`,
      priority: "high"
    },
    glass: {
      title: "Glass Recycling & Reuse Tips",
      content: "Glass can be recycled infinitely without losing quality! Clean glass bottles and jars thoroughly before recycling. Consider reusing glass containers for food storage, spice jars, or drinking glasses. Some local breweries and beverage companies accept returned bottles. Glass crushed into sand can be used in construction — contact local recyclers for collection.",
      icon: "wine-glass",
      reason: `Glass makes up a notable portion of your waste`,
      priority: "medium"
    },
    electronic: {
      title: "Safe E-Waste Disposal in Kenya",
      content: "Electronic waste contains both valuable and hazardous materials. Never throw e-waste in regular trash. Take old devices to WEEE Centre in Nairobi (+254 719 019 901) or Safaricom stores for their e-waste program. Remove batteries separately — they need special handling. Data-wipe phones and computers before disposal. Consider donating working devices to Computer for Schools Kenya.",
      icon: "laptop",
      reason: `E-waste requires special handling for safety and resource recovery`,
      priority: "high"
    },
    hazardous: {
      title: "Handling Hazardous Waste Safely",
      content: "You handle hazardous waste — safety is critical. Never mix hazardous waste with regular waste. Store chemicals in original containers with labels. Contact NEMA (National Environment Management Authority) for certified hazardous waste disposal facilities near you. Common household hazardous items include batteries, paint, cleaning chemicals, and pesticides. Always wear gloves when handling.",
      icon: "exclamation-triangle",
      reason: `Hazardous waste at ${context.topWasteTypes.find(t => t.name.toLowerCase() === 'hazardous')?.value || 0} kg needs careful handling`,
      priority: "high"
    },
  };

  if (topType && wasteTips[topType]) {
    tips.push(wasteTips[topType]);
  }

  if (secondType && wasteTips[secondType] && tips.length < 4) {
    const secondTip = { ...wasteTips[secondType], priority: 'medium' as const };
    tips.push(secondTip);
  }

  if (isNew) {
    tips.push({
      title: "Getting Started with Waste Sorting",
      content: "Welcome to your sustainability journey! Start by setting up separate bins at home for: recyclables (plastic, paper, metal, glass), organic waste (food scraps, garden waste), and general waste. Label each bin clearly. Even simple sorting makes a huge difference — it helps recyclers process materials more efficiently and increases the value of recyclable waste.",
      icon: "leaf",
      reason: "You're just getting started — building good habits early makes a big difference",
      priority: "high"
    });
  } else if (lowRecycling) {
    tips.push({
      title: "Boost Your Recycling Rate",
      content: `Your current recycling rate is ${context.recyclingRate}% — there's room to improve! Try sorting waste at the point of generation (keep a small recycling bin in each room). Learn what's recyclable locally — most plastics (except black), paper, cardboard, glass, and metals can be recycled in Kenya. Set a goal to reach ${Math.min(context.recyclingRate + 20, 100)}% this month.`,
      icon: "chart-line",
      reason: `Your ${context.recyclingRate}% recycling rate can be improved`,
      priority: "high"
    });
  } else {
    tips.push({
      title: "Advanced Waste Reduction Strategies",
      content: `With a ${context.recyclingRate}% recycling rate, you're already doing great! Take it further: practice the 5 R's in order — Refuse unnecessary items, Reduce what you use, Reuse what you can, Repurpose creatively, and Recycle the rest. Consider a zero-waste challenge for one week. Track your waste reduction progress and inspire others in your community.`,
      icon: "star",
      reason: `Your ${context.recyclingRate}% recycling rate is excellent — time for advanced strategies`,
      priority: "low"
    });
  }

  const roleTips: Record<string, EcoTipResponse & { reason: string; priority: 'high' | 'medium' | 'low' }> = {
    collector: {
      title: "Efficient Collection Routes Save Fuel",
      content: "As a collector, route optimization directly impacts your carbon footprint. Plan collections geographically — cluster nearby pickups together. Use the Route Optimization tool in PipaPal to minimize driving distance. Consider using fuel-efficient vehicles or even cargo bikes for short-distance urban collections. Every kilometre saved reduces emissions and your fuel costs.",
      icon: "truck",
      reason: "Route efficiency reduces both costs and environmental impact",
      priority: "medium"
    },
    recycler: {
      title: "Optimizing Your Recycling Operations",
      content: "As a recycler, your capacity management directly impacts the recycling chain. Set clear acceptance limits for each waste type to maintain quality. Consider partnerships with other recyclers to handle overflow or waste types you don't specialize in. Track contamination rates — educating collectors on proper sorting reduces your processing costs significantly.",
      icon: "industry",
      reason: "Better operations management improves recycling efficiency",
      priority: "medium"
    },
    household: {
      title: "Make Your Home a Zero-Waste Zone",
      content: "Small changes at home add up to big impact! Start a kitchen compost for organic waste. Use reusable containers for lunch and shopping. Buy products with minimal packaging — local markets often have unpackaged produce. Repair items instead of replacing them. Set up a swap system with neighbours for items you no longer need.",
      icon: "home",
      reason: "Home is where the biggest daily waste reduction happens",
      priority: "medium"
    },
    organization: {
      title: "Green Your Workplace Operations",
      content: "Organizations can lead by example! Implement a green procurement policy — prioritize suppliers with sustainable packaging. Set up clearly labelled recycling stations in common areas. Go paperless where possible. Consider a waste audit to identify your biggest waste streams. Engage employees with sustainability challenges and track monthly waste reduction metrics.",
      icon: "building",
      reason: "Organizational policies multiply individual impact",
      priority: "medium"
    },
  };

  if (roleTips[context.role] && tips.length < 4) {
    tips.push(roleTips[context.role]);
  }

  if (context.co2Reduced > 100 && tips.length < 4) {
    tips.push({
      title: "Your Carbon Impact is Growing",
      content: `You've helped reduce ${context.co2Reduced.toFixed(0)} kg of CO₂ — equivalent to ${(context.co2Reduced / 21.77).toFixed(0)} trees absorbing carbon for a year! Keep the momentum going by encouraging friends and family to sort their waste. Share your PipaPal impact stats on social media to inspire others. Community engagement multiplies environmental impact exponentially.`,
      icon: "globe",
      reason: `${context.co2Reduced.toFixed(0)} kg CO₂ reduced is worth celebrating and sharing`,
      priority: "low"
    });
  }

  while (tips.length < 3) {
    tips.push({
      title: "Water Conservation at Home",
      content: "Simple water-saving habits make a real difference in Kenya where water is precious. Fix dripping taps immediately — one drip per second wastes 20,000 litres per year! Install a low-flow showerhead. Collect rainwater during rainy seasons for gardening and cleaning. Reuse laundry water for mopping floors or watering plants.",
      icon: "tint",
      reason: "Water conservation is essential in Kenya",
      priority: "medium"
    });
  }

  return { tips: tips.slice(0, 4) };
}

export async function generateEcoTip(category: string, customPrompt?: string): Promise<EcoTipResponse> {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy-key-for-development") {
      return getFallbackEcoTip(category, customPrompt);
    }
    
    let prompt = "";
    
    if (customPrompt) {
      prompt = `IMPORTANT: You MUST generate a HIGHLY SPECIFIC eco-friendly tip that DIRECTLY addresses this EXACT user query: "${customPrompt}".
      
      RULES:
      1. Your response MUST mention "${customPrompt}" by name in both the title and content
      2. AVOID generic advice about ${category} - focus ONLY on "${customPrompt}"
      3. Your response MUST include SPECIFIC methods, steps, or techniques for "${customPrompt}"
      4. Do NOT generalize - stay COMPLETELY focused on "${customPrompt}" 
      5. Include ACTUAL techniques, locations, or resources for "${customPrompt}" whenever possible
      6. Make tips relevant to Kenya where appropriate
      
      The user will ONLY be satisfied if you provide SPECIFIC, ACTIONABLE information about "${customPrompt}" - not general environmental advice.`;
    } else {
      prompt = `Generate a practical eco-friendly tip related to "${category}". The tip should be actionable advice for sustainable living that users of the PipaPal waste management app in Kenya can immediately implement.`;
    }
    
    prompt += `
    
    Format the response as JSON with these fields:
    - title: A short, specific title (maximum 50 characters)
    - content: Detailed, specific advice with practical steps (100-200 words). Include HOW to accomplish the task, WHERE to take items if relevant, and WHAT resources are needed. Be specific to Kenya where relevant.
    - icon: A single icon name (e.g., 'recycle', 'leaf', 'tint', 'trash', 'seedling', etc.)
    
    The tip should be factual, environmentally sound, and focused on reducing waste or improving recycling habits.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an environmental sustainability expert for PipaPal, a Kenyan waste management platform. Provide specific eco-friendly tips. Focus on the exact query provided. Include Kenya-specific resources when relevant." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as EcoTipResponse;
    return result;
  } catch (error) {
    console.error("Error generating EcoTip:", error);
    const result = getFallbackEcoTip(category, customPrompt);
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