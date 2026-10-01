import type { LawArticle, LawDocument } from "./types";

/**
 * Deterministic statute search. Korean is indexed as Hangul character
 * bigrams (robust to spacing and particles), English as stemmed words.
 * Uzbek queries are bridged with a small glossary of immigration terms,
 * because the corpus exists only in Korean and English.
 */

export type ArticlePair = {
  number: string;
  ko?: LawArticle;
  en?: LawArticle;
};

export type LawHit = ArticlePair & {
  score: number;
  /** Why the article matched: an explicit article reference or term overlap. */
  match: "reference" | "terms";
  matchedTerms: string[];
};

export type LawIndex = {
  articles: ArticlePair[];
  documents: { ko?: LawDocument; en?: LawDocument };
  search: (query: string, limit?: number) => LawHit[];
};

// Uzbek (Latin) immigration vocabulary → English and Korean search terms.
// Keys are stems: a query word matches when it starts with the key.
const UZ_GLOSSARY: Record<string, string[]> = {
  uzaytir: ["extend", "extension", "연장"],
  "muddat": ["period", "기간"],
  "viza": ["visa", "status", "사증", "체류자격"],
  "yashash": ["stay", "sojourn", "체류"],
  "turish": ["stay", "체류"],
  "jarima": ["fine", "penalty", "과태료", "벌금"],
  "jazo": ["penalty", "punish", "벌칙", "처벌"],
  "ro'yxat": ["registration", "등록"],
  "royxat": ["registration", "등록"],
  "id karta": ["registration certificate", "외국인등록증"],
  "karta": ["registration certificate", "외국인등록증"],
  "ish": ["employment", "employ", "취업", "고용"],
  "ishla": ["employment", "work", "취업", "활동"],
  "chiqarib": ["deport", "deportation", "강제퇴거"],
  "deport": ["deport", "deportation", "강제퇴거"],
  "chet": ["alien", "외국인"],
  "xorijiy": ["alien", "외국인"],
  "talaba": ["student", "study", "유학"],
  "o'qish": ["study", "유학"],
  "manzil": ["residence", "address", "체류지"],
  "yashash joy": ["residence", "체류지"],
  "o'zgartir": ["change", "변경"],
  "ozgartir": ["change", "변경"],
  "pasport": ["passport", "여권"],
  "kirish": ["entry", "입국"],
  "chiqish": ["departure", "출국"],
  "taqiq": ["prohibit", "prohibition", "금지"],
  "ruxsat": ["permission", "permit", "허가"],
  "qamoq": ["protection", "detention", "보호"],
  "nikoh": ["marriage", "결혼"],
  "qochoq": ["refugee", "난민"],
  "to'lov": ["fee", "수수료"],
  "tolov": ["fee", "수수료"],
  "ariza": ["application", "apply", "신청"],
  "hujjat": ["document", "서류"],
};

const EN_STOPWORDS = new Set(
  "the a an of to in on for and or by with from as at be is are shall any such that this which who whom his her their its may not under other than into upon been has have was were per".split(
    " ",
  ),
);

function stemEn(word: string): string {
  return word
    .replace(/(?:ations?|ions?)$/, "")
    .replace(/(?:ing|ed|es|s)$/, "")
    .replace(/(?:al|ly)$/, "");
}

function hangulBigrams(text: string): string[] {
  const out: string[] = [];
  for (const run of text.match(/[가-힣]+/g) ?? []) {
    for (let i = 0; i + 1 < run.length; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

function englishTerms(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+/g) ?? [])
    .filter((w) => w.length > 2 && !EN_STOPWORDS.has(w))
    .map(stemEn)
    .filter((w) => w.length > 2);
}

function tokenize(text: string): string[] {
  return [...hangulBigrams(text), ...englishTerms(text)];
}

/** Turns an Uzbek query into extra English/Korean terms. */
export function expandUzbek(query: string): string[] {
  const q = query.toLowerCase().replace(/[‘’ʻʼ`]/g, "'");
  const words = q.split(/[^a-z'‘’ʻʼ]+/).filter(Boolean);
  const extra: string[] = [];
  for (const [key, terms] of Object.entries(UZ_GLOSSARY)) {
    const hit = key.includes(" ") ? q.includes(key) : words.some((w) => w.startsWith(key));
    if (hit) extra.push(...terms);
  }
  return extra;
}

/** Explicit references: 제25조, 제25조의2, Article 25-2, 25-modda. */
const REFERENCE_PATTERNS = [/제\s*(\d+)\s*조(?:\s*의\s*(\d+))?/g, /article\s+(\d+)(?:-(\d+))?/gi, /(\d+)(?:-(\d+))?\s*-?\s*modda/gi];

function stripReferences(query: string): string {
  return REFERENCE_PATTERNS.reduce((q, re) => q.replace(re, " "), query);
}

export function parseArticleReferences(query: string): string[] {
  const refs: string[] = [];
  for (const m of query.matchAll(/제\s*(\d+)\s*조(?:\s*의\s*(\d+))?/g)) refs.push(m[2] ? `${m[1]}-${m[2]}` : m[1]!);
  for (const m of query.matchAll(/article\s+(\d+)(?:-(\d+))?/gi)) refs.push(m[2] ? `${m[1]}-${m[2]}` : m[1]!);
  for (const m of query.matchAll(/(\d+)(?:-(\d+))?\s*-?\s*modda/gi)) refs.push(m[2] ? `${m[1]}-${m[2]}` : m[1]!);
  return [...new Set(refs)];
}

type Indexed = { pair: ArticlePair; tf: Map<string, number>; titleTerms: Set<string>; length: number };

export function buildLawIndex(documents: { ko?: LawDocument; en?: LawDocument }): LawIndex {
  const byNumber = new Map<string, ArticlePair>();
  for (const lang of ["ko", "en"] as const) {
    for (const article of documents[lang]?.articles ?? []) {
      const pair = byNumber.get(article.number) ?? { number: article.number };
      pair[lang] = article;
      byNumber.set(article.number, pair);
    }
  }
  const articles = [...byNumber.values()];

  const indexed: Indexed[] = articles
    .filter((pair) => !(pair.ko?.deleted ?? pair.en?.deleted))
    .map((pair) => {
      const terms = tokenize([pair.ko?.title, pair.ko?.text, pair.en?.title, pair.en?.text].join(" "));
      const tf = new Map<string, number>();
      for (const term of terms) tf.set(term, (tf.get(term) ?? 0) + 1);
      return {
        pair,
        tf,
        titleTerms: new Set(tokenize(`${pair.ko?.title ?? ""} ${pair.en?.title ?? ""}`)),
        length: terms.length,
      };
    });

  const df = new Map<string, number>();
  for (const doc of indexed) for (const term of doc.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  const avgLength = indexed.reduce((sum, d) => sum + d.length, 0) / Math.max(indexed.length, 1);
  const n = indexed.length;

  function search(query: string, limit = 10): LawHit[] {
    const hits: LawHit[] = [];
    const references = parseArticleReferences(query);
    for (const ref of references) {
      const pair = byNumber.get(ref);
      if (pair) hits.push({ ...pair, score: Number.POSITIVE_INFINITY, match: "reference", matchedTerms: [] });
    }

    const rest = stripReferences(query);
    const queryTerms = [...new Set([...tokenize(rest), ...tokenize(expandUzbek(rest).join(" "))])].filter((t) =>
      df.has(t),
    );
    const compactQuery = query.replace(/\s+/g, "").toLowerCase();
    const titleBoost = (pair: ArticlePair) => {
      const titles = [pair.ko?.title, pair.en?.title].map((t) => (t ?? "").replace(/\s+/g, "").toLowerCase());
      if (titles.some((t) => t && t === compactQuery)) return 2;
      if (titles.some((t) => t && compactQuery.length > 1 && t.includes(compactQuery))) return 1.2;
      return 1;
    };

    if (queryTerms.length > 0) {
      const k1 = 1.2;
      const b = 0.75;
      const scored = indexed
        .map((doc) => {
          let score = 0;
          const matched: string[] = [];
          for (const term of queryTerms) {
            const f = doc.tf.get(term);
            if (!f) continue;
            matched.push(term);
            const idf = Math.log(1 + (n - df.get(term)! + 0.5) / (df.get(term)! + 0.5));
            const tfNorm = (f * (k1 + 1)) / (f + k1 * (1 - b + (b * doc.length) / avgLength));
            score += idf * tfNorm * (doc.titleTerms.has(term) ? 2.5 : 1);
          }
          // Reward articles that cover more of the query, not just one frequent word.
          score *= (0.5 + matched.length / queryTerms.length) * titleBoost(doc.pair);
          return { doc, score, matched };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score || compareNumbers(a.doc.pair.number, b.doc.pair.number));

      for (const s of scored) {
        if (hits.some((h) => h.number === s.doc.pair.number)) continue;
        hits.push({ ...s.doc.pair, score: s.score, match: "terms", matchedTerms: s.matched });
      }
    }

    return hits.slice(0, limit);
  }

  return { articles, documents, search };
}

function compareNumbers(a: string, b: string): number {
  const [a1, a2 = 0] = a.split("-").map(Number);
  const [b1, b2 = 0] = b.split("-").map(Number);
  return a1! - b1! || a2 - b2;
}

/** A short excerpt around the first matching term, for result lists. */
export function excerpt(text: string, terms: string[], length = 220): string {
  const lower = text.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  const start = Math.max(0, at === -1 ? 0 : at - Math.min(60, Math.floor(length / 3)));
  const slice = text.slice(start, start + length).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + slice + (start + length < text.length ? "…" : "");
}
