/**
 * Converts a statute PDF from law.go.kr into the JSON corpus used by lib/law.
 *
 *   npx tsx scripts/ingest-law.ts <pdf> <ko|en> <out.json> <meta.json>
 *
 * Requires `pdftotext` (poppler-utils). meta.json holds the LawDocument fields
 * other than `articles`. The output is committed; the PDFs are not.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import type { LawArticle, LawDocument, LawLanguage } from "../lib/law/types";
import { parseLawText } from "../lib/law/parse";

const [pdf, language, out, metaPath] = process.argv.slice(2);
if (!pdf || (language !== "ko" && language !== "en") || !out || !metaPath) {
  console.error("usage: tsx scripts/ingest-law.ts <pdf> <ko|en> <out.json> <meta.json>");
  process.exit(2);
}

const text = execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const articles: LawArticle[] = parseLawText(text, language as LawLanguage);
const meta = JSON.parse(readFileSync(metaPath, "utf8")) as Omit<LawDocument, "articles">;
const document: LawDocument = { ...meta, language: language as LawLanguage, articles };

writeFileSync(out, JSON.stringify(document, null, 1) + "\n");
console.log(`${articles.length} articles (${articles.filter((a) => a.deleted).length} deleted) → ${out}`);
