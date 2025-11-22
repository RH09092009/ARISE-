
export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export enum AppMode {
  Chat = 'chat', // General, fast
  Thinking = 'thinking', // Deep reasoning
  Education = 'education',
  Shopping = 'shopping',
  ImageGen = 'image-gen',
}

export interface Message {
  id: string;
  sender: Sender;
  text?: string;
  imageUrl?: string; // For generated images or user uploads
  videoUrl?: string; // For generated videos
  timestamp: number;
  isTyping?: boolean;
  groundingData?: {
    search?: { title: string; uri: string }[];
    maps?: { title: string; uri: string }[];
  };
}

export interface ImageGenerationConfig {
  prompt: string;
  aspectRatio: string;
  size?: "1K" | "2K" | "4K";
  imageBytes?: string; // For editing
  mimeType?: string;
}

export interface VideoGenerationConfig {
  prompt: string;
  aspectRatio: "16:9" | "9:16";
  resolution: "720p" | "1080p";
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}
