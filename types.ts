
export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export enum AppMode {
  Chat = 'chat', // General, fast
  Education = 'education',
  Shopping = 'shopping',
}

export type Language = 'en' | 'bn';

export interface VerifiedLink {
  store: string;
  price: number;
  currency: string;
  url: string;
  rating?: number;
}

export interface NearbyStore {
  name: string;
  distance: string;
  status: string; // "Open Now", "Closed"
  mapLink: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  seller: string;
  rating: number;
  reviews: number;
  image: string;
  link: string;
  description: string;
  category?: string;
  features?: string[];
  
  // New Mega Features
  trustScore?: number; // 0-100
  globalPrice?: { price: number; currency: string };
  scamWarning?: boolean;
  isBestValue?: boolean;
  dealScore?: number; // 0-100 for Bargain Hunter
  pros?: string[];
  cons?: string[];
  verifiedLinks?: VerifiedLink[];
  nearbyStores?: NearbyStore[];
  deliveryEstimate?: string;
}

export interface WishlistItem extends Product {
  addedAt: number;
}

export interface Message {
  id: string;
  sender: Sender;
  text?: string;
  imageUrl?: string; // For user uploads
  videoUrl?: string; // For generated videos
  timestamp: number;
  isTyping?: boolean;
  groundingData?: {
    search?: { title: string; uri: string }[];
    maps?: { title: string; uri: string }[];
  };
  productResults?: Product[]; // For Shopping Mode results
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}