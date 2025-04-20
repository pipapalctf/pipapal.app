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
      prompt = `Generate a detailed, specific eco-friendly tip addressing this EXACT query: "${customPrompt}".
      
      The user is specifically asking about this topic and expects precise, actionable advice for THIS EXACT TOPIC. Do not generate generic advice about ${category}. Stay completely focused on answering the user's specific question about "${customPrompt}".
      
      For example:
      - If they ask about "recycling old tires", provide specific ways to recycle or repurpose old tires
      - If they ask about "composting coffee grounds", provide detailed steps for that specific material
      - If they ask about "reducing plastic in the bathroom", focus only on bathroom-specific tips
      
      Your response must directly address their query in detail with practical, actionable steps.`;
    } else {
      prompt = `Generate a practical eco-friendly tip related to "${category}". The tip should be actionable advice for sustainable living that users of the PipaPal waste management app can immediately implement.`;
    }
    
    prompt += `
    
    Format the response as JSON with these fields:
    - title: A short, descriptive title that clearly indicates what the tip is about (maximum 50 characters). The title MUST reflect the content - if it's about recycling tires, the title should mention tires.
    - content: The detailed tip with practical advice (maximum 250 characters). Include specific steps, measurable impacts, and concrete how-to information. Be thorough and precise.
    - icon: A single Font Awesome icon name that represents this tip (e.g., 'recycle', 'leaf', 'tint', 'trash', 'seedling', etc.)
    
    The tip should be factual, environmentally sound, and focused on reducing waste or improving recycling habits. Make it engaging and motivational for users.`;

    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an environmental sustainability expert providing practical, specific eco-friendly tips. Always address the user's exact query with specific, actionable advice that directly responds to their question. Your answers should be practical, detailed, and focused precisely on what the user is asking about. Never provide generic advice when a specific question is asked."
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
