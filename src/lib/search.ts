import { Story, Grade, Module } from "../types";

/**
 * Calculates the Levenshtein distance between two strings for typo tolerance.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if a search token matches or is similar to a target word.
 * Supports:
 * - Exact matching
 * - Prefix matching (e.g. "kind" matches "kindness", "whisper" matches "whispering")
 * - Substring matching (e.g. "friend" in "friendship")
 * - Typo tolerance via Levenshtein distance:
 *   - 3 to 4 characters: max 1 edit (e.g. "ayan" -> "ayaan", "ali" -> "alya")
 *   - 5+ characters: max 2 edits (e.g. "ayyan" -> "ayaan", "sheikh" -> "shaikh", "dolfin" -> "dolphin")
 */
export function isWordSimilar(token: string, target: string): boolean {
  if (!token || !target) return false;
  const t = token.toLowerCase().trim();
  const w = target.toLowerCase().trim();

  if (t === w) return true;

  // Prefix & substring match (for tokens of 3+ letters)
  if (t.length >= 3 && (w.startsWith(t) || w.includes(t))) {
    return true;
  }
  if (w.length >= 3 && (t.startsWith(w) || t.includes(w))) {
    return true;
  }

  // Length difference gate: words with > 2 letter difference are not similar
  const lenDiff = Math.abs(t.length - w.length);
  if (lenDiff > 2) return false;

  // Typo distance threshold
  const maxDistance = t.length >= 5 ? 2 : (t.length >= 3 ? 1 : 0);
  if (maxDistance === 0) return false;

  return levenshteinDistance(t, w) <= maxDistance;
}

// Common user query meta words that specify search intent rather than story content
const QUERY_INTENT_META_WORDS = new Set([
  "author",
  "student",
  "writer",
  "by",
  "written",
  "story",
  "stories",
  "keyword",
  "keywords",
  "book",
  "books",
  "title",
]);

/**
 * Smart matching for stories across:
 * - Student Author (studentName)
 * - Keywords (array, comma-separated string, or hashtag tags)
 * - Story Title
 * - Module Name (e.g., Nature & Wildlife, Moral & Values)
 * - Grade / Class Name (e.g., Grade 3, Class 5)
 * - Description & Content Snippet
 * 
 * Includes typo tolerance and similar word matching.
 */
export function matchesStorySearch(
  story: Story,
  query: string,
  grades?: Grade[],
  modules?: Module[]
): boolean {
  if (!query || query.trim() === "") return true;
  if (!story) return false;

  const rawQuery = query.toLowerCase().trim();

  // Extract core story fields
  const title = String(story.title || "").toLowerCase().trim();
  const author = String(story.studentName || "").toLowerCase().trim();
  const description = String(story.description || "").toLowerCase().trim();
  const content = String(story.content || "").slice(0, 1500).toLowerCase().trim();

  // Resolve Grade & Module names + aliases
  const storyGrade = grades?.find((g) => g.id === story.gradeId);
  const gradeName = String(storyGrade ? storyGrade.name : story.gradeId || "").toLowerCase().trim();
  const gradeNum = String(story.gradeId || "").replace(/\D/g, "");
  const gradeAliases = gradeNum ? `class ${gradeNum} grade ${gradeNum} grade${gradeNum} ${gradeNum}` : "";

  const storyMod = modules?.find((m) => m.id === story.moduleId);
  const moduleName = String(storyMod ? storyMod.name : story.moduleId || "").toLowerCase().trim();

  // Resolve Keywords as a unified string
  const rawKeywords = Array.isArray(story.keywords)
    ? story.keywords.join(" ")
    : String(story.keywords || "");
  const keywordsString = rawKeywords.toLowerCase().replace(/[#,]/g, " ").trim();

  // Combined full searchable string for direct phrase/substring matching
  const fullBlob = `${title} ${author} ${keywordsString} ${moduleName} ${gradeName} ${gradeAliases} ${description}`;

  // 1. Direct whole-query substring match (e.g., "ayaan shaikh", "whispering banyan")
  if (fullBlob.includes(rawQuery)) {
    return true;
  }

  // 2. Tokenized multi-word search with cleanup
  const cleanedQuery = rawQuery
    .replace(/['’]s\b/g, "") // remove possessive 's
    .replace(/[^\w\s]/g, " "); // normalize punctuation

  let queryTokens = cleanedQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (queryTokens.length === 0) return true;

  // If multi-word, strip meta words like "author", "student", "keyword" if other content words exist
  if (queryTokens.length > 1) {
    const nonMetaTokens = queryTokens.filter((t) => !QUERY_INTENT_META_WORDS.has(t));
    if (nonMetaTokens.length > 0) {
      queryTokens = nonMetaTokens;
    }
  }

  // If still multi-word, drop 1-char non-numeric tokens
  if (queryTokens.length > 1) {
    const significantTokens = queryTokens.filter((t) => t.length >= 2 || /^\d+$/.test(t));
    if (significantTokens.length > 0) {
      queryTokens = significantTokens;
    }
  }

  // Extract individual words from each field for word-level matching
  const titleWords = title.split(/[\s,#\-_:;.]+/).filter((w) => w.length > 0);
  const authorWords = author.split(/[\s,#\-_:;.]+/).filter((w) => w.length > 0);
  const keywordWords = keywordsString.split(/[\s,#\-_:;.]+/).filter((w) => w.length > 0);
  const moduleWords = moduleName.split(/[\s,#\-_:;&]+/).filter((w) => w.length > 0);
  const gradeWords = `${gradeName} ${gradeAliases}`.split(/[\s,#\-_:;.]+/).filter((w) => w.length > 0);
  const descWords = description.split(/[\s,#\-_:;.]+/).filter((w) => w.length > 0).slice(0, 40);

  const allWords = [
    ...titleWords,
    ...authorWords,
    ...keywordWords,
    ...moduleWords,
    ...gradeWords,
    ...descWords,
  ];

  // Every query token must find a match or similarity in at least one field
  const allTokensMatch = queryTokens.every((token) => {
    // Substring match in full text
    if (fullBlob.includes(token)) return true;

    // Word similarity match (stemming, prefix, or typo tolerance)
    return allWords.some((word) => isWordSimilar(token, word));
  });

  if (allTokensMatch) {
    return true;
  }

  // 3. Fallback: Story Content match
  if (content.includes(rawQuery)) {
    return true;
  }

  return false;
}
