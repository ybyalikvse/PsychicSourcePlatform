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
  type HoroscopePrompt, type InsertHoroscopePrompt,
  type HoroscopeEntry, type InsertHoroscopeEntry,
  type Psychic, type InsertPsychic,
  type VideoRequest, type InsertVideoRequest,
  type VideoMessage, type InsertVideoMessage,
  type VideoCaption, type InsertVideoCaption,
  type VideoCaptionPrompt, type InsertVideoCaptionPrompt,
  users, articles, keywords, integrations, contentSuggestions, analyticsSnapshots,
  writingStyles, optimizationPrompts, seoSettings, imageStyles, targetAudiences, linkTableColumns, siteUrls, optimizationAnalyses,
  horoscopePrompts, horoscopeEntries,
  psychics, videoRequests, videoMessages, videoCaptions, videoCaptionPrompts,
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

  // Horoscope Prompts
  getHoroscopePrompts(): Promise<HoroscopePrompt[]>;
  getHoroscopePrompt(id: string): Promise<HoroscopePrompt | undefined>;
  getHoroscopePromptByTypeAndLanguage(type: string, language: string, site?: string): Promise<HoroscopePrompt | undefined>;
  createHoroscopePrompt(prompt: InsertHoroscopePrompt): Promise<HoroscopePrompt>;
  updateHoroscopePrompt(id: string, prompt: Partial<InsertHoroscopePrompt>): Promise<HoroscopePrompt | undefined>;
  deleteHoroscopePrompt(id: string): Promise<boolean>;

  // Horoscope Entries
  getHoroscopeEntries(type?: string, language?: string, site?: string): Promise<HoroscopeEntry[]>;
  getHoroscopeEntry(id: string): Promise<HoroscopeEntry | undefined>;
  getHoroscopeEntriesByPeriod(type: string, language: string, periodStart: string, site?: string): Promise<HoroscopeEntry[]>;
  createHoroscopeEntry(entry: InsertHoroscopeEntry): Promise<HoroscopeEntry>;
  updateHoroscopeEntry(id: string, entry: Partial<InsertHoroscopeEntry>): Promise<HoroscopeEntry | undefined>;
  deleteHoroscopeEntry(id: string): Promise<boolean>;
  deleteHoroscopeEntriesByPeriod(type: string, language: string, periodStart: string, site?: string): Promise<boolean>;

  // Psychics
  getPsychics(): Promise<Psychic[]>;
  getPsychic(id: string): Promise<Psychic | undefined>;
  createPsychic(psychic: InsertPsychic): Promise<Psychic>;
  updatePsychic(id: string, psychic: Partial<InsertPsychic>): Promise<Psychic | undefined>;
  deletePsychic(id: string): Promise<boolean>;

  // Video Requests
  getVideoRequests(status?: string): Promise<VideoRequest[]>;
  getVideoRequest(id: string): Promise<VideoRequest | undefined>;
  getVideoRequestsByPsychic(psychicId: string): Promise<VideoRequest[]>;
  createVideoRequest(request: InsertVideoRequest): Promise<VideoRequest>;
  updateVideoRequest(id: string, updates: Partial<VideoRequest>): Promise<VideoRequest | undefined>;
  deleteVideoRequest(id: string): Promise<boolean>;

  // Video Messages
  getVideoMessages(videoRequestId: string): Promise<VideoMessage[]>;
  createVideoMessage(message: InsertVideoMessage): Promise<VideoMessage>;

  // Video Captions
  getVideoCaptions(videoRequestId: string): Promise<VideoCaption[]>;
  createVideoCaption(caption: InsertVideoCaption): Promise<VideoCaption>;
  deleteVideoCaption(id: string): Promise<boolean>;

  // Video Caption Prompts
  getVideoCaptionPrompts(): Promise<VideoCaptionPrompt[]>;
  getVideoCaptionPrompt(id: string): Promise<VideoCaptionPrompt | undefined>;
  getVideoCaptionPromptByPlatform(platform: string): Promise<VideoCaptionPrompt | undefined>;
  createVideoCaptionPrompt(prompt: InsertVideoCaptionPrompt): Promise<VideoCaptionPrompt>;
  updateVideoCaptionPrompt(id: string, prompt: Partial<InsertVideoCaptionPrompt>): Promise<VideoCaptionPrompt | undefined>;
  deleteVideoCaptionPrompt(id: string): Promise<boolean>;
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
  async getHoroscopePrompts(): Promise<HoroscopePrompt[]> { return []; }
  async getHoroscopePrompt(_id: string): Promise<HoroscopePrompt | undefined> { return undefined; }
  async getHoroscopePromptByTypeAndLanguage(_type: string, _language: string, _site?: string): Promise<HoroscopePrompt | undefined> { return undefined; }
  async createHoroscopePrompt(_prompt: InsertHoroscopePrompt): Promise<HoroscopePrompt> { throw new Error("Not implemented"); }
  async updateHoroscopePrompt(_id: string, _prompt: Partial<InsertHoroscopePrompt>): Promise<HoroscopePrompt | undefined> { return undefined; }
  async deleteHoroscopePrompt(_id: string): Promise<boolean> { return false; }
  async getHoroscopeEntries(_type?: string, _language?: string, _site?: string): Promise<HoroscopeEntry[]> { return []; }
  async getHoroscopeEntry(_id: string): Promise<HoroscopeEntry | undefined> { return undefined; }
  async getHoroscopeEntriesByPeriod(_type: string, _language: string, _periodStart: string, _site?: string): Promise<HoroscopeEntry[]> { return []; }
  async createHoroscopeEntry(_entry: InsertHoroscopeEntry): Promise<HoroscopeEntry> { throw new Error("Not implemented"); }
  async updateHoroscopeEntry(_id: string, _entry: Partial<InsertHoroscopeEntry>): Promise<HoroscopeEntry | undefined> { return undefined; }
  async deleteHoroscopeEntry(_id: string): Promise<boolean> { return false; }
  async deleteHoroscopeEntriesByPeriod(_type: string, _language: string, _periodStart: string, _site?: string): Promise<boolean> { return false; }
  async getPsychics(): Promise<Psychic[]> { return []; }
  async getPsychic(_id: string): Promise<Psychic | undefined> { return undefined; }
  async createPsychic(_psychic: InsertPsychic): Promise<Psychic> { throw new Error("Not implemented"); }
  async updatePsychic(_id: string, _psychic: Partial<InsertPsychic>): Promise<Psychic | undefined> { return undefined; }
  async deletePsychic(_id: string): Promise<boolean> { return false; }
  async getVideoRequests(_status?: string): Promise<VideoRequest[]> { return []; }
  async getVideoRequest(_id: string): Promise<VideoRequest | undefined> { return undefined; }
  async getVideoRequestsByPsychic(_psychicId: string): Promise<VideoRequest[]> { return []; }
  async createVideoRequest(_request: InsertVideoRequest): Promise<VideoRequest> { throw new Error("Not implemented"); }
  async updateVideoRequest(_id: string, _updates: Partial<VideoRequest>): Promise<VideoRequest | undefined> { return undefined; }
  async deleteVideoRequest(_id: string): Promise<boolean> { return false; }
  async getVideoMessages(_videoRequestId: string): Promise<VideoMessage[]> { return []; }
  async createVideoMessage(_message: InsertVideoMessage): Promise<VideoMessage> { throw new Error("Not implemented"); }
  async getVideoCaptions(_videoRequestId: string): Promise<VideoCaption[]> { return []; }
  async createVideoCaption(_caption: InsertVideoCaption): Promise<VideoCaption> { throw new Error("Not implemented"); }
  async deleteVideoCaption(_id: string): Promise<boolean> { return false; }
  async getVideoCaptionPrompts(): Promise<VideoCaptionPrompt[]> { return []; }
  async getVideoCaptionPrompt(_id: string): Promise<VideoCaptionPrompt | undefined> { return undefined; }
  async getVideoCaptionPromptByPlatform(_platform: string): Promise<VideoCaptionPrompt | undefined> { return undefined; }
  async createVideoCaptionPrompt(_prompt: InsertVideoCaptionPrompt): Promise<VideoCaptionPrompt> { throw new Error("Not implemented"); }
  async updateVideoCaptionPrompt(_id: string, _prompt: Partial<InsertVideoCaptionPrompt>): Promise<VideoCaptionPrompt | undefined> { return undefined; }
  async deleteVideoCaptionPrompt(_id: string): Promise<boolean> { return false; }
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

  // Horoscope Prompts
  async getHoroscopePrompts(): Promise<HoroscopePrompt[]> {
    return db.select().from(horoscopePrompts).orderBy(horoscopePrompts.type);
  }

  async getHoroscopePrompt(id: string): Promise<HoroscopePrompt | undefined> {
    const [prompt] = await db.select().from(horoscopePrompts).where(eq(horoscopePrompts.id, id));
    return prompt;
  }

  async getHoroscopePromptByTypeAndLanguage(type: string, language: string, site: string = "psychicsource"): Promise<HoroscopePrompt | undefined> {
    const results = await db.select().from(horoscopePrompts);
    return results.find(p => p.type === type && p.language === language && p.site === site && p.isActive);
  }

  async createHoroscopePrompt(prompt: InsertHoroscopePrompt): Promise<HoroscopePrompt> {
    const [created] = await db.insert(horoscopePrompts).values(prompt).returning();
    return created;
  }

  async updateHoroscopePrompt(id: string, updates: Partial<InsertHoroscopePrompt>): Promise<HoroscopePrompt | undefined> {
    const [updated] = await db.update(horoscopePrompts)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(horoscopePrompts.id, id))
      .returning();
    return updated;
  }

  async deleteHoroscopePrompt(id: string): Promise<boolean> {
    await db.delete(horoscopePrompts).where(eq(horoscopePrompts.id, id));
    return true;
  }

  // Horoscope Entries
  async getHoroscopeEntries(type?: string, language?: string, site?: string): Promise<HoroscopeEntry[]> {
    const all = await db.select().from(horoscopeEntries).orderBy(desc(horoscopeEntries.createdAt));
    return all.filter(e => {
      if (type && e.type !== type) return false;
      if (language && e.language !== language) return false;
      if (site && e.site !== site) return false;
      return true;
    });
  }

  async getHoroscopeEntry(id: string): Promise<HoroscopeEntry | undefined> {
    const [entry] = await db.select().from(horoscopeEntries).where(eq(horoscopeEntries.id, id));
    return entry;
  }

  async getHoroscopeEntriesByPeriod(type: string, language: string, periodStart: string, site: string = "psychicsource"): Promise<HoroscopeEntry[]> {
    const all = await db.select().from(horoscopeEntries);
    return all.filter(e => e.type === type && e.language === language && e.periodStart === periodStart && e.site === site);
  }

  async createHoroscopeEntry(entry: InsertHoroscopeEntry): Promise<HoroscopeEntry> {
    const [created] = await db.insert(horoscopeEntries).values(entry).returning();
    return created;
  }

  async updateHoroscopeEntry(id: string, updates: Partial<InsertHoroscopeEntry>): Promise<HoroscopeEntry | undefined> {
    const [updated] = await db.update(horoscopeEntries)
      .set(updates)
      .where(eq(horoscopeEntries.id, id))
      .returning();
    return updated;
  }

  async deleteHoroscopeEntry(id: string): Promise<boolean> {
    await db.delete(horoscopeEntries).where(eq(horoscopeEntries.id, id));
    return true;
  }

  async deleteHoroscopeEntriesByPeriod(type: string, language: string, periodStart: string, site: string = "psychicsource"): Promise<boolean> {
    const entries = await this.getHoroscopeEntriesByPeriod(type, language, periodStart, site);
    for (const entry of entries) {
      await db.delete(horoscopeEntries).where(eq(horoscopeEntries.id, entry.id));
    }
    return true;
  }

  // Psychics
  async getPsychics(): Promise<Psychic[]> {
    return db.select().from(psychics).orderBy(psychics.name);
  }

  async getPsychic(id: string): Promise<Psychic | undefined> {
    const [psychic] = await db.select().from(psychics).where(eq(psychics.id, id));
    return psychic;
  }

  async createPsychic(psychic: InsertPsychic): Promise<Psychic> {
    const [created] = await db.insert(psychics).values(psychic).returning();
    return created;
  }

  async updatePsychic(id: string, updates: Partial<InsertPsychic>): Promise<Psychic | undefined> {
    const [updated] = await db.update(psychics).set(updates).where(eq(psychics.id, id)).returning();
    return updated;
  }

  async deletePsychic(id: string): Promise<boolean> {
    await db.delete(psychics).where(eq(psychics.id, id));
    return true;
  }

  // Video Requests
  async getVideoRequests(status?: string): Promise<VideoRequest[]> {
    const all = await db.select().from(videoRequests).orderBy(desc(videoRequests.createdAt));
    if (status) return all.filter(r => r.status === status);
    return all;
  }

  async getVideoRequest(id: string): Promise<VideoRequest | undefined> {
    const [request] = await db.select().from(videoRequests).where(eq(videoRequests.id, id));
    return request;
  }

  async getVideoRequestsByPsychic(psychicId: string): Promise<VideoRequest[]> {
    const all = await db.select().from(videoRequests).orderBy(desc(videoRequests.createdAt));
    return all.filter(r => r.claimedBy === psychicId);
  }

  async createVideoRequest(request: InsertVideoRequest): Promise<VideoRequest> {
    const [created] = await db.insert(videoRequests).values(request).returning();
    return created;
  }

  async updateVideoRequest(id: string, updates: Partial<VideoRequest>): Promise<VideoRequest | undefined> {
    const [updated] = await db.update(videoRequests)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(videoRequests.id, id))
      .returning();
    return updated;
  }

  async deleteVideoRequest(id: string): Promise<boolean> {
    await db.delete(videoRequests).where(eq(videoRequests.id, id));
    return true;
  }

  // Video Messages
  async getVideoMessages(videoRequestId: string): Promise<VideoMessage[]> {
    const all = await db.select().from(videoMessages).orderBy(videoMessages.createdAt);
    return all.filter(m => m.videoRequestId === videoRequestId);
  }

  async createVideoMessage(message: InsertVideoMessage): Promise<VideoMessage> {
    const [created] = await db.insert(videoMessages).values(message).returning();
    return created;
  }

  // Video Captions
  async getVideoCaptions(videoRequestId: string): Promise<VideoCaption[]> {
    const all = await db.select().from(videoCaptions).orderBy(desc(videoCaptions.createdAt));
    return all.filter(c => c.videoRequestId === videoRequestId);
  }

  async createVideoCaption(caption: InsertVideoCaption): Promise<VideoCaption> {
    const [created] = await db.insert(videoCaptions).values(caption).returning();
    return created;
  }

  async deleteVideoCaption(id: string): Promise<boolean> {
    await db.delete(videoCaptions).where(eq(videoCaptions.id, id));
    return true;
  }

  // Video Caption Prompts
  async getVideoCaptionPrompts(): Promise<VideoCaptionPrompt[]> {
    return db.select().from(videoCaptionPrompts).orderBy(videoCaptionPrompts.platform);
  }

  async getVideoCaptionPrompt(id: string): Promise<VideoCaptionPrompt | undefined> {
    const [prompt] = await db.select().from(videoCaptionPrompts).where(eq(videoCaptionPrompts.id, id));
    return prompt;
  }

  async getVideoCaptionPromptByPlatform(platform: string): Promise<VideoCaptionPrompt | undefined> {
    const all = await db.select().from(videoCaptionPrompts);
    return all.find(p => p.platform === platform && p.isActive);
  }

  async createVideoCaptionPrompt(prompt: InsertVideoCaptionPrompt): Promise<VideoCaptionPrompt> {
    const [created] = await db.insert(videoCaptionPrompts).values(prompt).returning();
    return created;
  }

  async updateVideoCaptionPrompt(id: string, updates: Partial<InsertVideoCaptionPrompt>): Promise<VideoCaptionPrompt | undefined> {
    const [updated] = await db.update(videoCaptionPrompts)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(videoCaptionPrompts.id, id))
      .returning();
    return updated;
  }

  async deleteVideoCaptionPrompt(id: string): Promise<boolean> {
    await db.delete(videoCaptionPrompts).where(eq(videoCaptionPrompts.id, id));
    return true;
  }
}

// Use database storage for persistence
export const storage = new DatabaseStorage();
