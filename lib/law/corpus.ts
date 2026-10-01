import en from "./data/immigration-act-14106.en.json";
import ko from "./data/immigration-act-14106.ko.json";
import { buildLawIndex, type LawIndex } from "./search";
import type { LawDocument } from "./types";

/** The Immigration Act as supplied by the owner (law.go.kr export, 2026-10-01). */
export const immigrationAct = {
  ko: ko as LawDocument,
  en: en as LawDocument,
};

let index: LawIndex | undefined;

export function immigrationActIndex(): LawIndex {
  index ??= buildLawIndex(immigrationAct);
  return index;
}
