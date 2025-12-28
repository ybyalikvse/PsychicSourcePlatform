import {
  type User, type InsertUser,
  type Article, type InsertArticle,
  type Keyword, type InsertKeyword,
  type Integration, type InsertIntegration,
  type ContentSuggestion, type InsertContentSuggestion,
  type AnalyticsSnapshot, type InsertAnalyticsSnapshot,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Articles
  getArticles(): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;

  // Keywords
  getKeywords(): Promise<Keyword[]>;
  getKeyword(id: string): Promise<Keyword | undefined>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  updateKeyword(id: string, keyword: Partial<InsertKeyword>): Promise<Keyword | undefined>;
  deleteKeyword(id: string): Promise<boolean>;

  // Integrations
  getIntegrations(): Promise<Integration[]>;
  getIntegration(name: string): Promise<Integration | undefined>;
  upsertIntegration(integration: InsertIntegration): Promise<Integration>;

  // Content Suggestions
  getSuggestionsByArticle(articleId: string): Promise<ContentSuggestion[]>;
  createSuggestion(suggestion: InsertContentSuggestion): Promise<ContentSuggestion>;
  updateSuggestion(id: string, applied: boolean): Promise<ContentSuggestion | undefined>;

  // Analytics
  getAnalyticsSnapshots(days: number): Promise<AnalyticsSnapshot[]>;
  createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private articles: Map<string, Article>;
  private keywords: Map<string, Keyword>;
  private integrations: Map<string, Integration>;
  private suggestions: Map<string, ContentSuggestion>;
  private analytics: Map<string, AnalyticsSnapshot>;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.keywords = new Map();
    this.integrations = new Map();
    this.suggestions = new Map();
    this.analytics = new Map();
    
    this.seedData();
  }

  private seedData() {
    // Seed sample articles
    const sampleArticles: Article[] = [
      {
        id: randomUUID(),
        title: "How to Get a Psychic Reading: Complete Guide",
        slug: "how-to-get-psychic-reading-guide",
        content: "A comprehensive guide to understanding psychic readings...",
        excerpt: "Learn everything about psychic readings",
        status: "published",
        author: "Content Team",
        category: "Guides",
        tags: ["psychic reading", "beginner guide"],
        targetKeyword: "psychic reading",
        metaTitle: "How to Get a Psychic Reading | Psychic Source",
        metaDescription: "Discover how to get an accurate psychic reading. Learn about different types of readings and find your perfect psychic advisor.",
        wordCount: 2500,
        readabilityScore: 72,
        seoScore: 85,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        title: "Tarot Card Meanings: Major Arcana Explained",
        slug: "tarot-card-meanings-major-arcana",
        content: "Explore the deep meanings of the Major Arcana cards...",
        excerpt: "Understanding the 22 Major Arcana cards",
        status: "published",
        author: "Content Team",
        category: "Tarot",
        tags: ["tarot cards", "major arcana", "tarot meanings"],
        targetKeyword: "tarot card meanings",
        metaTitle: "Tarot Card Meanings: Major Arcana Guide | Psychic Source",
        metaDescription: "Learn the meanings of all 22 Major Arcana tarot cards with our comprehensive guide.",
        wordCount: 3200,
        readabilityScore: 68,
        seoScore: 78,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        title: "Love Compatibility by Zodiac Sign",
        slug: "love-compatibility-zodiac-signs",
        content: "Discover which zodiac signs are most compatible...",
        excerpt: "Find your perfect zodiac match",
        status: "draft",
        author: "Content Team",
        category: "Astrology",
        tags: ["zodiac", "love compatibility", "astrology"],
        targetKeyword: "zodiac compatibility",
        metaTitle: "",
        metaDescription: "",
        wordCount: 1800,
        readabilityScore: 75,
        seoScore: 45,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    sampleArticles.forEach(article => {
      this.articles.set(article.id, article);
    });

    // Seed sample keywords
    const sampleKeywords: Keyword[] = [
      {
        id: randomUUID(),
        keyword: "psychic reading",
        volume: 74000,
        difficulty: 65,
        currentPosition: 8,
        previousPosition: 12,
        url: "https://www.psychicsource.com/article/how-to-get-psychic-reading-guide",
        clicks: 1250,
        impressions: 45000,
        ctr: "2.78%",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        keyword: "tarot card meanings",
        volume: 49500,
        difficulty: 58,
        currentPosition: 5,
        previousPosition: 7,
        url: "https://www.psychicsource.com/article/tarot-card-meanings-major-arcana",
        clicks: 890,
        impressions: 32000,
        ctr: "2.78%",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        keyword: "free psychic reading",
        volume: 110000,
        difficulty: 78,
        currentPosition: 15,
        previousPosition: 18,
        url: "https://www.psychicsource.com/free-reading",
        clicks: 450,
        impressions: 28000,
        ctr: "1.61%",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        keyword: "zodiac compatibility",
        volume: 33100,
        difficulty: 52,
        currentPosition: 22,
        previousPosition: 25,
        url: "https://www.psychicsource.com/horoscopes/compatibility",
        clicks: 320,
        impressions: 18500,
        ctr: "1.73%",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        keyword: "love psychic",
        volume: 22200,
        difficulty: 45,
        currentPosition: 3,
        previousPosition: 4,
        url: "https://www.psychicsource.com/love-psychics",
        clicks: 1800,
        impressions: 25000,
        ctr: "7.20%",
        lastUpdated: new Date().toISOString(),
      },
    ];

    sampleKeywords.forEach(keyword => {
      this.keywords.set(keyword.id, keyword);
    });

    // Seed integrations
    const sampleIntegrations: Integration[] = [
      {
        id: randomUUID(),
        name: "ahrefs",
        status: process.env.AHREFS_API_KEY ? "connected" : "disconnected",
        lastSync: process.env.AHREFS_API_KEY ? new Date().toISOString() : null,
        config: null,
      },
      {
        id: randomUUID(),
        name: "gsc",
        status: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID ? "connected" : "disconnected",
        lastSync: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID ? new Date().toISOString() : null,
        config: null,
      },
      {
        id: randomUUID(),
        name: "ga",
        status: process.env.VITE_GA_MEASUREMENT_ID ? "connected" : "disconnected",
        lastSync: null,
        config: null,
      },
    ];

    sampleIntegrations.forEach(integration => {
      this.integrations.set(integration.name, integration);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Article methods
  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const article: Article = {
      ...insertArticle,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article | undefined> {
    const existing = this.articles.get(id);
    if (!existing) return undefined;
    
    const updated: Article = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.articles.set(id, updated);
    return updated;
  }

  async deleteArticle(id: string): Promise<boolean> {
    return this.articles.delete(id);
  }

  // Keyword methods
  async getKeywords(): Promise<Keyword[]> {
    return Array.from(this.keywords.values()).sort((a, b) => 
      (b.clicks || 0) - (a.clicks || 0)
    );
  }

  async getKeyword(id: string): Promise<Keyword | undefined> {
    return this.keywords.get(id);
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const id = randomUUID();
    const keyword: Keyword = {
      ...insertKeyword,
      id,
      lastUpdated: new Date().toISOString(),
    };
    this.keywords.set(id, keyword);
    return keyword;
  }

  async updateKeyword(id: string, updates: Partial<InsertKeyword>): Promise<Keyword | undefined> {
    const existing = this.keywords.get(id);
    if (!existing) return undefined;
    
    const updated: Keyword = {
      ...existing,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    this.keywords.set(id, updated);
    return updated;
  }

  async deleteKeyword(id: string): Promise<boolean> {
    return this.keywords.delete(id);
  }

  // Integration methods
  async getIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }

  async getIntegration(name: string): Promise<Integration | undefined> {
    return this.integrations.get(name);
  }

  async upsertIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const existing = this.integrations.get(insertIntegration.name);
    const id = existing?.id || randomUUID();
    const integration: Integration = {
      ...insertIntegration,
      id,
    };
    this.integrations.set(insertIntegration.name, integration);
    return integration;
  }

  // Suggestion methods
  async getSuggestionsByArticle(articleId: string): Promise<ContentSuggestion[]> {
    return Array.from(this.suggestions.values()).filter(
      s => s.articleId === articleId
    );
  }

  async createSuggestion(insertSuggestion: InsertContentSuggestion): Promise<ContentSuggestion> {
    const id = randomUUID();
    const suggestion: ContentSuggestion = {
      ...insertSuggestion,
      id,
      createdAt: new Date().toISOString(),
    };
    this.suggestions.set(id, suggestion);
    return suggestion;
  }

  async updateSuggestion(id: string, applied: boolean): Promise<ContentSuggestion | undefined> {
    const existing = this.suggestions.get(id);
    if (!existing) return undefined;
    
    const updated: ContentSuggestion = { ...existing, applied };
    this.suggestions.set(id, updated);
    return updated;
  }

  // Analytics methods
  async getAnalyticsSnapshots(days: number): Promise<AnalyticsSnapshot[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Array.from(this.analytics.values())
      .filter(s => new Date(s.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createAnalyticsSnapshot(insertSnapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot> {
    const id = randomUUID();
    const snapshot: AnalyticsSnapshot = { ...insertSnapshot, id };
    this.analytics.set(id, snapshot);
    return snapshot;
  }
}

export const storage = new MemStorage();
