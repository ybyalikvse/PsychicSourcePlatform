import * as fs from "fs";

const INPUT_FILE = "/Users/yurybyalik/Downloads/Psychic Source Platform/production_database_export.txt";
const OUTPUT_FILE = "/tmp/production_inserts.sql";

const SKIP_TABLES = new Set(["articles", "horoscope_entries", "optimization_analyses"]);

/**
 * Parse a CSV line respecting quoted fields (which may contain commas, newlines, etc.)
 * Returns the parsed fields and whether we are still inside a quoted field (for multiline support).
 */
function parseCSVFields(
  line: string,
  carry: string | null
): { fields: string[]; partial: string | null; partialFields: string[] } {
  const fields: string[] = [];
  let current = carry !== null ? carry + "\n" + line : line;
  let i = 0;

  // If we're continuing from a carry, we're inside a quoted field
  if (carry !== null) {
    // We need to find the closing quote
    const result = consumeQuotedRemainder(current, 0);
    if (result.done) {
      fields.push(result.value);
      i = result.nextIndex;
      // Skip the comma after the closing quote if present
      if (i < current.length && current[i] === ",") {
        i++;
      }
    } else {
      // Still not closed
      return { fields: [], partial: current, partialFields: [] };
    }
  }

  while (i < current.length) {
    if (current[i] === '"') {
      // Start of quoted field
      const result = consumeQuotedField(current, i);
      if (result.done) {
        fields.push(result.value);
        i = result.nextIndex;
        // Skip comma
        if (i < current.length && current[i] === ",") {
          i++;
        }
      } else {
        // Quoted field not closed on this line - return partial
        return { fields: [], partial: current.slice(i), partialFields: fields };
      }
    } else {
      // Unquoted field - read until comma or end
      const commaIdx = current.indexOf(",", i);
      if (commaIdx === -1) {
        fields.push(current.slice(i));
        i = current.length;
      } else {
        fields.push(current.slice(i, commaIdx));
        i = commaIdx + 1;
      }
    }
  }

  // If the line ends with a comma, there's an empty trailing field
  if (current.length > 0 && current[current.length - 1] === "," && carry === null) {
    fields.push("");
  }

  return { fields, partial: null, partialFields: [] };
}

function consumeQuotedField(
  str: string,
  start: number
): { done: true; value: string; nextIndex: number } | { done: false } {
  // start points to the opening quote
  let i = start + 1;
  let value = "";

  while (i < str.length) {
    if (str[i] === '"') {
      if (i + 1 < str.length && str[i + 1] === '"') {
        // Escaped quote
        value += '"';
        i += 2;
      } else {
        // End of quoted field
        return { done: true, value, nextIndex: i + 1 };
      }
    } else {
      value += str[i];
      i++;
    }
  }

  // Reached end of string without closing quote
  return { done: false };
}

function consumeQuotedRemainder(
  str: string,
  start: number
): { done: true; value: string; nextIndex: number } | { done: false } {
  // This is for continuing a partial quoted field. The opening quote was already consumed.
  // The 'str' contains the full accumulated text (from original opening quote position).
  // We need to re-parse from position 0 treating it as a quoted field.
  return consumeQuotedField(str, start);
}

interface TableData {
  name: string;
  columns: string[];
  rows: string[][];
}

function parseFile(content: string): TableData[] {
  const lines = content.split("\n");
  const tables: TableData[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Look for table markers
    const tableMatch = line.match(/^-- TABLE: (.+)$/);
    if (!tableMatch) {
      i++;
      continue;
    }

    const tableName = tableMatch[1].trim();
    i++;

    // Check if next line is an error
    if (i < lines.length && lines[i].startsWith("Error in river service")) {
      i++;
      continue;
    }

    // Next line should be column headers
    if (i >= lines.length) break;
    const headerLine = lines[i];
    i++;

    if (!headerLine.trim()) {
      continue;
    }

    const columns = headerLine.split(",");

    // Skip tables in the skip list
    if (SKIP_TABLES.has(tableName)) {
      // Consume until next table marker or end
      while (i < lines.length && !lines[i].startsWith("-- TABLE:")) {
        i++;
      }
      continue;
    }

    // Now parse data rows (may be multiline due to quoted fields)
    const rows: string[][] = [];
    let partial: string | null = null;
    let partialFields: string[] = [];

    while (i < lines.length) {
      const dataLine = lines[i];

      // Check if we've hit the next table or end
      if (partial === null && dataLine.startsWith("-- TABLE:")) {
        break;
      }

      // Skip empty lines when not in a partial state
      if (partial === null && dataLine.trim() === "") {
        i++;
        continue;
      }

      if (partial !== null) {
        // We're continuing a multiline quoted field
        const combined = partial + "\n" + dataLine;

        // Try to parse the combined content
        const result = parseFullRow(combined);
        if (result.complete) {
          const fullFields = [...partialFields, ...result.fields];
          rows.push(fullFields);
          partial = null;
          partialFields = [];
        } else {
          partial = combined;
          if (result.partialFields.length > 0) {
            partialFields = [...partialFields, ...result.partialFields];
            partial = result.remainder;
          }
        }
        i++;
        continue;
      }

      // Try to parse as a complete row
      const result = parseFullRow(dataLine);
      if (result.complete) {
        if (result.fields.length > 0) {
          rows.push(result.fields);
        }
      } else {
        partial = result.remainder;
        partialFields = result.partialFields;
      }
      i++;
    }

    if (rows.length > 0) {
      tables.push({ name: tableName, columns, rows });
    }
  }

  return tables;
}

function parseFullRow(
  line: string
):
  | { complete: true; fields: string[] }
  | { complete: false; remainder: string; partialFields: string[] } {
  const fields: string[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      const result = consumeQuotedField(line, i);
      if (result.done) {
        fields.push(result.value);
        i = result.nextIndex;
        if (i < line.length && line[i] === ",") {
          i++;
        }
      } else {
        // Not closed - return as partial
        // The remainder starts from the opening quote
        return {
          complete: false,
          remainder: line.slice(i),
          partialFields: fields,
        };
      }
    } else {
      // Unquoted field
      const commaIdx = line.indexOf(",", i);
      if (commaIdx === -1) {
        fields.push(line.slice(i));
        i = line.length;
      } else {
        fields.push(line.slice(i, commaIdx));
        i = commaIdx + 1;
      }
    }
  }

  // Handle trailing comma
  if (line.length > 0 && line[line.length - 1] === ",") {
    fields.push("");
  }

  return { complete: true, fields };
}

// Column metadata: which columns are nullable and what their types are
// Only non-nullable text columns need empty string instead of NULL
const NON_NULLABLE_COLUMNS: Record<string, Set<string>> = {
  horoscope_prompts: new Set(["id", "type", "language", "prompt", "updated_at", "site"]),
  image_styles: new Set(["id", "name", "created_at"]),
  integrations: new Set(["id", "name", "status"]),
  keywords: new Set(["id", "keyword", "last_updated"]),
  link_table_columns: new Set(["id", "name", "order", "created_at"]),
  optimization_prompts: new Set(["id", "name", "prompt", "created_at", "prompt_type"]),
  psychics: new Set(["id", "name", "email", "status", "created_at"]),
  seo_settings: new Set(["id", "updated_at"]),
  site_urls: new Set(["id", "name", "created_at"]),
  video_captions: new Set(["id", "video_request_id", "caption", "hashtags", "platform", "created_at"]),
  video_messages: new Set(["id", "video_request_id", "sender_type", "sender_name", "message", "created_at"]),
  video_requests: new Set(["id", "title", "topic", "status", "created_at", "updated_at"]),
  writing_styles: new Set(["id", "name", "created_at"]),
};

// Integer columns that need numeric values, not quoted strings
const INTEGER_COLUMNS: Record<string, Set<string>> = {
  keywords: new Set(["volume", "difficulty", "current_position", "previous_position", "clicks", "impressions"]),
  link_table_columns: new Set(["order"]),
  seo_settings: new Set(["meta_title_max_length", "meta_description_max_length"]),
};

// Boolean columns
const BOOLEAN_COLUMNS: Record<string, Set<string>> = {
  horoscope_prompts: new Set(["is_active"]),
  image_styles: new Set(["is_default"]),
  optimization_prompts: new Set(["is_default"]),
  writing_styles: new Set(["is_default"]),
};

// JSONB columns - need to be cast
const JSONB_COLUMNS: Record<string, Set<string>> = {
  integrations: new Set(["config"]),
};

// JSON columns
const JSON_COLUMNS: Record<string, Set<string>> = {
  site_urls: new Set(["data"]),
};

function escapeSqlValue(
  value: string,
  tableName: string,
  columnName: string
): string {
  const isNonNullable = NON_NULLABLE_COLUMNS[tableName]?.has(columnName) ?? false;
  const isInteger = INTEGER_COLUMNS[tableName]?.has(columnName) ?? false;
  const isBoolean = BOOLEAN_COLUMNS[tableName]?.has(columnName) ?? false;
  const isJsonb = JSONB_COLUMNS[tableName]?.has(columnName) ?? false;
  const isJson = JSON_COLUMNS[tableName]?.has(columnName) ?? false;

  if (value === "" || value === undefined || value === null) {
    if (isNonNullable) {
      return "''"; // Empty string for non-nullable text columns
    }
    return "NULL";
  }

  if (isBoolean) {
    return value === "t" || value === "true" ? "true" : "false";
  }

  if (isInteger) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return "NULL";
    return String(num);
  }

  if (isJsonb) {
    // The value from the CSV has extra quoting - clean it up
    let jsonVal = value;
    // Remove outer quotes if the export wrapped it
    if (jsonVal.startsWith('"') && jsonVal.endsWith('"')) {
      jsonVal = jsonVal.slice(1, -1);
    }
    // Unescape inner escaped quotes
    jsonVal = jsonVal.replace(/\\"/g, '"');
    const escaped = jsonVal.replace(/'/g, "''");
    return `'${escaped}'::jsonb`;
  }

  if (isJson) {
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'::json`;
  }

  // Regular text value - escape single quotes
  const escaped = value.replace(/'/g, "''");
  return `'${escaped}'`;
}

function generateSQL(tables: TableData[]): string {
  const parts: string[] = [];

  parts.push("-- Production data import");
  parts.push("-- Generated by import-production.ts");
  parts.push("BEGIN;");
  parts.push("");

  // TRUNCATE statements first
  for (const table of tables) {
    parts.push(`TRUNCATE TABLE "${table.name}" CASCADE;`);
  }
  parts.push("");

  // INSERT statements
  for (const table of tables) {
    parts.push(`-- Data for table: ${table.name}`);
    const columnList = table.columns.map((c) => `"${c}"`).join(", ");

    for (const row of table.rows) {
      const values = [];
      for (let c = 0; c < table.columns.length; c++) {
        const val = c < row.length ? row[c] : "";
        values.push(escapeSqlValue(val, table.name, table.columns[c]));
      }
      parts.push(
        `INSERT INTO "${table.name}" (${columnList}) VALUES (${values.join(", ")});`
      );
    }
    parts.push("");
  }

  parts.push("COMMIT;");
  return parts.join("\n");
}

// Main
const content = fs.readFileSync(INPUT_FILE, "utf-8");
const tables = parseFile(content);

console.log("Tables found with data:");
for (const table of tables) {
  console.log(`  ${table.name}: ${table.rows.length} rows, ${table.columns.length} columns`);
}

const sql = generateSQL(tables);
fs.writeFileSync(OUTPUT_FILE, sql, "utf-8");

console.log(`\nSQL written to ${OUTPUT_FILE}`);
console.log(`Total lines: ${sql.split("\n").length}`);
