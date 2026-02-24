import cron from "node-cron";
import { storage } from "./storage";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getHoroscopePeriod(type: string, date?: Date): { start: string; end: string; label: string } {
  const d = date || new Date();
  const formatDate = (dt: Date) => dt.toISOString().split('T')[0];

  if (type === "daily") {
    const dateStr = formatDate(d);
    return { start: dateStr, end: dateStr, label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) };
  } else if (type === "weekly") {
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: formatDate(monday),
      end: formatDate(sunday),
      label: `week beginning ${monday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`
    };
  } else {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay),
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }
}

async function generateHoroscopeContent(
  sign: string,
  type: string,
  language: string,
  periodLabel: string,
  promptTemplate: string,
  aiModel: string
): Promise<string> {
  const languageInstruction = language === "es"
    ? "Write the horoscope entirely in Spanish."
    : "Write the horoscope in English.";

  const typeLabel = type === "daily" ? "daily" : type === "weekly" ? "weekly" : "monthly";
  const fullPrompt = `${promptTemplate}

Zodiac Sign: ${sign}
Horoscope Type: ${typeLabel}
Period: ${periodLabel}
${languageInstruction}

Generate ONLY the horoscope text content for ${sign}. No title, no sign name, no labels — just the horoscope paragraph(s). Keep it engaging, personal, and specific to ${sign}'s traits.`;

  if (aiModel === "gpt") {
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: fullPrompt }],
      max_tokens: type === "daily" ? 300 : type === "weekly" ? 600 : 1000,
      temperature: 0.85,
    });
    return response.choices[0]?.message?.content?.trim() || "";
  } else {
    const anthropic = new Anthropic({
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: type === "daily" ? 300 : type === "weekly" ? 600 : 1000,
      messages: [{ role: "user", content: fullPrompt }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text.trim() : "";
  }
}

async function runHoroscopeGeneration(type: string) {
  const languages = ["en", "es"];

  for (const lang of languages) {
    try {
      const prompt = await storage.getHoroscopePromptByTypeAndLanguage(type, lang);
      if (!prompt) {
        console.log(`[Horoscope Cron] No active prompt for ${type}/${lang}, skipping`);
        continue;
      }

      const period = getHoroscopePeriod(type);
      const existing = await storage.getHoroscopeEntriesByPeriod(type, lang, period.start);
      if (existing.length > 0) {
        console.log(`[Horoscope Cron] ${type}/${lang} already generated for ${period.start}, skipping`);
        continue;
      }

      console.log(`[Horoscope Cron] Generating ${type} horoscopes in ${lang} for ${period.label}...`);

      for (const sign of ZODIAC_SIGNS) {
        const content = await generateHoroscopeContent(
          sign, type, lang, period.label, prompt.prompt, prompt.aiModel || "claude"
        );

        await storage.createHoroscopeEntry({
          type,
          language: lang,
          sign,
          content,
          periodStart: period.start,
          periodEnd: period.end,
          status: "published",
        });
        console.log(`[Horoscope Cron] Generated ${sign} (${type}/${lang})`);
      }

      console.log(`[Horoscope Cron] Completed ${type}/${lang}`);
    } catch (error) {
      console.error(`[Horoscope Cron] Error generating ${type}/${lang}:`, error);
    }
  }
}

export function startHoroscopeCrons() {
  console.log("[Horoscope Cron] Initializing cron jobs...");

  cron.schedule("0 5 * * *", () => {
    console.log("[Horoscope Cron] Running daily horoscope generation...");
    runHoroscopeGeneration("daily");
  }, { timezone: "America/New_York" });

  cron.schedule("0 5 * * 1", () => {
    console.log("[Horoscope Cron] Running weekly horoscope generation...");
    runHoroscopeGeneration("weekly");
  }, { timezone: "America/New_York" });

  cron.schedule("0 5 1 * *", () => {
    console.log("[Horoscope Cron] Running monthly horoscope generation...");
    runHoroscopeGeneration("monthly");
  }, { timezone: "America/New_York" });

  console.log("[Horoscope Cron] Cron jobs scheduled:");
  console.log("  - Daily: Every day at 5:00 AM ET");
  console.log("  - Weekly: Every Monday at 5:00 AM ET");
  console.log("  - Monthly: 1st of each month at 5:00 AM ET");
}
