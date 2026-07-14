// Canonical section headings and ids for horoscope content.
//
// The horoscope HTML is AI-generated, so heading text drifts (extra words,
// Spanish translation variants, different capitalization) and the model
// occasionally writes the first section as an unlabeled intro paragraph.
// Ids used to be assigned positionally (Nth <h2> gets Nth id), which put
// every id after a skipped heading on the wrong section. Instead, each
// <h2> is recognized by keywords, rewritten to the canonical heading text,
// and given the canonical id, so every sign ships the exact same headings.
// The consuming sites rely on the ids for per-section styling, e.g.
// h2#atmosphere::before { content: "🌅 "; }.
//
// If a prompt's section list changes, update the matching array here.

type Section = {
  id: string;
  // Canonical heading text per language; en is the fallback.
  text: Record<string, string>;
  // Tested against the lowercased, accent-stripped heading text.
  match: RegExp;
};

const SECTIONS: Record<string, Record<string, Section[]>> = {
  psychicsource: {
    daily: [
      { id: "atmosphere", text: { en: "Today's Atmosphere", es: "El Ambiente de Hoy" }, match: /atmosphere|atmosfera|ambiente/ },
      { id: "inner-landscape", text: { en: "Your Inner Landscape", es: "Tu Paisaje Interior" }, match: /inner landscape|paisaje interior/ },
      { id: "relationships", text: { en: "Relationships", es: "Relaciones" }, match: /relationship|relacion/ },
      { id: "work", text: { en: "Work and Direction", es: "Trabajo y Dirección" }, match: /work|trabajo/ },
      { id: "money", text: { en: "Money and Choices", es: "Dinero y Decisiones" }, match: /money|dinero/ },
      { id: "wellbeing", text: { en: "Wellbeing", es: "Bienestar" }, match: /wellbeing|well-being|bienestar/ },
      { id: "closing", text: { en: "Closing Insight", es: "Reflexión Final" }, match: /closing|cierre|reflexion|perspectiva|pensamiento final/ },
    ],
    weekly: [
      { id: "theme", text: { en: "The Theme of the Week", es: "El Tema de la Semana" }, match: /theme|tema/ },
      { id: "early-week", text: { en: "Early Week Energy", es: "Energía de Inicio de Semana" }, match: /early week|inicio de semana|principios de semana|comienzo de semana/ },
      { id: "midweek", text: { en: "Midweek Shift", es: "Cambio de Mitad de Semana" }, match: /midweek|mitad de semana|medio de semana/ },
      { id: "weekend", text: { en: "Weekend Integration", es: "Integración del Fin de Semana" }, match: /weekend|fin de semana/ },
      { id: "relationships", text: { en: "Relationships", es: "Relaciones" }, match: /relationship|relacion/ },
      { id: "career", text: { en: "Career and Ambition", es: "Carrera y Ambición" }, match: /career|carrera/ },
      { id: "finances", text: { en: "Financial Awareness", es: "Conciencia Financiera" }, match: /financ/ },
      { id: "growth", text: { en: "Personal Growth", es: "Crecimiento Personal" }, match: /growth|crecimiento/ },
    ],
    monthly: [
      { id: "theme", text: { en: "The Central Theme of the Month", es: "El Tema Central del Mes" }, match: /central theme|tema central/ },
      { id: "early-month", text: { en: "Early Month Atmosphere", es: "Atmósfera de Principios de Mes" }, match: /early month|principios de mes|comienzo de mes/ },
      { id: "midmonth", text: { en: "Midmonth Turning Point", es: "Punto de Inflexión a Mediados de Mes" }, match: /midmonth|mid-month|mediados de mes|mitad de mes/ },
      { id: "late-month", text: { en: "Late Month Integration", es: "Integración de Finales de Mes" }, match: /late month|finales de mes|fin de mes|final de mes/ },
      { id: "relationships", text: { en: "Relationships", es: "Relaciones" }, match: /relationship|relacion/ },
      { id: "career", text: { en: "Career and Long-Term Direction", es: "Carrera y Dirección a Largo Plazo" }, match: /career|carrera/ },
      { id: "finances", text: { en: "Financial Mindset", es: "Mentalidad Financiera" }, match: /financ|mentalidad/ },
      { id: "wellbeing", text: { en: "Emotional and Physical Wellbeing", es: "Bienestar Emocional y Físico" }, match: /wellbeing|bienestar/ },
      { id: "evolution", text: { en: "Personal Evolution", es: "Evolución Personal" }, match: /evolution|evolucion/ },
    ],
  },
  pathforward: {
    daily: [
      { id: "current", text: { en: "Today's Current" }, match: /current/ },
      { id: "carrying", text: { en: "What You're Carrying" }, match: /carrying/ },
      { id: "connections", text: { en: "Closest Connections" }, match: /connection/ },
      { id: "work", text: { en: "The Work in Front of You" }, match: /work/ },
      { id: "resources", text: { en: "Resources and Restraint" }, match: /resource|restraint/ },
      { id: "recovery", text: { en: "Recovery" }, match: /recovery/ },
      { id: "lesson", text: { en: "The Day's Quiet Lesson" }, match: /lesson/ },
    ],
    weekly: [
      { id: "central-choice", text: { en: "The Week's Central Choice" }, match: /central choice/ },
      { id: "mon-tue", text: { en: "Monday to Tuesday" }, match: /monday/ },
      { id: "wed-thu", text: { en: "Wednesday to Thursday" }, match: /wednesday/ },
      { id: "fri-weekend", text: { en: "Friday to Weekend" }, match: /friday/ },
      { id: "relationships", text: { en: "Relational Dynamics" }, match: /relational|relationship/ },
      { id: "professional", text: { en: "Professional Patterns" }, match: /professional/ },
      { id: "spending", text: { en: "Value and Spending Decisions" }, match: /spending|value/ },
      { id: "deeper-work", text: { en: "The Deeper Work" }, match: /deeper work/ },
    ],
    monthly: [
      { id: "chapter", text: { en: "The Chapter Title" }, match: /chapter/ },
      { id: "opening", text: { en: "The Opening Pages" }, match: /opening/ },
      { id: "turning", text: { en: "The Turning Scene" }, match: /turning/ },
      { id: "closing", text: { en: "The Closing Arc" }, match: /closing/ },
      { id: "relationships", text: { en: "Relationships" }, match: /relationship/ },
      { id: "career", text: { en: "Career and Legacy" }, match: /career|legacy/ },
      { id: "finances", text: { en: "Financial Self-Belief" }, match: /financ|self-belief|self belief/ },
      { id: "body", text: { en: "Body and Resilience" }, match: /body|resilience/ },
      { id: "identity", text: { en: "Identity in Motion" }, match: /identity/ },
    ],
  },
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Lowercase, straighten curly quotes, and strip accents so keyword
// regexes match all the variants the model produces.
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Rewrite the <h2> headings of horoscope content to the canonical text and
// id for each recognized section. Unrecognized headings are left untouched.
// Returns content unchanged when there is no mapping for the site + type.
export function normalizeHoroscopeHeadings(content: string, site: string, type: string, language: string): string {
  const sections = SECTIONS[site]?.[type];
  if (!sections) return content;

  const headings: { index: number; length: number }[] = [];
  const h2re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const texts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = h2re.exec(content))) {
    headings.push({ index: m.index, length: m[0].length });
    texts.push(fold(stripTags(m[1])));
  }

  // Pass 1: recognize each heading by keywords, first unclaimed section wins.
  const assigned: number[] = new Array(headings.length).fill(-1);
  const claimed = new Set<number>();
  texts.forEach((t, i) => {
    for (let s = 0; s < sections.length; s++) {
      if (!claimed.has(s) && sections[s].match.test(t)) {
        assigned[i] = s;
        claimed.add(s);
        break;
      }
    }
  });

  // Pass 2: when every section is present, fill the unrecognized headings
  // positionally from the sections left over.
  if (headings.length === sections.length) {
    const leftoverSections = sections.map((_, s) => s).filter(s => !claimed.has(s));
    const unrecognized = assigned.map((a, i) => (a === -1 ? i : -1)).filter(i => i >= 0);
    if (leftoverSections.length === unrecognized.length) {
      unrecognized.forEach((hIdx, k) => {
        assigned[hIdx] = leftoverSections[k];
        claimed.add(leftoverSections[k]);
      });
    }
  }

  const heading = (s: Section) => `<h2 id="${s.id}">${s.text[language] || s.text.en}</h2>`;

  // Once every canonical section is present, any unrecognized heading is
  // extra (e.g. the model turning the closing insight into a heading), so
  // demote it to <h3> rather than let it read as a section.
  const allClaimed = claimed.size === sections.length;

  let out = "";
  let cursor = 0;
  headings.forEach((h, i) => {
    out += content.slice(cursor, h.index);
    if (assigned[i] >= 0) {
      out += heading(sections[assigned[i]]);
    } else {
      const original = content.slice(h.index, h.index + h.length);
      out += allClaimed ? original.replace(/^<h2([^>]*)>/i, "<h3$1>").replace(/<\/h2>$/i, "</h3>") : original;
    }
    cursor = h.index + h.length;
  });
  out += content.slice(cursor);

  // The model sometimes writes the first section as an unlabeled intro.
  // If the first section is missing and real text sits before the first
  // heading, label that intro with the first section's heading.
  if (!claimed.has(0) && headings.length > 0) {
    const introEnd = out.indexOf("<h2");
    const intro = stripTags(out.slice(0, introEnd === -1 ? 0 : introEnd));
    if (intro.length >= 150) {
      out = `${heading(sections[0])}\n\n${out}`;
    }
  }

  return out;
}
