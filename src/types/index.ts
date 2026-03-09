/**
 * All TypeScript types and interfaces for the application
 */

// Auth
export interface User {
  id: string;
  email: string;
  role: 'guest' | 'advisor' | 'admin';
  createdAt: Date;
}

export type SubscriptionLevel = 'free' | 'premium' | 'diamond';

// Profile (marketplace listing)
export interface ProfilePhoto {
  id: string;
  url: string;
  isMain: boolean;
}

export interface ProfileRate {
  duration: number; // minutes
  price: number;
  label: string;
}

export interface Profile {
  id: string;
  slug: string;
  name: string;
  age: number;
  city: string;
  district?: string;
  nationality: string;
  languages: string[];
  phone: string;
  description: string;
  photos: ProfilePhoto[];
  services: string[];
  attributes: {
    height: number;
    weight: number;
    hair: string;
    eyes: string;
    measurements?: string;
    ethnicity: string;
  };
  rates: ProfileRate[];
  availability: 'available' | 'busy' | 'offline';
  isVerified: boolean;
  isOnline: boolean;
  subscriptionLevel: SubscriptionLevel;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  icon: string;
  count: number;
}

export interface City {
  id: string;
  name: string;
  count: number;
  region: string;
}

// Legacy advisor types kept for API compatibility
export interface Advisor {
  id: string;
  userId: string;
  name: string;
  headline: string;
  description?: string;
  avatar?: string;
  phone?: string;
  subscriptionLevel: SubscriptionLevel;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  advisorId: string;
  level: 'premium' | 'diamond';
  status: 'active' | 'canceled' | 'expired';
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Search & Filter
export interface SearchFilters {
  query?: string;
  category?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  minPrice?: number;
  maxPrice?: number;
  subscriptionLevel?: SubscriptionLevel;
  verified?: boolean;
  isOnline?: boolean;
  services?: string[];
  sortBy?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
}
