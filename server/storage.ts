import {
  type User, type InsertUser,
  type Article, type InsertArticle,
  type Keyword, type InsertKeyword,
  type Integration, type InsertIntegration,
  type ContentSuggestion, type InsertContentSuggestion,
  type AnalyticsSnapshot, type InsertAnalyticsSnapshot,
  users, articles, keywords, integrations, contentSuggestions, analyticsSnapshots,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, gte } from "drizzle-orm";

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
    // No sample data - everything must come from real API sources
    // Integrations will be created when users attempt to connect them
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

// Database storage implementation - uses PostgreSQL for persistence
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Articles
  async getArticles(): Promise<Article[]> {
    return db.select().from(articles).orderBy(desc(articles.updatedAt));
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values(insertArticle).returning();
    return article;
  }

  async updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article | undefined> {
    const [article] = await db.update(articles)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(articles.id, id))
      .returning();
    return article;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id));
    return true;
  }

  // Keywords
  async getKeywords(): Promise<Keyword[]> {
    return db.select().from(keywords).orderBy(desc(keywords.clicks));
  }

  async getKeyword(id: string): Promise<Keyword | undefined> {
    const [keyword] = await db.select().from(keywords).where(eq(keywords.id, id));
    return keyword;
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const [keyword] = await db.insert(keywords).values(insertKeyword).returning();
    return keyword;
  }

  async updateKeyword(id: string, updates: Partial<InsertKeyword>): Promise<Keyword | undefined> {
    const [keyword] = await db.update(keywords)
      .set({ ...updates, lastUpdated: new Date().toISOString() })
      .where(eq(keywords.id, id))
      .returning();
    return keyword;
  }

  async deleteKeyword(id: string): Promise<boolean> {
    await db.delete(keywords).where(eq(keywords.id, id));
    return true;
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    return db.select().from(integrations);
  }

  async getIntegration(name: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.name, name));
    return integration;
  }

  async upsertIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    // Check if exists
    const existing = await this.getIntegration(insertIntegration.name);
    if (existing) {
      const [updated] = await db.update(integrations)
        .set(insertIntegration)
        .where(eq(integrations.name, insertIntegration.name))
        .returning();
      return updated;
    }
    const [integration] = await db.insert(integrations).values(insertIntegration).returning();
    return integration;
  }

  // Content Suggestions
  async getSuggestionsByArticle(articleId: string): Promise<ContentSuggestion[]> {
    return db.select().from(contentSuggestions).where(eq(contentSuggestions.articleId, articleId));
  }

  async createSuggestion(insertSuggestion: InsertContentSuggestion): Promise<ContentSuggestion> {
    const [suggestion] = await db.insert(contentSuggestions).values(insertSuggestion).returning();
    return suggestion;
  }

  async updateSuggestion(id: string, applied: boolean): Promise<ContentSuggestion | undefined> {
    const [suggestion] = await db.update(contentSuggestions)
      .set({ applied })
      .where(eq(contentSuggestions.id, id))
      .returning();
    return suggestion;
  }

  // Analytics
  async getAnalyticsSnapshots(days: number): Promise<AnalyticsSnapshot[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return db.select().from(analyticsSnapshots)
      .where(gte(analyticsSnapshots.date, cutoffDate))
      .orderBy(analyticsSnapshots.date);
  }

  async createAnalyticsSnapshot(insertSnapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot> {
    const [snapshot] = await db.insert(analyticsSnapshots).values(insertSnapshot).returning();
    return snapshot;
  }
}

// Use database storage for persistence
export const storage = new DatabaseStorage();
