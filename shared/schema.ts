import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Content articles table
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  author: text("author"),
  category: text("category"),
  tags: text("tags").array(),
  targetKeyword: text("target_keyword"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  wordCount: integer("word_count").default(0),
  readabilityScore: integer("readability_score"),
  seoScore: integer("seo_score"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

// Keywords table for tracking
export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  volume: integer("volume"),
  difficulty: integer("difficulty"),
  currentPosition: integer("current_position"),
  previousPosition: integer("previous_position"),
  url: text("url"),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  ctr: text("ctr"),
  lastUpdated: text("last_updated").notNull().default(sql`now()`),
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  lastUpdated: true,
});

export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywords.$inferSelect;

// Integration connections table
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // ahrefs, gsc, ga
  status: text("status").notNull().default("disconnected"), // connected, disconnected, error
  lastSync: text("last_sync"),
  config: jsonb("config"),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Content suggestions from Ahrefs
export const contentSuggestions = pgTable("content_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id),
  type: text("type").notNull(), // keyword, structure, readability, competitor
  suggestion: text("suggestion").notNull(),
  priority: text("priority").default("medium"), // low, medium, high
  applied: boolean("applied").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertContentSuggestionSchema = createInsertSchema(contentSuggestions).omit({
  id: true,
  createdAt: true,
});

export type InsertContentSuggestion = z.infer<typeof insertContentSuggestionSchema>;
export type ContentSuggestion = typeof contentSuggestions.$inferSelect;

// Analytics data snapshots
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  bounceRate: text("bounce_rate"),
  avgSessionDuration: text("avg_session_duration"),
  topPages: jsonb("top_pages"),
  trafficSources: jsonb("traffic_sources"),
});

export const insertAnalyticsSnapshotSchema = createInsertSchema(analyticsSnapshots).omit({
  id: true,
});

export type InsertAnalyticsSnapshot = z.infer<typeof insertAnalyticsSnapshotSchema>;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;

// Writing styles table
export const writingStyles = pgTable("writing_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  tone: text("tone"), // professional, casual, friendly, authoritative
  guidelines: text("guidelines"),
  exampleText: text("example_text"),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertWritingStyleSchema = createInsertSchema(writingStyles).omit({
  id: true,
  createdAt: true,
});

export type InsertWritingStyle = z.infer<typeof insertWritingStyleSchema>;
export type WritingStyle = typeof writingStyles.$inferSelect;

// SEO settings table
export const seoSettings = pgTable("seo_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metaTitleGuidelines: text("meta_title_guidelines"),
  metaTitleMaxLength: integer("meta_title_max_length").default(60),
  metaDescriptionGuidelines: text("meta_description_guidelines"),
  metaDescriptionMaxLength: integer("meta_description_max_length").default(160),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type SeoSettings = typeof seoSettings.$inferSelect;

// TypeScript interfaces for API responses
export interface AhrefsKeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc?: number;
  clicks?: number;
  parentTopic?: string;
}

export interface AhrefsBacklinkData {
  totalBacklinks: number;
  referringDomains: number;
  domainRating: number;
  urlRating: number;
}

export interface GSCPerformanceData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCKeywordData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface ContentOptimizationResult {
  seoScore: number;
  readabilityScore: number;
  wordCount: number;
  suggestions: {
    type: string;
    message: string;
    priority: "low" | "medium" | "high";
  }[];
  keywordDensity: number;
  headingStructure: {
    h1: number;
    h2: number;
    h3: number;
  };
}

export interface ContentGenerationRequest {
  targetKeyword: string;
  wordCount: number;
  recommendedKeywords: string[];
  styleId: string;
}

export interface MetaSuggestions {
  titles: string[];
  descriptions: string[];
}

export * from "./models/chat";
