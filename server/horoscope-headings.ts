// Stable, language-independent ids for horoscope section headings.
//
// The horoscope HTML is AI-generated and the <h2> heading TEXT varies by
// language (English vs Spanish), but the section ORDER is fixed per
// site + type by the prompt template. So we assign ids positionally: the
// Nth <h2> in the content gets the Nth id below. These ids let the
// consuming sites attach emojis (or any styling) per section via CSS,
// e.g. h2#atmosphere::before { content: "🌅 "; }
//
// If a prompt's section list changes, update the matching array here.

const HEADING_IDS: Record<string, Record<string, string[]>> = {
  psychicsource: {
    daily: ["atmosphere", "inner-landscape", "relationships", "work", "money", "wellbeing", "closing"],
    weekly: ["theme", "early-week", "midweek", "weekend", "relationships", "career", "finances", "growth"],
    monthly: ["theme", "early-month", "midmonth", "late-month", "relationships", "career", "finances", "wellbeing", "evolution"],
  },
  pathforward: {
    daily: ["current", "carrying", "connections", "work", "resources", "recovery", "lesson"],
    weekly: ["central-choice", "mon-tue", "wed-thu", "fri-weekend", "relationships", "professional", "spending", "deeper-work"],
    monthly: ["chapter", "opening", "turning", "closing", "relationships", "career", "finances", "body", "identity"],
  },
};

// Inject id attributes into the <h2> tags of horoscope content, in order.
// Skips any heading that already has an id, and leaves extra/unmapped
// headings untouched. Returns content unchanged when there is no mapping
// for the given site + type.
export function addHeadingIds(content: string, site: string, type: string): string {
  const ids = HEADING_IDS[site]?.[type];
  if (!ids) return content;

  let i = 0;
  return content.replace(/<h2(\s[^>]*)?>/gi, (match, attrs) => {
    if (attrs && /\bid\s*=/i.test(attrs)) {
      i += 1;
      return match;
    }
    const id = ids[i];
    i += 1;
    if (!id) return match;
    return `<h2 id="${id}"${attrs || ""}>`;
  });
}
