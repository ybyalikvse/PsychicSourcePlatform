import { storage } from "../storage";
import { generateScript } from "./vsp-openai";
import { generateCaption } from "./vsp-openai";
import type { CampaignTemplateType, ContentProject, InsertContentProject } from "../../shared/schema";

interface BulkGenerationOptions {
  campaignId: string;
  templateId?: string;
  startDate: string;
  endDate: string;
  generationType: 'scripts' | 'captions' | 'videos' | 'all';
}

interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  currentStep: string;
  percentage: number;
}

export class BulkContentGenerator {
  private progressCallback?: (progress: GenerationProgress) => void;

  constructor(progressCallback?: (progress: GenerationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  /**
   * Generate content from a campaign template
   */
  async generateFromTemplate(templateId: string, campaignId: string, startDate: string): Promise<ContentProject[]> {
    const template = await storage.getCampaignTemplate(templateId);
    if (!template) {
      throw new Error('Campaign template not found');
    }

    // Calculate content schedule based on template
    const schedule = this.calculateContentSchedule(template, startDate);

    // Generate content for each scheduled date
    const generatedContent: ContentProject[] = [];
    let completed = 0;

    for (const item of schedule) {
      try {
        this.updateProgress(completed, schedule.length, `Generating content for ${item.subtopic}`);

        // Create base project
        const project = await storage.createContentProject({
          category: template.category,
          subtopic: item.subtopic,
          status: 'draft'
        });

        // Update with campaign and schedule info
        const updatedProject = await storage.updateContentProject(project.id, {
          campaignId: campaignId,
          scheduledDate: item.date,
          priority: item.priority || 'medium'
        });

        if (updatedProject) {
          generatedContent.push(updatedProject);
        }

        completed++;
        this.updateProgress(completed, schedule.length, `Generated content for ${item.subtopic}`);

      } catch (error) {
        console.error(`Failed to generate content for ${item.subtopic}:`, error);
        completed++;
        this.updateProgress(completed, schedule.length, `Failed: ${item.subtopic}`);
      }
    }

    return generatedContent;
  }

  /**
   * Bulk generate scripts for a campaign
   */
  async bulkGenerateScripts(campaignId: string, options?: { style?: string; length?: string }): Promise<ContentProject[]> {
    // Get all draft projects in the campaign
    const allProjects = await storage.getContentProjects();
    const campaignProjects = allProjects.filter(p =>
      p.campaignId === campaignId &&
      p.status === 'draft' &&
      !p.script
    );

    const results: ContentProject[] = [];
    let completed = 0;

    // Get script style (default to 'emotional-hook' if not specified)
    const scriptStyleId = options?.style || 'emotional-hook';
    const scriptStyle = await storage.getScriptStyle(scriptStyleId);
    if (!scriptStyle) {
      throw new Error(`Script style '${scriptStyleId}' not found`);
    }

    const length = options?.length || '30s';

    for (const project of campaignProjects) {
      try {
        this.updateProgress(completed, campaignProjects.length, `Generating script for ${project.subtopic}`);

        // Fetch subtopic to get its description
        const subtopicData = await storage.getContentSubtopic(project.subtopic);
        const subtopicForAI = subtopicData?.description || project.subtopic;

        // Generate script with template
        const script = await generateScript(
          project.category,
          subtopicForAI,
          scriptStyle.promptTemplate,
          length
        );

        // Update project with script
        const updatedProject = await storage.updateContentProject(project.id, {
          script,
          status: 'script_generated'
        });

        if (updatedProject) {
          results.push(updatedProject);
        }

        completed++;
        await this.delay(1000); // Rate limiting

      } catch (error) {
        console.error(`Failed to generate script for ${project.subtopic}:`, error);
        completed++;
      }
    }

    this.updateProgress(completed, campaignProjects.length, 'Script generation completed');
    return results;
  }

  /**
   * Bulk generate captions for a campaign
   */
  async bulkGenerateCaptions(campaignId: string, options?: { style?: string; hashtagCount?: number }): Promise<ContentProject[]> {
    const allProjects = await storage.getContentProjects();
    const campaignProjects = allProjects.filter(p =>
      p.campaignId === campaignId &&
      p.script &&
      !p.caption
    );

    const results: ContentProject[] = [];
    let completed = 0;

    // Get caption style (default to 'conversational' if not specified)
    const captionStyleId = options?.style || 'conversational';
    const captionStyle = await storage.getCaptionStyle(captionStyleId);
    if (!captionStyle) {
      throw new Error(`Caption style '${captionStyleId}' not found`);
    }

    const hashtagCount = options?.hashtagCount || 10;

    for (const project of campaignProjects) {
      try {
        this.updateProgress(completed, campaignProjects.length, `Generating caption for ${project.subtopic}`);

        if (!project.script) continue;

        // Fetch subtopic to get its description
        const subtopicData = await storage.getContentSubtopic(project.subtopic);
        const subtopicForAI = subtopicData?.description || project.subtopic;

        // Replace placeholders in the promptTemplate with actual values
        // Use replacement function to prevent $ characters from being treated as backreferences
        const processedTemplate = captionStyle.promptTemplate
          .replace(/{subtopic}/g, () => subtopicForAI)
          .replace(/{category}/g, () => project.category)
          .replace(/{script}/g, () => project.script!.content) // Already checked for null in loop
          .replace(/{hashtagCount}/g, () => hashtagCount.toString());

        // Generate caption with processed template
        const caption = await generateCaption(processedTemplate);

        // Update project with caption
        const updatedProject = await storage.updateContentProject(project.id, {
          caption,
          status: 'caption_generated'
        });

        if (updatedProject) {
          results.push(updatedProject);
        }

        completed++;
        await this.delay(1000); // Rate limiting

      } catch (error) {
        console.error(`Failed to generate caption for ${project.subtopic}:`, error);
        completed++;
      }
    }

    this.updateProgress(completed, campaignProjects.length, 'Caption generation completed');
    return results;
  }

  /**
   * Generate custom campaign from user-defined template
   */
  async generateCustomCampaign(
    campaignId: string,
    customTemplate: any,
    startDate: string,
    options: {
      generateScripts: boolean;
      generateCaptions: boolean;
      scriptStyle?: string;
      scriptLength?: string;
    }
  ): Promise<ContentProject[]> {
    const start = new Date(startDate);
    const projects: ContentProject[] = [];

    // Calculate total posts needed based on duration and frequency
    const postsPerWeek = customTemplate.contentFrequency || 3;
    const totalPosts = Math.ceil((customTemplate.duration / 7) * postsPerWeek);

    // Generate content projects based on total posts needed, cycling through subtopics
    const daysOfWeek = customTemplate.schedulingPattern?.daysOfWeek || [1, 3, 5]; // Default: Mon, Wed, Fri
    const subtopics = customTemplate.subtopics || [];

    if (subtopics.length === 0) {
      throw new Error('No subtopics provided for campaign generation');
    }

    for (let i = 0; i < totalPosts; i++) {
      // Cycle through subtopics if we need more posts than subtopics
      const subtopic = subtopics[i % subtopics.length];

      // Distribute content evenly across days and weeks
      const dayIndexInPattern = i % daysOfWeek.length;
      const weekOffset = Math.floor(i / daysOfWeek.length);
      const targetDayOfWeek = daysOfWeek[dayIndexInPattern];

      // Calculate scheduled date with proper distribution
      const scheduledDate = new Date(start);
      const daysUntilTarget = (targetDayOfWeek - scheduledDate.getDay() + 7) % 7;
      scheduledDate.setDate(scheduledDate.getDate() + daysUntilTarget + weekOffset * 7);

      const project = await storage.createContentProject({
        category: customTemplate.category || 'Custom',
        subtopic: subtopic,
        status: 'draft'
      });

      // Update with campaign and schedule info
      const updatedProject = await storage.updateContentProject(project.id, {
        campaignId: campaignId,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        priority: i < 3 ? 'high' : 'medium'
      });

      if (updatedProject) {
        projects.push(updatedProject);
      }

    }

    // Generate content for all projects
    if (options.generateScripts) {
      await this.bulkGenerateScripts(campaignId, {
        style: options.scriptStyle || 'emotional-hook',
        length: options.scriptLength || '30s'
      });
    }

    if (options.generateCaptions) {
      await this.bulkGenerateCaptions(campaignId);
    }

    return projects;
  }

  /**
   * Generate complete campaign from template
   */
  async generateCompleteCampaign(
    templateId: string,
    campaignId: string,
    startDate: string,
    options: {
      generateScripts: boolean;
      generateCaptions: boolean;
      scriptStyle?: string;
      scriptLength?: string;
    }
  ): Promise<ContentProject[]> {
    // Step 1: Create content calendar from template
    this.updateProgress(0, 100, 'Creating content calendar...');
    const projects = await this.generateFromTemplate(templateId, campaignId, startDate);

    if (options.generateScripts) {
      // Step 2: Generate scripts
      this.updateProgress(25, 100, 'Generating scripts...');
      await this.bulkGenerateScripts(campaignId, {
        style: options.scriptStyle,
        length: options.scriptLength
      });
    }

    if (options.generateCaptions && options.generateScripts) {
      // Step 3: Generate captions
      this.updateProgress(60, 100, 'Generating captions...');
      await this.bulkGenerateCaptions(campaignId);
    }

    this.updateProgress(100, 100, 'Campaign generation completed!');

    // Return updated projects
    const allProjects = await storage.getContentProjects();
    return allProjects.filter(p => p.campaignId === campaignId);
  }

  /**
   * Calculate content schedule based on template configuration
   */
  private calculateContentSchedule(template: CampaignTemplateType, startDate: string): Array<{
    date: string;
    subtopic: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const schedule: Array<{ date: string; subtopic: string; priority: 'high' | 'medium' | 'low' }> = [];
    const start = new Date(startDate);
    const postsPerWeek = template.contentFrequency;
    const totalPosts = Math.ceil((template.duration / 7) * postsPerWeek);

    // Distribute subtopics across the campaign duration
    const subtopics = template.subtopics;
    const subtopicsPerPost = Math.ceil(subtopics.length / totalPosts);

    // Generate posting schedule
    let currentDate = new Date(start);
    let subtopicIndex = 0;
    let postCount = 0;

    while (postCount < totalPosts && subtopicIndex < subtopics.length) {
      // Skip to next posting day based on template schedule
      if (template.schedulingPattern?.daysOfWeek) {
        while (!template.schedulingPattern.daysOfWeek.includes(currentDate.getDay())) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Add content for this date
      if (subtopicIndex < subtopics.length) {
        schedule.push({
          date: currentDate.toISOString().split('T')[0],
          subtopic: subtopics[subtopicIndex],
          priority: postCount < 3 ? 'high' : postCount < totalPosts * 0.7 ? 'medium' : 'low'
        });

        subtopicIndex++;
        postCount++;
      }

      // Move to next posting day
      if (template.schedulingPattern?.spacing === 'even') {
        const daysToAdd = Math.ceil(7 / postsPerWeek);
        currentDate.setDate(currentDate.getDate() + daysToAdd);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return schedule;
  }

  private updateProgress(completed: number, total: number, step: string) {
    if (this.progressCallback) {
      this.progressCallback({
        completed,
        total,
        failed: 0, // We'll track this separately if needed
        currentStep: step,
        percentage: Math.round((completed / total) * 100)
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-defined campaign templates for immediate use
export const DEFAULT_TEMPLATES = [
  {
    id: 'love-30day',
    name: '30-Day Love & Relationships Series',
    category: 'Love/Relationships',
    description: 'Complete relationship content covering dating, marriage, and personal growth'
  },
  {
    id: 'mental-health-21day',
    name: '21-Day Mental Health Awareness',
    category: 'Mental Health',
    description: 'Daily mental health tips and wellness practices'
  },
  {
    id: 'career-15day',
    name: '15-Day Career Growth Sprint',
    category: 'Career/Finance',
    description: 'Professional development and career advancement content'
  }
];
