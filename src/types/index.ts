/**
 * All TypeScript types and interfaces for the application
 */

// Auth
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Advisor
export interface Advisor {
  id: string;
  userId: string;
  name: string;
  headline: string;
  description?: string;
  avatar?: string;
  phone?: string;
  subscriptionLevel: 'free' | 'premium' | 'diamond';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service
export interface Service {
  id: string;
  advisorId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

// Subscription
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
  minPrice?: number;
  maxPrice?: number;
  subscriptionLevel?: 'premium' | 'diamond';
  verified?: boolean;
  sortBy?: 'relevance' | 'price' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  advisors: Advisor[];
  total: number;
  page: number;
  limit: number;
}
