/**
 * Statute corpus types. Like lib/rules, this module is framework-free and
 * deterministic: search returns article text verbatim with its citation and
 * never generates legal content.
 */

export type LawLanguage = "ko" | "en";

export type LawArticle = {
  /** Article number as written in the Act, e.g. "25" or "25-2" (제25조의2). */
  number: string;
  title: string;
  chapter: string;
  text: string;
  deleted: boolean;
};

export type LawDocument = {
  id: string;
  lawId: string;
  language: LawLanguage;
  title: string;
  actNumber: string;
  /** Date this version entered into force (YYYY-MM-DD). */
  enforcementDate: string;
  /** Date the source file was obtained (YYYY-MM-DD). */
  retrievedAt: string;
  sourceUrl: string;
  /** True when the text is an unofficial translation (the Korean text prevails). */
  translation: boolean;
  articles: LawArticle[];
};
