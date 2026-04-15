import { Router } from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { verifyAdminAuth } from "./auth-middleware";
import OpenAI from "openai";
import { uploadImageToS3, uploadImageFromUrl } from "./s3";
import { renderSlide } from "./services/social-slide-renderer";
import { publishCarouselToPostBridge, publishSingleImageToPostBridge, getSocialAccounts } from "./services/vsp-postbridge";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export function registerSocialPostsRoutes(app: Express) {
  const router = Router();

  // All social-posts endpoints are admin-only. Includes file uploads and
  // third-party publishing which should never be open to the public.
  router.use(verifyAdminAuth);

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // ============ POSTS CRUD ============

  // GET all posts with slides
  router.get("/", async (req, res) => {
    try {
      const posts = await storage.getSocialPosts();
      // Attach slides to each post
      const postsWithSlides = await Promise.all(
        posts.map(async (post) => {
          const slides = await storage.getSocialPostSlides(post.id);
          return { ...post, slides };
        })
      );
      res.json(postsWithSlides);
    } catch (error: any) {
      console.error("Error fetching social posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET single post with slides
  router.get("/:id", async (req, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      const slides = await storage.getSocialPostSlides(post.id);
      res.json({ ...post, slides });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // CREATE post with slides
  router.post("/", async (req, res) => {
    try {
      const { slides, ...postData } = req.body;
      const post = await storage.createSocialPost(postData);

      const createdSlides = [];
      if (slides && Array.isArray(slides)) {
        for (const slide of slides) {
          const created = await storage.createSocialPostSlide({
            ...slide,
            postId: post.id,
          });
          createdSlides.push(created);
        }
      }

      res.json({ ...post, slides: createdSlides });
    } catch (error: any) {
      console.error("Error creating social post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // UPDATE post with slides
  router.put("/:id", async (req, res) => {
    try {
      const { slides, ...postData } = req.body;
      const post = await storage.updateSocialPost(req.params.id, postData);
      if (!post) return res.status(404).json({ error: "Post not found" });

      // Replace slides if provided
      if (slides && Array.isArray(slides)) {
        await storage.deleteSocialPostSlidesByPostId(post.id);
        const createdSlides = [];
        for (const slide of slides) {
          const created = await storage.createSocialPostSlide({
            ...slide,
            postId: post.id,
          });
          createdSlides.push(created);
        }
        res.json({ ...post, slides: createdSlides });
      } else {
        const existingSlides = await storage.getSocialPostSlides(post.id);
        res.json({ ...post, slides: existingSlides });
      }
    } catch (error: any) {
      console.error("Error updating social post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE post
  router.delete("/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialPost(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Post not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ AI GENERATION ============

  // Generate topic suggestions
  router.post("/generate-topics", async (req, res) => {
    try {
      const { carouselTypeId, customPrompt } = req.body;

      let topicPrompt = customPrompt || "Generate 10 engaging social media post topic ideas. Return as JSON array of strings.";

      if (carouselTypeId) {
        const carouselType = await storage.getSocialCarouselType(carouselTypeId);
        if (carouselType && carouselType.topicPrompt) {
          topicPrompt = carouselType.topicPrompt
            .replace("{carousel_name}", carouselType.name)
            .replace("{carousel_description}", carouselType.description || "");
        }
      }

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: "You are a social media content strategist. Always respond with valid JSON." },
          { role: "user", content: topicPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      const topics = parsed.topics || parsed.suggestions || Object.values(parsed)[0] || [];

      res.json({ topics });
    } catch (error: any) {
      console.error("Error generating topics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate slide content + caption + hashtags
  router.post("/generate-content", async (req, res) => {
    try {
      const { topic, slideCount = 5, carouselTypeId, type = "carousel" } = req.body;

      let contentPrompt = `Create a ${type === "carousel" ? `${slideCount}-slide carousel` : "single image"} post about: "${topic}".

Return JSON with this structure:
{
  "caption": "engaging caption for the post",
  "hashtags": "#relevant #hashtags #here",
  "slides": [
    {
      "template_type": "cover",
      "title": "Main Title",
      "body_text": "Supporting text"
    },
    {
      "template_type": "content",
      "title": "Slide Title",
      "body_text": "Key point or insight"
    },
    ...
    {
      "template_type": "cta",
      "title": "Call to Action",
      "body_text": "Follow for more tips!"
    }
  ]
}

For carousel: First slide should be "cover", last should be "cta", middle slides are "content".
For single: One slide with template_type "single".
Keep text concise - titles under 8 words, body text under 25 words per slide.`;

      if (carouselTypeId) {
        const carouselType = await storage.getSocialCarouselType(carouselTypeId);
        if (carouselType && carouselType.contentPrompt) {
          contentPrompt = carouselType.contentPrompt
            .replace("{topic}", topic)
            .replace("{slide_count}", String(slideCount))
            .replace("{carousel_name}", carouselType.name)
            .replace("{carousel_description}", carouselType.description || "");
        }
      }

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: "You are an expert social media content creator. Always respond with valid JSON." },
          { role: "user", content: contentPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      res.json(parsed);
    } catch (error: any) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate background image
  router.post("/generate-image", async (req, res) => {
    try {
      const { prompt, topic, slideText, title, slideNumber, templateSetId } = req.body;

      let imagePrompt = prompt || `Beautiful, high-quality background image for a social media post about: ${topic}. No text in the image.`;

      // Apply template set's image prompt if available
      if (templateSetId) {
        const templateSet = await storage.getSocialTemplateSet(templateSetId);
        if (templateSet && templateSet.imagePromptTemplate) {
          imagePrompt = templateSet.imagePromptTemplate
            .replace("{topic}", topic || "")
            .replace("{slide_text}", slideText || "")
            .replace("{title}", title || "")
            .replace("{slide_number}", String(slideNumber || 1));
        }
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });

      const imageData = response.data?.[0]?.b64_json;
      if (!imageData) {
        return res.status(500).json({ error: "No image data returned" });
      }

      // Upload to S3
      let imageUrl: string;
      try {
        imageUrl = await uploadImageToS3(imageData, `social-bg-${Date.now()}.png`);
      } catch {
        // Fallback to base64 data URL
        imageUrl = `data:image/png;base64,${imageData}`;
      }

      // Save to media library
      await storage.createSocialMediaLibraryItem({
        url: imageUrl,
        prompt: imagePrompt,
        tags: JSON.stringify(topic ? [topic.split(" ")[0]?.toLowerCase()] : ["general"]) as any,
        source: "ai",
      });

      res.json({ imageUrl, prompt: imagePrompt });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bulk generate posts
  router.post("/bulk-generate", async (req, res) => {
    try {
      const { count = 1, type = "carousel", carouselTypeId, templateSetId, slideCount = 5 } = req.body;

      // Generate topics first
      let topicPrompt = `Generate exactly ${count} unique, engaging social media post topic ideas. Return as JSON: { "topics": ["topic1", "topic2", ...] }`;

      if (carouselTypeId) {
        const carouselType = await storage.getSocialCarouselType(carouselTypeId);
        if (carouselType && carouselType.topicPrompt) {
          topicPrompt = carouselType.topicPrompt
            .replace("{carousel_name}", carouselType.name)
            .replace("{carousel_description}", carouselType.description || "")
            + `\n\nGenerate exactly ${count} topics. Return as JSON: { "topics": ["topic1", ...] }`;
        }
      }

      const topicsResponse = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: "You are a social media content strategist. Always respond with valid JSON." },
          { role: "user", content: topicPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const topicsContent = topicsResponse.choices[0]?.message?.content || "{}";
      const topicsParsed = JSON.parse(topicsContent);
      const topics: string[] = topicsParsed.topics || [];

      const createdPosts = [];

      for (const topic of topics.slice(0, count)) {
        try {
          // Generate content for each topic
          let contentPrompt = `Create a ${type === "carousel" ? `${slideCount}-slide carousel` : "single image"} post about: "${topic}".
Return JSON: { "caption": "...", "hashtags": "...", "slides": [{ "template_type": "cover|content|cta|single", "title": "...", "body_text": "..." }] }
For carousel: first=cover, last=cta, middle=content. Keep text concise.`;

          if (carouselTypeId) {
            const carouselType = await storage.getSocialCarouselType(carouselTypeId);
            if (carouselType && carouselType.contentPrompt) {
              contentPrompt = carouselType.contentPrompt
                .replace("{topic}", topic)
                .replace("{slide_count}", String(slideCount))
                .replace("{carousel_name}", carouselType.name)
                .replace("{carousel_description}", carouselType.description || "");
            }
          }

          const contentResponse = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            messages: [
              { role: "system", content: "You are an expert social media content creator. Always respond with valid JSON." },
              { role: "user", content: contentPrompt },
            ],
            response_format: { type: "json_object" },
          });

          const content = JSON.parse(contentResponse.choices[0]?.message?.content || "{}");

          // Create the post
          const post = await storage.createSocialPost({
            type,
            platform: "both",
            topic,
            caption: content.caption || "",
            hashtags: content.hashtags || "",
            status: "draft",
            carouselTypeId: carouselTypeId || null,
            templateSetId: templateSetId || null,
            slideCount: content.slides?.length || slideCount,
          });

          // Create slides
          const slides = content.slides || [];
          for (let i = 0; i < slides.length; i++) {
            await storage.createSocialPostSlide({
              postId: post.id,
              slideOrder: i,
              templateType: slides[i].template_type || "content",
              title: slides[i].title || "",
              bodyText: slides[i].body_text || "",
            });
          }

          createdPosts.push(post);
        } catch (err: any) {
          console.error(`Error generating post for topic "${topic}":`, err.message);
        }
      }

      res.json({ posts: createdPosts, count: createdPosts.length });
    } catch (error: any) {
      console.error("Error in bulk generate:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ SLIDE RENDERING ============

  router.post("/render-slide", async (req, res) => {
    try {
      const { slideId, postId, platform = "instagram", templateSetId } = req.body;

      // Get slide data
      const slides = await storage.getSocialPostSlides(postId);
      const slide = slides.find(s => s.id === slideId);
      if (!slide) return res.status(404).json({ error: "Slide not found" });

      // Get template config
      let templateConfig: any = null;
      if (templateSetId) {
        const templates = await storage.getSocialSlideTemplates();
        const templateSet = await storage.getSocialTemplateSet(templateSetId);
        const matchingTemplate = templates.find(t =>
          t.setName === templateSet?.name && t.type === slide.templateType
        );
        if (matchingTemplate) {
          templateConfig = matchingTemplate.config;
        }
        // Pass watermark config from template set
        if (templateSet) {
          templateConfig = {
            ...templateConfig,
            watermark: templateSet.watermark,
            watermarkImage: templateSet.watermarkImage,
            watermarkPosition: templateSet.watermarkPosition,
            watermarkSize: templateSet.watermarkSize,
            watermarkOpacity: templateSet.watermarkOpacity,
            igFontScale: templateSet.igFontScale,
          };
        }
      }

      const renderedBuffer = await renderSlide({
        title: slide.title || "",
        bodyText: slide.bodyText || "",
        backgroundImageUrl: slide.backgroundImageUrl || undefined,
        platform,
        templateConfig,
      });

      // Upload rendered image to S3
      const imageUrl = await uploadImageToS3(
        renderedBuffer.toString("base64"),
        `social-slide-${postId}-${slide.slideOrder}-${platform}-${Date.now()}.png`
      );

      // Update slide with rendered image URL
      const platformUrls = (slide.platformUrls as any) || {};
      platformUrls[platform] = imageUrl;

      await storage.updateSocialPostSlide(slideId, {
        imageUrl: imageUrl,
        platformUrls: platformUrls as any,
      });

      res.json({ imageUrl, platform });
    } catch (error: any) {
      console.error("Error rendering slide:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Render all slides for a post
  router.post("/render-all", async (req, res) => {
    try {
      const { postId, platform = "instagram", templateSetId } = req.body;

      const slides = await storage.getSocialPostSlides(postId);
      if (!slides.length) return res.status(400).json({ error: "No slides found" });

      const results = [];
      // Process 2 at a time
      for (let i = 0; i < slides.length; i += 2) {
        const batch = slides.slice(i, i + 2);
        const batchResults = await Promise.all(
          batch.map(async (slide) => {
            try {
              let templateConfig: any = null;
              if (templateSetId) {
                const templates = await storage.getSocialSlideTemplates();
                const templateSet = await storage.getSocialTemplateSet(templateSetId);
                const matchingTemplate = templates.find(t =>
                  t.setName === templateSet?.name && t.type === slide.templateType
                );
                if (matchingTemplate) templateConfig = matchingTemplate.config;
                if (templateSet) {
                  templateConfig = {
                    ...templateConfig,
                    watermark: templateSet.watermark,
                    watermarkImage: templateSet.watermarkImage,
                    watermarkPosition: templateSet.watermarkPosition,
                    watermarkSize: templateSet.watermarkSize,
                    watermarkOpacity: templateSet.watermarkOpacity,
                    igFontScale: templateSet.igFontScale,
                  };
                }
              }

              const renderedBuffer = await renderSlide({
                title: slide.title || "",
                bodyText: slide.bodyText || "",
                backgroundImageUrl: slide.backgroundImageUrl || undefined,
                platform,
                templateConfig,
              });

              const imageUrl = await uploadImageToS3(
                renderedBuffer.toString("base64"),
                `social-slide-${postId}-${slide.slideOrder}-${platform}-${Date.now()}.png`
              );

              const platformUrls = (slide.platformUrls as any) || {};
              platformUrls[platform] = imageUrl;

              await storage.updateSocialPostSlide(slide.id, {
                imageUrl,
                platformUrls: platformUrls as any,
              });

              return { slideId: slide.id, imageUrl, success: true };
            } catch (err: any) {
              return { slideId: slide.id, error: err.message, success: false };
            }
          })
        );
        results.push(...batchResults);
      }

      res.json({ results });
    } catch (error: any) {
      console.error("Error rendering all slides:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ PUBLISHING ============

  router.post("/publish", async (req, res) => {
    try {
      const { postId, socialAccountIds, scheduledAt } = req.body;

      const post = await storage.getSocialPost(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const slides = await storage.getSocialPostSlides(postId);
      if (!slides.length) return res.status(400).json({ error: "No slides to publish" });

      // Check all slides have rendered images
      const unrendered = slides.filter(s => !s.imageUrl);
      if (unrendered.length > 0) {
        return res.status(400).json({ error: `${unrendered.length} slide(s) not yet rendered` });
      }

      await storage.updateSocialPost(postId, { status: "publishing" });

      try {
        const imageUrls = slides
          .sort((a, b) => a.slideOrder - b.slideOrder)
          .map(s => s.imageUrl!)
          .filter(Boolean);

        const caption = `${post.caption || ""}\n\n${post.hashtags || ""}`.trim();

        let result;
        if (post.type === "carousel" && imageUrls.length > 1) {
          result = await publishCarouselToPostBridge({
            caption,
            imageUrls,
            socialAccountIds,
            scheduledAt,
          });
        } else {
          result = await publishSingleImageToPostBridge({
            caption,
            imageUrl: imageUrls[0],
            socialAccountIds,
            scheduledAt,
          });
        }

        await storage.updateSocialPost(postId, {
          status: "published",
          publishedAt: new Date().toISOString(),
        });

        res.json({ success: true, result });
      } catch (publishError: any) {
        console.error("[SocialPosts] Publish error:", publishError);
        await storage.updateSocialPost(postId, {
          status: "failed",
          error: publishError?.message || "Publish failed",
        });
        res.status(500).json({ error: "Failed to publish post" });
      }
    } catch (error: any) {
      console.error("Error publishing:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get connected social accounts
  router.get("/social-accounts", async (req, res) => {
    try {
      const accounts = await getSocialAccounts();
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ CAROUSEL TYPES ============

  router.get("/carousel-types", async (req, res) => {
    try {
      const types = await storage.getSocialCarouselTypes();
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/carousel-types/:id", async (req, res) => {
    try {
      const type = await storage.getSocialCarouselType(req.params.id);
      if (!type) return res.status(404).json({ error: "Carousel type not found" });
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/carousel-types", async (req, res) => {
    try {
      const type = await storage.createSocialCarouselType(req.body);
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/carousel-types/:id", async (req, res) => {
    try {
      const type = await storage.updateSocialCarouselType(req.params.id, req.body);
      if (!type) return res.status(404).json({ error: "Carousel type not found" });
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/carousel-types/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialCarouselType(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Carousel type not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ TEMPLATE SETS ============

  router.get("/templates", async (req, res) => {
    try {
      const sets = await storage.getSocialTemplateSets();
      res.json(sets);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/templates/:id", async (req, res) => {
    try {
      const set = await storage.getSocialTemplateSet(req.params.id);
      if (!set) return res.status(404).json({ error: "Template set not found" });
      // Also get slide templates for this set
      const slideTemplates = await storage.getSocialSlideTemplates(set.name);
      res.json({ ...set, slideTemplates });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/templates", async (req, res) => {
    try {
      const set = await storage.createSocialTemplateSet(req.body);
      res.json(set);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/templates/:id", async (req, res) => {
    try {
      const set = await storage.updateSocialTemplateSet(req.params.id, req.body);
      if (!set) return res.status(404).json({ error: "Template set not found" });
      res.json(set);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialTemplateSet(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Template set not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload watermark
  router.post("/templates/upload-watermark", upload.single("watermark"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const imageUrl = await uploadImageToS3(
        req.file.buffer.toString("base64"),
        `watermark-${Date.now()}.png`,
        req.file.mimetype
      );
      res.json({ url: imageUrl });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ SLIDE TEMPLATES ============

  router.get("/slide-templates", async (req, res) => {
    try {
      const setName = req.query.setName as string | undefined;
      const templates = await storage.getSocialSlideTemplates(setName);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/slide-templates", async (req, res) => {
    try {
      const template = await storage.createSocialSlideTemplate(req.body);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/slide-templates/:id", async (req, res) => {
    try {
      const template = await storage.updateSocialSlideTemplate(req.params.id, req.body);
      if (!template) return res.status(404).json({ error: "Slide template not found" });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/slide-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialSlideTemplate(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Slide template not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ MEDIA LIBRARY ============

  router.get("/media-library", async (req, res) => {
    try {
      const tag = req.query.tag as string | undefined;
      const items = await storage.getSocialMediaLibrary(tag);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/media-library", async (req, res) => {
    try {
      const item = await storage.createSocialMediaLibraryItem(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/media-library/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const imageUrl = await uploadImageToS3(
        req.file.buffer.toString("base64"),
        `media-${Date.now()}.png`,
        req.file.mimetype
      );
      const item = await storage.createSocialMediaLibraryItem({
        url: imageUrl,
        prompt: req.body.prompt || null,
        tags: req.body.tags ? JSON.parse(req.body.tags) : null,
        source: "upload",
      });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/media-library/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialMediaLibraryItem(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Media item not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ GENERATE CAPTION (refine) ============

  router.post("/generate-caption", async (req, res) => {
    try {
      const { topic, caption, hashtags, carouselTypeId } = req.body;

      let captionPrompt = `Refine this social media caption for a post about "${topic}":
Caption: ${caption}
Hashtags: ${hashtags}

Return JSON: { "caption": "refined caption", "hashtags": "refined #hashtags" }`;

      if (carouselTypeId) {
        const carouselType = await storage.getSocialCarouselType(carouselTypeId);
        if (carouselType && carouselType.captionPrompt) {
          captionPrompt = carouselType.captionPrompt
            .replace("{topic}", topic || "")
            .replace("{caption}", caption || "")
            .replace("{hashtags}", hashtags || "")
            .replace("{carousel_name}", carouselType.name)
            .replace("{carousel_description}", carouselType.description || "");
        }
      }

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: "You are an expert social media copywriter. Always respond with valid JSON." },
          { role: "user", content: captionPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mount router
  app.use("/api/social-posts", router);
}
