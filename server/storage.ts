import {
  type User, type InsertUser,
  type Article, type InsertArticle,
  type Keyword, type InsertKeyword,
  type Integration, type InsertIntegration,
  type ContentSuggestion, type InsertContentSuggestion,
  type AnalyticsSnapshot, type InsertAnalyticsSnapshot,
  type WritingStyle, type InsertWritingStyle,
  type OptimizationPrompt, type InsertOptimizationPrompt,
  type SeoSettings, type InsertSeoSettings,
  type ImageStyle, type InsertImageStyle,
  type TargetAudience, type InsertTargetAudience,
  type LinkTableColumn, type InsertLinkTableColumn,
  type SiteUrl, type InsertSiteUrl,
  type OptimizationAnalysis, type InsertOptimizationAnalysis,
  users, articles, keywords, integrations, contentSuggestions, analyticsSnapshots,
  writingStyles, optimizationPrompts, seoSettings, imageStyles, targetAudiences, linkTableColumns, siteUrls, optimizationAnalyses,
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

  // Writing Styles
  getWritingStyles(): Promise<WritingStyle[]>;
  getWritingStyle(id: string): Promise<WritingStyle | undefined>;
  createWritingStyle(style: InsertWritingStyle): Promise<WritingStyle>;
  updateWritingStyle(id: string, style: Partial<InsertWritingStyle>): Promise<WritingStyle | undefined>;
  deleteWritingStyle(id: string): Promise<boolean>;

  // Optimization Prompts
  getOptimizationPrompts(): Promise<OptimizationPrompt[]>;
  getOptimizationPrompt(id: string): Promise<OptimizationPrompt | undefined>;
  createOptimizationPrompt(prompt: InsertOptimizationPrompt): Promise<OptimizationPrompt>;
  updateOptimizationPrompt(id: string, prompt: Partial<InsertOptimizationPrompt>): Promise<OptimizationPrompt | undefined>;
  deleteOptimizationPrompt(id: string): Promise<boolean>;

  // SEO Settings
  getSeoSettings(): Promise<SeoSettings | undefined>;
  upsertSeoSettings(settings: InsertSeoSettings): Promise<SeoSettings>;

  // Image Styles
  getImageStyles(): Promise<ImageStyle[]>;
  getImageStyle(id: string): Promise<ImageStyle | undefined>;
  createImageStyle(style: InsertImageStyle): Promise<ImageStyle>;
  updateImageStyle(id: string, style: Partial<InsertImageStyle>): Promise<ImageStyle | undefined>;
  deleteImageStyle(id: string): Promise<boolean>;

  // Target Audiences
  getTargetAudiences(): Promise<TargetAudience[]>;
  getTargetAudience(id: string): Promise<TargetAudience | undefined>;
  createTargetAudience(audience: InsertTargetAudience): Promise<TargetAudience>;
  updateTargetAudience(id: string, audience: Partial<InsertTargetAudience>): Promise<TargetAudience | undefined>;
  deleteTargetAudience(id: string): Promise<boolean>;

  // Link Table Columns (dynamic columns)
  getLinkTableColumns(): Promise<LinkTableColumn[]>;
  createLinkTableColumn(column: InsertLinkTableColumn): Promise<LinkTableColumn>;
  updateLinkTableColumn(id: string, column: Partial<InsertLinkTableColumn>): Promise<LinkTableColumn | undefined>;
  deleteLinkTableColumn(id: string): Promise<boolean>;

  // Site URLs (rows)
  getSiteUrls(): Promise<SiteUrl[]>;
  getSiteUrl(id: string): Promise<SiteUrl | undefined>;
  createSiteUrl(siteUrl: InsertSiteUrl): Promise<SiteUrl>;
  updateSiteUrl(id: string, siteUrl: Partial<InsertSiteUrl>): Promise<SiteUrl | undefined>;
  deleteSiteUrl(id: string): Promise<boolean>;

  // Optimization Analyses
  getOptimizationAnalyses(): Promise<OptimizationAnalysis[]>;
  getOptimizationAnalysis(id: string): Promise<OptimizationAnalysis | undefined>;
  createOptimizationAnalysis(analysis: InsertOptimizationAnalysis): Promise<OptimizationAnalysis>;
  updateOptimizationAnalysisContent(id: string, htmlContent: string): Promise<OptimizationAnalysis | undefined>;
  deleteOptimizationAnalysis(id: string): Promise<boolean>;
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

  // Stub methods for interface compliance (not used since we use DatabaseStorage)
  async getWritingStyles(): Promise<WritingStyle[]> { return []; }
  async getWritingStyle(_id: string): Promise<WritingStyle | undefined> { return undefined; }
  async createWritingStyle(_style: InsertWritingStyle): Promise<WritingStyle> { throw new Error("Not implemented"); }
  async updateWritingStyle(_id: string, _style: Partial<InsertWritingStyle>): Promise<WritingStyle | undefined> { return undefined; }
  async deleteWritingStyle(_id: string): Promise<boolean> { return false; }
  async getOptimizationPrompts(): Promise<OptimizationPrompt[]> { return []; }
  async getOptimizationPrompt(_id: string): Promise<OptimizationPrompt | undefined> { return undefined; }
  async createOptimizationPrompt(_prompt: InsertOptimizationPrompt): Promise<OptimizationPrompt> { throw new Error("Not implemented"); }
  async updateOptimizationPrompt(_id: string, _prompt: Partial<InsertOptimizationPrompt>): Promise<OptimizationPrompt | undefined> { return undefined; }
  async deleteOptimizationPrompt(_id: string): Promise<boolean> { return false; }
  async getSeoSettings(): Promise<SeoSettings | undefined> { return undefined; }
  async upsertSeoSettings(_settings: InsertSeoSettings): Promise<SeoSettings> { throw new Error("Not implemented"); }
  async getImageStyles(): Promise<ImageStyle[]> { return []; }
  async getImageStyle(_id: string): Promise<ImageStyle | undefined> { return undefined; }
  async createImageStyle(_style: InsertImageStyle): Promise<ImageStyle> { throw new Error("Not implemented"); }
  async updateImageStyle(_id: string, _style: Partial<InsertImageStyle>): Promise<ImageStyle | undefined> { return undefined; }
  async deleteImageStyle(_id: string): Promise<boolean> { return false; }
  async getTargetAudiences(): Promise<TargetAudience[]> { return []; }
  async getTargetAudience(_id: string): Promise<TargetAudience | undefined> { return undefined; }
  async createTargetAudience(_audience: InsertTargetAudience): Promise<TargetAudience> { throw new Error("Not implemented"); }
  async updateTargetAudience(_id: string, _audience: Partial<InsertTargetAudience>): Promise<TargetAudience | undefined> { return undefined; }
  async deleteTargetAudience(_id: string): Promise<boolean> { return false; }
  async getLinkTableColumns(): Promise<LinkTableColumn[]> { return []; }
  async createLinkTableColumn(_column: InsertLinkTableColumn): Promise<LinkTableColumn> { throw new Error("Not implemented"); }
  async updateLinkTableColumn(_id: string, _column: Partial<InsertLinkTableColumn>): Promise<LinkTableColumn | undefined> { return undefined; }
  async deleteLinkTableColumn(_id: string): Promise<boolean> { return false; }
  async getSiteUrls(): Promise<SiteUrl[]> { return []; }
  async getSiteUrl(_id: string): Promise<SiteUrl | undefined> { return undefined; }
  async createSiteUrl(_siteUrl: InsertSiteUrl): Promise<SiteUrl> { throw new Error("Not implemented"); }
  async updateSiteUrl(_id: string, _siteUrl: Partial<InsertSiteUrl>): Promise<SiteUrl | undefined> { return undefined; }
  async deleteSiteUrl(_id: string): Promise<boolean> { return false; }
  async getOptimizationAnalyses(): Promise<OptimizationAnalysis[]> { return []; }
  async getOptimizationAnalysis(_id: string): Promise<OptimizationAnalysis | undefined> { return undefined; }
  async createOptimizationAnalysis(_analysis: InsertOptimizationAnalysis): Promise<OptimizationAnalysis> { throw new Error("Not implemented"); }
  async updateOptimizationAnalysisContent(_id: string, _htmlContent: string): Promise<OptimizationAnalysis | undefined> { return undefined; }
  async deleteOptimizationAnalysis(_id: string): Promise<boolean> { return false; }
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

  // Writing Styles
  async getWritingStyles(): Promise<WritingStyle[]> {
    return db.select().from(writingStyles).orderBy(writingStyles.name);
  }

  async getWritingStyle(id: string): Promise<WritingStyle | undefined> {
    const [style] = await db.select().from(writingStyles).where(eq(writingStyles.id, id));
    return style;
  }

  async createWritingStyle(insertStyle: InsertWritingStyle): Promise<WritingStyle> {
    const [style] = await db.insert(writingStyles).values(insertStyle).returning();
    return style;
  }

  async updateWritingStyle(id: string, updates: Partial<InsertWritingStyle>): Promise<WritingStyle | undefined> {
    const [style] = await db.update(writingStyles)
      .set(updates)
      .where(eq(writingStyles.id, id))
      .returning();
    return style;
  }

  async deleteWritingStyle(id: string): Promise<boolean> {
    await db.delete(writingStyles).where(eq(writingStyles.id, id));
    return true;
  }

  // Optimization Prompts
  async getOptimizationPrompts(): Promise<OptimizationPrompt[]> {
    return db.select().from(optimizationPrompts).orderBy(optimizationPrompts.name);
  }

  async getOptimizationPrompt(id: string): Promise<OptimizationPrompt | undefined> {
    const [prompt] = await db.select().from(optimizationPrompts).where(eq(optimizationPrompts.id, id));
    return prompt;
  }

  async createOptimizationPrompt(insertPrompt: InsertOptimizationPrompt): Promise<OptimizationPrompt> {
    const [prompt] = await db.insert(optimizationPrompts).values(insertPrompt).returning();
    return prompt;
  }

  async updateOptimizationPrompt(id: string, updates: Partial<InsertOptimizationPrompt>): Promise<OptimizationPrompt | undefined> {
    const [prompt] = await db.update(optimizationPrompts)
      .set(updates)
      .where(eq(optimizationPrompts.id, id))
      .returning();
    return prompt;
  }

  async deleteOptimizationPrompt(id: string): Promise<boolean> {
    await db.delete(optimizationPrompts).where(eq(optimizationPrompts.id, id));
    return true;
  }

  // SEO Settings
  async getSeoSettings(): Promise<SeoSettings | undefined> {
    const [settings] = await db.select().from(seoSettings).limit(1);
    return settings;
  }

  async upsertSeoSettings(insertSettings: InsertSeoSettings): Promise<SeoSettings> {
    const existing = await this.getSeoSettings();
    if (existing) {
      const [updated] = await db.update(seoSettings)
        .set({ ...insertSettings, updatedAt: new Date().toISOString() })
        .where(eq(seoSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [settings] = await db.insert(seoSettings).values(insertSettings).returning();
    return settings;
  }

  // Image Styles
  async getImageStyles(): Promise<ImageStyle[]> {
    return db.select().from(imageStyles).orderBy(imageStyles.name);
  }

  async getImageStyle(id: string): Promise<ImageStyle | undefined> {
    const [style] = await db.select().from(imageStyles).where(eq(imageStyles.id, id));
    return style;
  }

  async createImageStyle(insertStyle: InsertImageStyle): Promise<ImageStyle> {
    const [style] = await db.insert(imageStyles).values(insertStyle).returning();
    return style;
  }

  async updateImageStyle(id: string, updates: Partial<InsertImageStyle>): Promise<ImageStyle | undefined> {
    const [style] = await db.update(imageStyles)
      .set(updates)
      .where(eq(imageStyles.id, id))
      .returning();
    return style;
  }

  async deleteImageStyle(id: string): Promise<boolean> {
    await db.delete(imageStyles).where(eq(imageStyles.id, id));
    return true;
  }

  // Target Audiences
  async getTargetAudiences(): Promise<TargetAudience[]> {
    return db.select().from(targetAudiences).orderBy(targetAudiences.name);
  }

  async getTargetAudience(id: string): Promise<TargetAudience | undefined> {
    const [audience] = await db.select().from(targetAudiences).where(eq(targetAudiences.id, id));
    return audience;
  }

  async createTargetAudience(insertAudience: InsertTargetAudience): Promise<TargetAudience> {
    const [audience] = await db.insert(targetAudiences).values(insertAudience).returning();
    return audience;
  }

  async updateTargetAudience(id: string, updates: Partial<InsertTargetAudience>): Promise<TargetAudience | undefined> {
    const [audience] = await db.update(targetAudiences)
      .set(updates)
      .where(eq(targetAudiences.id, id))
      .returning();
    return audience;
  }

  async deleteTargetAudience(id: string): Promise<boolean> {
    await db.delete(targetAudiences).where(eq(targetAudiences.id, id));
    return true;
  }

  // Link Table Columns
  async getLinkTableColumns(): Promise<LinkTableColumn[]> {
    return db.select().from(linkTableColumns).orderBy(linkTableColumns.order);
  }

  async createLinkTableColumn(column: InsertLinkTableColumn): Promise<LinkTableColumn> {
    const [created] = await db.insert(linkTableColumns).values(column).returning();
    return created;
  }

  async updateLinkTableColumn(id: string, column: Partial<InsertLinkTableColumn>): Promise<LinkTableColumn | undefined> {
    const [updated] = await db.update(linkTableColumns).set(column).where(eq(linkTableColumns.id, id)).returning();
    return updated;
  }

  async deleteLinkTableColumn(id: string): Promise<boolean> {
    await db.delete(linkTableColumns).where(eq(linkTableColumns.id, id));
    return true;
  }

  // Site URLs (rows)
  async getSiteUrls(): Promise<SiteUrl[]> {
    return db.select().from(siteUrls).orderBy(siteUrls.createdAt);
  }

  async getSiteUrl(id: string): Promise<SiteUrl | undefined> {
    const [url] = await db.select().from(siteUrls).where(eq(siteUrls.id, id));
    return url;
  }

  async createSiteUrl(siteUrl: InsertSiteUrl): Promise<SiteUrl> {
    const [created] = await db.insert(siteUrls).values(siteUrl).returning();
    return created;
  }

  async updateSiteUrl(id: string, siteUrl: Partial<InsertSiteUrl>): Promise<SiteUrl | undefined> {
    const [updated] = await db.update(siteUrls).set(siteUrl).where(eq(siteUrls.id, id)).returning();
    return updated;
  }

  async deleteSiteUrl(id: string): Promise<boolean> {
    await db.delete(siteUrls).where(eq(siteUrls.id, id));
    return true;
  }

  // Optimization Analyses
  async getOptimizationAnalyses(): Promise<OptimizationAnalysis[]> {
    return db.select().from(optimizationAnalyses).orderBy(desc(optimizationAnalyses.createdAt));
  }

  async getOptimizationAnalysis(id: string): Promise<OptimizationAnalysis | undefined> {
    const [analysis] = await db.select().from(optimizationAnalyses).where(eq(optimizationAnalyses.id, id));
    return analysis;
  }

  async createOptimizationAnalysis(insertAnalysis: InsertOptimizationAnalysis): Promise<OptimizationAnalysis> {
    const [analysis] = await db.insert(optimizationAnalyses).values(insertAnalysis).returning();
    return analysis;
  }

  async updateOptimizationAnalysisContent(id: string, htmlContent: string): Promise<OptimizationAnalysis | undefined> {
    const existing = await this.getOptimizationAnalysis(id);
    if (!existing) return undefined;
    
    const updatedPageContent = {
      ...(existing.pageContent as object),
      htmlContent,
    };
    
    const [analysis] = await db.update(optimizationAnalyses)
      .set({ pageContent: updatedPageContent })
      .where(eq(optimizationAnalyses.id, id))
      .returning();
    return analysis;
  }

  async deleteOptimizationAnalysis(id: string): Promise<boolean> {
    await db.delete(optimizationAnalyses).where(eq(optimizationAnalyses.id, id));
    return true;
  }

  async updateOptimizationAnalysisRecommendations(id: string, recommendations: unknown[]): Promise<OptimizationAnalysis | undefined> {
    const [analysis] = await db.update(optimizationAnalyses)
      .set({ recommendations })
      .where(eq(optimizationAnalyses.id, id))
      .returning();
    return analysis;
  }
}

// Use database storage for persistence
export const storage = new DatabaseStorage();
