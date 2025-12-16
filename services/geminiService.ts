
import { GoogleGenAI } from "@google/genai";
import { 
  MODEL_FLASH, 
  MODEL_FLASH_LITE, 
  SHOPPING_PROMPT_CORE
} from "../constants";
import { Product } from "../types";

// Define a local interface for AIStudio to avoid global namespace pollution/conflicts
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

const getAI = async (requirePaid: boolean = false) => {
  // Use type assertion to avoid TypeScript errors with window.aistudio
  const aiStudio = (window as any).aistudio as AIStudio | undefined;

  if (requirePaid && aiStudio) {
    const hasKey = await aiStudio.hasSelectedApiKey();
    if (!hasKey) {
      await aiStudio.openSelectKey();
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY }); 
  }

  // Robust API Key check for production vs development
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      console.warn("API Key not found in process.env. attempting fallback or might fail.");
  }

  return new GoogleGenAI({ apiKey: apiKey });
};

const getUserLocation = async (): Promise<{latitude: number, longitude: number} | undefined> => {
  if (!navigator.geolocation) return undefined;
  try {
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        { timeout: 5000 }
      );
    });
  } catch (error) {
    console.warn("Geolocation failed or denied:", error);
    return undefined;
  }
};

export const generateChatResponseStream = async (
  history: any[],
  message: string,
  modelName: string,
  systemInstruction?: string,
  imageAttachment?: { data: string; mimeType: string },
  enableSearch: boolean = false,
  enableMaps: boolean = false
) => {
  const ai = await getAI(false); 
  
  const tools: any[] = [];
  if (enableSearch) tools.push({ googleSearch: {} });
  if (enableMaps) tools.push({ googleMaps: {} });

  let toolConfig: any = undefined;
  if (enableMaps) {
    const loc = await getUserLocation();
    if (loc) {
      toolConfig = {
        retrievalConfig: {
          latLng: loc
        }
      };
    }
  }

  const config: any = {
    systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    toolConfig: toolConfig,
  };

  const chat = ai.chats.create({
    model: modelName,
    config,
    history
  });

  let msgContent: any = message;
  
  if (imageAttachment) {
    msgContent = [
        { text: message },
        { inlineData: { data: imageAttachment.data, mimeType: imageAttachment.mimeType } }
    ];
  }

  return chat.sendMessageStream({ message: msgContent });
};

// Supercharged Shopping Search
export const searchProducts = async (query: string, imageBase64?: string, language: 'en' | 'bn' = 'en'): Promise<Product[]> => {
  const ai = await getAI(false);
  const loc = await getUserLocation();

  // Combine the strict JSON requirement with the powerful shopping persona
  const prompt = `
    ${SHOPPING_PROMPT_CORE}

    User Request: "${query}"
    Language Preference: ${language === 'bn' ? 'Bangla' : 'English'}
    User Location detected: ${loc ? 'Yes' : 'No'}

    Task:
    1. Analyze the request (and image if provided).
    2. Search Google for products.
    3. EXTRACT REAL IMAGE URLs from the search results. Look for high-quality product images from major retailers (Amazon, official brand sites, etc.). The 'image' field MUST be a valid, direct URL.
    4. Return a STRICT JSON array of 15-20 products.
    
    JSON Format Per Object:
    - id: unique string
    - title: product name
    - price: number
    - currency: symbol
    - seller: store name
    - rating: number (1-5)
    - reviews: count
    - image: <REAL_VALID_URL_FROM_SEARCH_RESULTS>
    - link: direct product link
    - description: short description
    - isBestValue: boolean (true if it's the best deal)
    - trustScore: number (0-100)
    - scamWarning: boolean (true if potentially unsafe)
    - globalPrice: { price: number, currency: string } (Optional)
    - pros: string[] (3-5 pros)
    - cons: string[] (1-2 cons)
    - verifiedLinks: [{ store: "Amazon", price: 100, currency: "$", url: "..." }]
    - nearbyStores: [{ name: "Store Name", distance: "2km", status: "Open", mapLink: "..." }]

    IMPORTANT: Return ONLY the raw JSON array. No markdown.
  `;

  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    parts.push({ inlineData: { data: imageBase64, mimeType: 'image/jpeg' } });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: loc ? { retrievalConfig: { latLng: loc } } : undefined
      }
    });

    const text = response.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : "[]";
    
    const products = JSON.parse(cleanJson);
    if (Array.isArray(products)) {
      return products as Product[];
    }
    return [];
  } catch (error) {
    console.error("Shopping Search Error:", error);
    return [];
  }
};