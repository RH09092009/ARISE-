import { GoogleGenAI } from "@google/genai";
import { 
  MODEL_FLASH, 
  MODEL_FLASH_LITE, 
  MODEL_PRO_THINKING, 
  MODEL_PRO_IMAGE, 
  MODEL_FLASH_IMAGE
} from "../constants";
import { ImageGenerationConfig } from "../types";

// Define a local interface for AIStudio to avoid global namespace pollution/conflicts
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

const getApiKey = () => {
  // Safe access to process.env.API_KEY
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return ''; // Return empty string if not found, will likely cause API error but prevents crash
};

const getAI = async (requirePaid: boolean = false) => {
  // Access window.aistudio safely
  const aiStudio = (window as any).aistudio as AIStudio | undefined;
  const apiKey = getApiKey();

  if (requirePaid && aiStudio) {
    const hasKey = await aiStudio.hasSelectedApiKey();
    if (!hasKey) {
      await aiStudio.openSelectKey();
    }
    // In paid flow, we re-instantiate to ensure key is picked up internally or injected
    return new GoogleGenAI({ apiKey: apiKey }); 
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
  enableMaps: boolean = false,
  thinkingMode: boolean = false
) => {
  const ai = await getAI(thinkingMode); 
  
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

  if (thinkingMode) {
    config.thinkingConfig = { thinkingBudget: 32768 };
    // Do not set maxOutputTokens when thinking is enabled
  }

  const chat = ai.chats.create({
    model: modelName,
    config,
    history
  });

  let msgContent: any = message;
  
  // Handle image input (Multi-modal)
  if (imageAttachment) {
    msgContent = [
        { text: message },
        { inlineData: { data: imageAttachment.data, mimeType: imageAttachment.mimeType } }
    ];
  }

  return chat.sendMessageStream({ message: msgContent });
};

export const generateImage = async (config: ImageGenerationConfig) => {
  // Logic: If size is specified, we MUST use Pro.
  // If imageBytes are provided (editing), we default to Flash Image unless Pro features are explicitly requested via size.
  // The prompt asks to use "Gemini 2.5 Flash Image" for editing ("Add a retro filter").
  
  const isPro = !!config.size; 
  const ai = await getAI(isPro);

  const model = isPro ? MODEL_PRO_IMAGE : MODEL_FLASH_IMAGE;

  const parts: any[] = [{ text: config.prompt }];
  
  // If editing (imageBytes provided)
  if (config.imageBytes) {
    parts.push({
        inlineData: {
            data: config.imageBytes,
            mimeType: config.mimeType || 'image/jpeg'
        }
    });
  }

  const generationConfig: any = {
    imageConfig: {
        aspectRatio: config.aspectRatio,
    }
  };

  if (isPro && config.size) {
      generationConfig.imageConfig.imageSize = config.size;
  }

  // For Flash Image / Pro Image Preview we use generateContent
  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: generationConfig
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};