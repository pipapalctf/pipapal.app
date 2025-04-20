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
      prompt = `Generate a practical, eco-friendly tip about "${customPrompt}" related to the category "${category}". The user wants specific advice on this sustainability topic. The tip should be actionable advice that can be immediately implemented.`;
    } else {
      prompt = `Generate a short, practical eco-friendly tip related to "${category}". The tip should be actionable advice for sustainable living that users of the PipaPal waste management app can immediately implement.`;
    }
    
    prompt += `
    
    Format the response as JSON with these fields:
    - title: A short, catchy title for the tip (maximum 40 characters)
    - content: The detailed tip with practical advice (maximum 200 characters). Include specific steps or measurable impacts when possible.
    - icon: A single Font Awesome icon name that represents this tip (e.g., 'recycle', 'leaf', 'tint', 'trash', 'seedling', etc.)
    
    The tip should be factual, environmentally sound, and focused on reducing waste or improving recycling habits. Make it engaging and motivational for users.`;

    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an environmental sustainability expert providing practical eco-friendly tips."
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
