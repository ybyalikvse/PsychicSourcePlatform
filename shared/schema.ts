import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, json, timestamp, date } from "drizzle-orm/pg-core";
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
  recommendedKeywords: text("recommended_keywords").array(),
  writingStyleId: text("writing_style_id"),
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

// Optimization prompts table
export const optimizationPrompts = pgTable("optimization_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  promptType: text("prompt_type").notNull().default("analysis"),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertOptimizationPromptSchema = createInsertSchema(optimizationPrompts).omit({
  id: true,
  createdAt: true,
});

export type InsertOptimizationPrompt = z.infer<typeof insertOptimizationPromptSchema>;
export type OptimizationPrompt = typeof optimizationPrompts.$inferSelect;

// SEO settings table
export const seoSettings = pgTable("seo_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metaTitleGuidelines: text("meta_title_guidelines"),
  metaTitleMaxLength: integer("meta_title_max_length").default(60),
  metaDescriptionGuidelines: text("meta_description_guidelines"),
  metaDescriptionMaxLength: integer("meta_description_max_length").default(160),
  optimizationPrompt: text("optimization_prompt"),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type SeoSettings = typeof seoSettings.$inferSelect;

// Image styles table
export const imageStyles = pgTable("image_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  stylePrompt: text("style_prompt"), // e.g., "photorealistic", "digital art", "watercolor"
  aspectRatio: text("aspect_ratio").default("16:9"), // 1:1, 16:9, 4:3, 9:16
  additionalInstructions: text("additional_instructions"),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertImageStyleSchema = createInsertSchema(imageStyles).omit({
  id: true,
  createdAt: true,
});

export type InsertImageStyle = z.infer<typeof insertImageStyleSchema>;
export type ImageStyle = typeof imageStyles.$inferSelect;

// Target audiences table
export const targetAudiences = pgTable("target_audiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  demographics: text("demographics"), // e.g., "women 35-55, interested in spirituality"
  painPoints: text("pain_points"), // What problems do they have?
  goals: text("goals"), // What are they trying to achieve?
  tone: text("tone"), // How should we speak to them?
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertTargetAudienceSchema = createInsertSchema(targetAudiences).omit({
  id: true,
  createdAt: true,
});

export type InsertTargetAudience = z.infer<typeof insertTargetAudienceSchema>;
export type TargetAudience = typeof targetAudiences.$inferSelect;

// Dynamic columns for the internal links table
export const linkTableColumns = pgTable("link_table_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertLinkTableColumnSchema = createInsertSchema(linkTableColumns).omit({
  id: true,
  createdAt: true,
});

export type InsertLinkTableColumn = z.infer<typeof insertLinkTableColumnSchema>;
export type LinkTableColumn = typeof linkTableColumns.$inferSelect;

// Site URLs/rows for internal linking (dynamic data storage)
export const siteUrls = pgTable("site_urls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default(""), // Row identifier/name
  data: json("data").$type<Record<string, string>>().default({}), // Dynamic column values
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertSiteUrlSchema = createInsertSchema(siteUrls).omit({
  id: true,
  createdAt: true,
});

export type InsertSiteUrl = z.infer<typeof insertSiteUrlSchema>;
export type SiteUrl = typeof siteUrls.$inferSelect;

// Saved optimization analyses
export const optimizationAnalyses = pgTable("optimization_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  dateRange: text("date_range").default("28"),
  pageTitle: text("page_title"),
  pageMetaDescription: text("page_meta_description"),
  pageWordCount: integer("page_word_count"),
  keywords: jsonb("keywords"), // Array of keyword data from GSC
  competitors: jsonb("competitors"), // Array of competitor analysis
  recommendations: jsonb("recommendations"), // Array of AI recommendations
  pageContent: jsonb("page_content"), // Full page content data including headings
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertOptimizationAnalysisSchema = createInsertSchema(optimizationAnalyses).omit({
  id: true,
  createdAt: true,
});

export type InsertOptimizationAnalysis = z.infer<typeof insertOptimizationAnalysisSchema>;
export type OptimizationAnalysis = typeof optimizationAnalyses.$inferSelect;

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

// Horoscope prompts table - configurable templates per type/language
export const horoscopePrompts = pgTable("horoscope_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  site: text("site").notNull().default("psychicsource"), // psychicsource, pathforward
  type: text("type").notNull(), // daily, weekly, monthly
  language: text("language").notNull().default("en"), // en, es
  prompt: text("prompt").notNull(),
  aiModel: text("ai_model").default("claude"), // claude, gpt
  isActive: boolean("is_active").default(true),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const insertHoroscopePromptSchema = createInsertSchema(horoscopePrompts).omit({
  id: true,
  updatedAt: true,
});

export type InsertHoroscopePrompt = z.infer<typeof insertHoroscopePromptSchema>;
export type HoroscopePrompt = typeof horoscopePrompts.$inferSelect;

// Horoscope entries table - generated horoscope content
export const horoscopeEntries = pgTable("horoscope_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  site: text("site").notNull().default("psychicsource"), // psychicsource, pathforward
  type: text("type").notNull(), // daily, weekly, monthly
  language: text("language").notNull().default("en"),
  sign: text("sign").notNull(), // aries, taurus, etc.
  content: text("content").notNull(),
  periodStart: text("period_start").notNull(), // date string YYYY-MM-DD
  periodEnd: text("period_end").notNull(),
  status: text("status").notNull().default("published"), // draft, published
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertHoroscopeEntrySchema = createInsertSchema(horoscopeEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertHoroscopeEntry = z.infer<typeof insertHoroscopeEntrySchema>;
export type HoroscopeEntry = typeof horoscopeEntries.$inferSelect;

// Psychics table - psychic users for video portal
export const psychics = pgTable("psychics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertPsychicSchema = createInsertSchema(psychics).omit({
  id: true,
  createdAt: true,
});

export type InsertPsychic = z.infer<typeof insertPsychicSchema>;
export type Psychic = typeof psychics.$inferSelect;

// Video requests table - admin creates, psychics fulfill
export const videoRequests = pgTable("video_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  hook: text("hook"),
  videoDuration: text("video_duration"), // e.g. "30s", "60s", "90s"
  requiredDate: text("required_date"),
  payAmount: text("pay_amount"),
  description: text("description"),
  status: text("status").notNull().default("available"), // available, claimed, submitted, revision_requested, approved, paid
  claimedBy: text("claimed_by"), // psychic id
  claimedAt: text("claimed_at"),
  submittedAt: text("submitted_at"),
  approvedAt: text("approved_at"),
  videoUrl: text("video_url"), // S3 URL
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const insertVideoRequestSchema = createInsertSchema(videoRequests).omit({
  id: true,
  claimedBy: true,
  claimedAt: true,
  submittedAt: true,
  approvedAt: true,
  videoUrl: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVideoRequest = z.infer<typeof insertVideoRequestSchema>;
export type VideoRequest = typeof videoRequests.$inferSelect;

// Video messages table - messaging between admin and psychic
export const videoMessages = pgTable("video_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoRequestId: text("video_request_id").notNull(),
  senderType: text("sender_type").notNull(), // admin, psychic
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertVideoMessageSchema = createInsertSchema(videoMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoMessage = z.infer<typeof insertVideoMessageSchema>;
export type VideoMessage = typeof videoMessages.$inferSelect;

// Video captions table - AI-generated captions and hashtags
export const videoCaptions = pgTable("video_captions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoRequestId: text("video_request_id").notNull(),
  caption: text("caption").notNull(),
  hashtags: text("hashtags").notNull(),
  platform: text("platform").notNull(), // tiktok, instagram, youtube, facebook
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertVideoCaptionSchema = createInsertSchema(videoCaptions).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoCaption = z.infer<typeof insertVideoCaptionSchema>;
export type VideoCaption = typeof videoCaptions.$inferSelect;

// Video caption prompts table - configurable AI prompts for caption generation
export const videoCaptionPrompts = pgTable("video_caption_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(), // tiktok, instagram, youtube, facebook
  captionPrompt: text("caption_prompt").notNull(),
  hashtagPrompt: text("hashtag_prompt").notNull(),
  isActive: boolean("is_active").default(true),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const insertVideoCaptionPromptSchema = createInsertSchema(videoCaptionPrompts).omit({
  id: true,
  updatedAt: true,
});

export type InsertVideoCaptionPrompt = z.infer<typeof insertVideoCaptionPromptSchema>;
export type VideoCaptionPrompt = typeof videoCaptionPrompts.$inferSelect;

export * from "./models/chat";

// ============================================================
// VIRAL SCRIPT PRO (VSP) TABLES
// ============================================================

export const vspContentProjects = pgTable("vsp_content_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  subtopic: text("subtopic").notNull(),
  campaignId: varchar("campaign_id"),
  scheduledDate: date("scheduled_date"),
  publishedDate: timestamp("published_date"),
  priority: text("priority").default("medium"),
  isTemplate: boolean("is_template").default(false),
  script: json("script").$type<{
    content: string;
    sections: Array<{ type: 'hook' | 'main' | 'cta'; content: string; timing: string; }>;
    stats: { wordCount: number; duration: number; viralScore: number; };
  }>(),
  caption: json("caption").$type<{ text: string; hashtags: string[]; engagementScore: number; }>(),
  videoSettings: json("video_settings"),
  videoUrl: text("video_url"),
  revidProjectId: text("revid_project_id"),
  soraJobId: text("sora_job_id"),
  veoOperationName: text("veo_operation_name"),
  status: text("status").notNull().default("draft"),
  analytics: json("analytics"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspContentProjectSchema = createInsertSchema(vspContentProjects).pick({
  category: true, subtopic: true, script: true, caption: true,
  videoSettings: true, videoUrl: true, status: true,
});
export type InsertVspContentProject = z.infer<typeof insertVspContentProjectSchema>;
export type VspContentProject = typeof vspContentProjects.$inferSelect;

export const vspCampaigns = pgTable("vsp_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("planning"),
  goals: json("goals"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspCampaignSchema = createInsertSchema(vspCampaigns).pick({
  name: true, description: true, startDate: true, endDate: true,
  status: true, goals: true, color: true,
});
export type InsertVspCampaign = z.infer<typeof insertVspCampaignSchema>;
export type VspCampaign = typeof vspCampaigns.$inferSelect;

export const vspContentCalendar = pgTable("vsp_content_calendar", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: date("scheduled_date").notNull(),
  category: text("category").notNull(),
  subtopic: text("subtopic").notNull(),
  campaignId: varchar("campaign_id"),
  projectId: varchar("project_id"),
  status: text("status").notNull().default("planned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspContentCalendarSchema = createInsertSchema(vspContentCalendar).pick({
  title: true, description: true, scheduledDate: true, category: true,
  subtopic: true, campaignId: true, status: true, notes: true,
});
export type InsertVspContentCalendar = z.infer<typeof insertVspContentCalendarSchema>;
export type VspContentCalendar = typeof vspContentCalendar.$inferSelect;

export const vspContentTemplates = pgTable("vsp_content_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subtopic: text("subtopic").notNull(),
  scriptTemplate: text("script_template").notNull(),
  captionTemplate: text("caption_template"),
  tags: json("tags").$type<string[]>().default([]),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspContentTemplateSchema = createInsertSchema(vspContentTemplates).pick({
  name: true, category: true, subtopic: true, scriptTemplate: true,
  captionTemplate: true, tags: true, isPublic: true,
});
export type InsertVspContentTemplate = z.infer<typeof insertVspContentTemplateSchema>;
export type VspContentTemplate = typeof vspContentTemplates.$inferSelect;

export const vspCampaignTemplates = pgTable("vsp_campaign_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  duration: integer("duration_days").notNull(),
  contentFrequency: integer("content_frequency").notNull(),
  contentMix: json("content_mix").default({ mainTheme: 70, related: 20, engagement: 10 }),
  contentTypes: json("content_types").$type<string[]>().default(['script', 'caption']),
  schedulingPattern: json("scheduling_pattern"),
  subtopics: json("subtopics").$type<string[]>().notNull(),
  goals: json("goals"),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspCampaignTemplateSchema = createInsertSchema(vspCampaignTemplates).omit({
  id: true, usageCount: true, createdAt: true, updatedAt: true,
});
export type InsertVspCampaignTemplate = z.infer<typeof insertVspCampaignTemplateSchema>;
export type VspCampaignTemplate = typeof vspCampaignTemplates.$inferSelect;

export const vspBulkGenerationJobs = pgTable("vsp_bulk_generation_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  templateId: varchar("template_id"),
  status: text("status").notNull().default("pending"),
  totalItems: integer("total_items").notNull(),
  completedItems: integer("completed_items").default(0),
  failedItems: integer("failed_items").default(0),
  generationType: text("generation_type").notNull(),
  scheduledDates: json("scheduled_dates").$type<string[]>(),
  progress: json("progress"),
  errors: json("errors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspBulkGenerationJobSchema = createInsertSchema(vspBulkGenerationJobs).omit({
  id: true, completedItems: true, failedItems: true, progress: true, errors: true, createdAt: true, updatedAt: true,
});
export type InsertVspBulkGenerationJob = z.infer<typeof insertVspBulkGenerationJobSchema>;
export type VspBulkGenerationJob = typeof vspBulkGenerationJobs.$inferSelect;

export const vspContentCategories = pgTable("vsp_content_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspContentCategorySchema = createInsertSchema(vspContentCategories).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertVspContentCategory = z.infer<typeof insertVspContentCategorySchema>;
export type VspContentCategory = typeof vspContentCategories.$inferSelect;

export const vspContentSubtopics = pgTable("vsp_content_subtopics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => vspContentCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspContentSubtopicSchema = createInsertSchema(vspContentSubtopics).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertVspContentSubtopic = z.infer<typeof insertVspContentSubtopicSchema>;
export type VspContentSubtopic = typeof vspContentSubtopics.$inferSelect;

export const vspScriptStyles = pgTable("vsp_script_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  description: text("description"),
  promptTemplate: text("prompt_template").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspScriptStyleSchema = createInsertSchema(vspScriptStyles).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertVspScriptStyle = z.infer<typeof insertVspScriptStyleSchema>;
export type VspScriptStyle = typeof vspScriptStyles.$inferSelect;

export const vspCaptionStyles = pgTable("vsp_caption_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  description: text("description"),
  promptTemplate: text("prompt_template").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVspCaptionStyleSchema = createInsertSchema(vspCaptionStyles).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertVspCaptionStyle = z.infer<typeof insertVspCaptionStyleSchema>;
export type VspCaptionStyle = typeof vspCaptionStyles.$inferSelect;

// VSP request validation schemas
export const vspScriptGenerationSchema = z.object({
  category: z.string(),
  subtopic: z.string(),
  style: z.string(),
  length: z.enum(['15s', '30s', '60s']),
});
export type VspScriptGenerationRequest = z.infer<typeof vspScriptGenerationSchema>;

export const vspCaptionGenerationSchema = z.object({
  projectId: z.string(),
  tone: z.string(),
  hashtagCount: z.number().min(5).max(20),
});
export type VspCaptionGenerationRequest = z.infer<typeof vspCaptionGenerationSchema>;

export const vspVideoGenerationSchema = z.object({
  projectId: z.string(),
  videoEngine: z.enum(['revid', 'sora', 'veo']).default('revid'),
  style: z.string().optional(),
  voice: z.string().optional(),
  generationPreset: z.string().optional(),
  qualityTier: z.string().optional(),
  captionStyle: z.string().optional(),
  audio: z.string().optional(),
  resolution: z.enum(['720p', '1080p']).optional(),
  compression: z.number().optional(),
  frameRate: z.number().optional(),
  hasToGenerateCover: z.boolean().optional(),
  ratio: z.enum(['9 / 16', '16 / 9', '1 / 1']).optional(),
  disableCaptions: z.boolean().optional(),
  captionPositionName: z.enum(['bottom', 'middle', 'top']).optional(),
  hasToGenerateVoice: z.boolean().optional(),
  hasToGenerateMusic: z.boolean().optional(),
  generationMusicPrompt: z.string().optional(),
  soraModel: z.enum(['sora-2', 'sora-2-pro']).optional(),
  soraSize: z.enum(['1280x720', '720x1280', '1080x1080']).optional(),
  soraSeconds: z.number().optional(),
  soraCustomInstructions: z.string().optional(),
  soraReferenceImage: z.string().optional(),
  soraVisualPrompt: z.string().optional(),
  veoAspectRatio: z.enum(['9:16', '16:9']).optional(),
  veoResolution: z.enum(['720p', '1080p']).optional(),
  veoCustomInstructions: z.string().optional(),
  veoReferenceImages: z.array(z.string()).max(3).optional(),
  veoNegativePrompt: z.string().optional(),
  characterProfile: z.object({
    description: z.string(),
    wardrobe: z.string().optional(),
    distinctiveFeatures: z.string().optional(),
  }).optional(),
  colorPalette: z.array(z.string()).optional(),
  cinematography: z.object({
    cameraStyle: z.string().optional(),
    lightingStyle: z.string().optional(),
  }).optional(),
});
export type VspVideoGenerationRequest = z.infer<typeof vspVideoGenerationSchema>;

export const vspPublishToPostBridgeSchema = z.object({
  socialAccountIds: z.array(z.number()).min(1),
  scheduledAt: z.string().optional(),
  platformConfigurations: z.object({
    tiktok: z.object({ title: z.string().optional(), caption: z.string().optional() }).optional(),
    instagram: z.object({ caption: z.string().optional(), placement: z.enum(['feed', 'reels']).optional() }).optional(),
    youtube: z.object({ title: z.string().optional(), caption: z.string().optional() }).optional(),
  }).optional(),
});
export type VspPublishToPostBridge = z.infer<typeof vspPublishToPostBridgeSchema>;

// ============================================================
// CONTENT INTELLIGENCE (CI) TABLES
// ============================================================

export const ciCompetitors = pgTable("ci_competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name"),
  platform: text("platform").notNull().default("tiktok"),
  isActive: boolean("is_active").default(true),
  lastScrapedAt: text("last_scraped_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertCiCompetitorSchema = createInsertSchema(ciCompetitors).omit({ id: true, createdAt: true });
export type InsertCiCompetitor = z.infer<typeof insertCiCompetitorSchema>;
export type CiCompetitor = typeof ciCompetitors.$inferSelect;

export const ciScrapedVideos = pgTable("ci_scraped_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitorId: varchar("competitor_id").notNull().references(() => ciCompetitors.id, { onDelete: "cascade" }),
  externalVideoId: text("external_video_id").notNull().unique(),
  url: text("url").notNull(),
  caption: text("caption"),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  duration: integer("duration"),
  postedAt: text("posted_at"),
  transcript: text("transcript"),
  transcriptStatus: text("transcript_status").notNull().default("pending"),
  analysisStatus: text("analysis_status").notNull().default("pending"),
  briefStatus: text("brief_status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  scrapedAt: text("scraped_at").notNull().default(sql`now()`),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertCiScrapedVideoSchema = createInsertSchema(ciScrapedVideos).omit({ id: true, createdAt: true, scrapedAt: true });
export type InsertCiScrapedVideo = z.infer<typeof insertCiScrapedVideoSchema>;
export type CiScrapedVideo = typeof ciScrapedVideos.$inferSelect;

export const ciVideoAnalyses = pgTable("ci_video_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scrapedVideoId: varchar("scraped_video_id").notNull().references(() => ciScrapedVideos.id, { onDelete: "cascade" }),
  blocked: boolean("blocked").default(false),
  blockReason: text("block_reason"),
  topicCategory: text("topic_category"),
  topicSummary: text("topic_summary"),
  hookText: text("hook_text"),
  hookType: text("hook_type"),
  hookSummary: text("hook_summary"),
  emotionalAngle: text("emotional_angle"),
  targetAudience: text("target_audience"),
  format: text("format"),
  ctaType: text("cta_type"),
  replicationScore: integer("replication_score"),
  notes: text("notes"),
  rawAnalysis: jsonb("raw_analysis"),
  weekAdded: text("week_added"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertCiVideoAnalysisSchema = createInsertSchema(ciVideoAnalyses).omit({ id: true, createdAt: true });
export type InsertCiVideoAnalysis = z.infer<typeof insertCiVideoAnalysisSchema>;
export type CiVideoAnalysis = typeof ciVideoAnalyses.$inferSelect;

export const ciContentBriefs = pgTable("ci_content_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekLabel: text("week_label").notNull(),
  briefData: jsonb("brief_data").notNull(),
  topTopics: jsonb("top_topics"),
  topHookTypes: jsonb("top_hook_types"),
  topEmotionalAngles: jsonb("top_emotional_angles"),
  videoCount: integer("video_count").default(0),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertCiContentBriefSchema = createInsertSchema(ciContentBriefs).omit({ id: true, createdAt: true });
export type InsertCiContentBrief = z.infer<typeof insertCiContentBriefSchema>;
export type CiContentBrief = typeof ciContentBriefs.$inferSelect;

export const ciBriefScripts = pgTable("ci_brief_scripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefId: varchar("brief_id").notNull().references(() => ciContentBriefs.id, { onDelete: "cascade" }),
  briefItemIndex: integer("brief_item_index"),
  title: text("title").notNull(),
  hook: text("hook"),
  body: text("body"),
  closeCta: text("close_cta"),
  creatorName: text("creator_name"),
  creatorStyle: text("creator_style"),
  platform: text("platform"),
  duration: text("duration"),
  rawScript: jsonb("raw_script"),
  status: text("status").notNull().default("draft"),
  videoRequestId: varchar("video_request_id"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertCiBriefScriptSchema = createInsertSchema(ciBriefScripts).omit({ id: true, createdAt: true });
export type InsertCiBriefScript = z.infer<typeof insertCiBriefScriptSchema>;
export type CiBriefScript = typeof ciBriefScripts.$inferSelect;

export const ciPerformanceReports = pgTable("ci_performance_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekLabel: text("week_label").notNull(),
  ownVideosData: jsonb("own_videos_data"),
  matchingBriefs: jsonb("matching_briefs"),
  topPerformingTopics: jsonb("top_performing_topics"),
  topPerformingHookTypes: jsonb("top_performing_hook_types"),
  underperformingTopics: jsonb("underperforming_topics"),
  patterns: text("patterns"),
  recommendation: text("recommendation"),
  rawReport: jsonb("raw_report"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertCiPerformanceReportSchema = createInsertSchema(ciPerformanceReports).omit({ id: true, createdAt: true });
export type InsertCiPerformanceReport = z.infer<typeof insertCiPerformanceReportSchema>;
export type CiPerformanceReport = typeof ciPerformanceReports.$inferSelect;

export const ciSettings = pgTable("ci_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull().default("general"),
  label: text("label"),
  description: text("description"),
  valueType: text("value_type").notNull().default("text"),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const insertCiSettingSchema = createInsertSchema(ciSettings).omit({ id: true, updatedAt: true });
export type InsertCiSetting = z.infer<typeof insertCiSettingSchema>;
export type CiSetting = typeof ciSettings.$inferSelect;
