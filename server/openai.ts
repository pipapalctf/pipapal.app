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