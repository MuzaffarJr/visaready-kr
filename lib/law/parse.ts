import type { LawArticle, LawLanguage } from "./types";

const KO_ARTICLE = /^제(\d+)조(?:의(\d+))?\s*(?:\(([^)]*)\)\s*(.*)|(삭제.*))$/;
const EN_ARTICLE = /^\s{0,2}Articles? (\d+(?:-\d+)?) (?:\(([^\d)][^)]*)\)\s*(.*)|(Deleted.*))$/;
/** English titles can wrap: "Article 40 (Favorable Treatment on Persons who Have Completed Social Integration" */
const EN_ARTICLE_OPEN = /^\s{0,2}Articles? (\d+(?:-\d+)?) \(([^\d)][^)]*)$/;
const KO_CHAPTER = /^\s*(제\d+장(?:의\d+)?)\s+(.+?)\s*(?:<.*)?$/;
const EN_CHAPTER = /^\s*CHAPTER ([IVX]+(?:-\d+)?)\s+(.+?)\s*$/;
const KO_END = /^\s*부칙\s*<|^\s*부칙\s*$/;
const EN_END = /^\s*ADDENDA\b/;

/** Page furniture added by law.go.kr exports. */
function isNoise(line: string): boolean {
  const t = line.trim();
  return (
    t === "" ||
    /^법제처\s+\d+\s+국가법령정보센터$/.test(t) ||
    /^법제처\s*국가법령정보센터$/.test(t) ||
    t === "출입국관리법" ||
    /^「.*」$/.test(t)
  );
}

/** A new paragraph or item starts on its own line; everything else is a wrapped line. */
const BLOCK_START = /^(?:[①-⑳]|\(\d+\)|\d{1,2}(?:-\d+)?\.\s|[가-하]\.\s|\[)/;

function joinLines(lines: string[], language: LawLanguage): string {
  let out = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (out === "") out = line;
    else if (BLOCK_START.test(line)) out += "\n" + line;
    // Korean exports wrap mid-word at a fixed width, so wrapped lines join directly.
    else out += (language === "ko" ? "" : " ") + line;
  }
  return out;
}

/** Splits pdftotext -layout output of one Act into articles. */
export function parseLawText(text: string, language: LawLanguage): LawArticle[] {
  const articleRe = language === "ko" ? KO_ARTICLE : EN_ARTICLE;
  const chapterRe = language === "ko" ? KO_CHAPTER : EN_CHAPTER;
  const endRe = language === "ko" ? KO_END : EN_END;

  const articles: LawArticle[] = [];
  let chapter = "";
  let current: { head: Omit<LawArticle, "text">; lines: string[] } | undefined;

  const flush = () => {
    if (current) articles.push({ ...current.head, text: joinLines(current.lines, language) });
    current = undefined;
  };

  let pendingTitle: { number: string; title: string } | undefined;

  for (let rawLine of text.replace(/\f/g, "\n").split("\n")) {
    if (endRe.test(rawLine)) break;
    if (pendingTitle) {
      if (isNoise(rawLine)) continue;
      const close = rawLine.indexOf(")");
      if (close === -1) {
        pendingTitle.title += " " + rawLine.trim();
        continue;
      }
      rawLine = `Article ${pendingTitle.number} (${pendingTitle.title} ${rawLine.slice(0, close).trim()})${rawLine.slice(close + 1)}`;
      pendingTitle = undefined;
    } else if (language === "en") {
      const open = rawLine.match(EN_ARTICLE_OPEN);
      if (open) {
        flush();
        pendingTitle = { number: open[1]!, title: open[2]!.trim() };
        continue;
      }
    }
    if (isNoise(rawLine)) continue;

    const chapterMatch = rawLine.match(chapterRe);
    if (chapterMatch && !rawLine.startsWith("제") && !/^ ?Article /.test(rawLine)) {
      flush();
      chapter = language === "ko" ? `${chapterMatch[1]} ${chapterMatch[2]}` : `Chapter ${chapterMatch[1]} ${chapterMatch[2]}`;
      continue;
    }

    const m = rawLine.match(articleRe);
    if (m) {
      flush();
      if (language === "ko") {
        const number = m[2] ? `${m[1]}-${m[2]}` : m[1]!;
        const deleted = m[5] !== undefined;
        current = { head: { number, title: m[3] ?? "", chapter, deleted }, lines: [deleted ? m[5]! : m[4] ?? ""] };
      } else {
        const deleted = m[4] !== undefined;
        current = { head: { number: m[1]!, title: m[2] ?? "", chapter, deleted }, lines: [deleted ? m[4]! : m[3] ?? ""] };
      }
      continue;
    }

    if (current) current.lines.push(rawLine);
    else if (language === "en" && chapter && /^\s*[A-Z ,.'’-]+$/.test(rawLine)) {
      // Chapter titles in the English export can wrap onto a second line.
      chapter += " " + rawLine.trim();
    }
  }
  flush();
  return articles;
}
