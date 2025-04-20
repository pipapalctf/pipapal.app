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
      return getFallbackEcoTip(category);
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
    return getFallbackEcoTip(category);
  }
}

function getFallbackEcoTip(category: string): EcoTipResponse {
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