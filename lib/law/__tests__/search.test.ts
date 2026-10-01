import { describe, expect, it } from "vitest";
import { immigrationAct, immigrationActIndex } from "../corpus";
import { excerpt, expandUzbek, parseArticleReferences } from "../search";

const top = (query: string, n = 3) => immigrationActIndex().search(query, n).map((hit) => hit.number);

describe("corpus", () => {
  it("has the Korean and English text aligned article by article", () => {
    const ko = immigrationAct.ko.articles.map((a) => a.number);
    const en = immigrationAct.en.articles.map((a) => a.number);
    expect(ko).toEqual(en);
    expect(ko.length).toBe(150);
  });

  it("parses article 25 with its title in both languages", () => {
    const ko = immigrationAct.ko.articles.find((a) => a.number === "25");
    const en = immigrationAct.en.articles.find((a) => a.number === "25");
    expect(ko?.title).toBe("체류기간 연장허가");
    expect(ko?.text).toContain("체류기간이 끝나기 전에");
    expect(en?.title).toBe("Permission to Extend Period of Stay");
  });

  it("records the version so answers can cite it", () => {
    expect(immigrationAct.ko.enforcementDate).toBe("2016-09-30");
    expect(immigrationAct.en.translation).toBe(true);
  });
});

describe("parseArticleReferences", () => {
  it("reads Korean, English and Uzbek article references", () => {
    expect(parseArticleReferences("제25조의2 그리고 제94조")).toEqual(["25-2", "94"]);
    expect(parseArticleReferences("see Article 46")).toEqual(["46"]);
    expect(parseArticleReferences("25-modda nima deydi")).toEqual(["25"]);
  });
});

describe("search", () => {
  it("finds an explicitly referenced article first", () => {
    const [hit] = immigrationActIndex().search("제25조");
    expect(hit).toMatchObject({ number: "25", match: "reference" });
  });

  it("finds the extension article from Korean, English and Uzbek queries", () => {
    expect(top("체류기간 연장")).toContain("25");
    expect(top("extend period of stay")).toContain("25");
    expect(top("viza muddatini uzaytirish")).toContain("25");
  });

  it("finds alien registration and deportation provisions", () => {
    expect(top("외국인등록")).toContain("31");
    expect(top("deportation")).toContain("46");
    expect(top("chiqarib yuborish")).toContain("46");
  });

  it("returns nothing for queries with no known terms", () => {
    expect(immigrationActIndex().search("zzzz qqqq")).toEqual([]);
  });

  it("never returns deleted articles from term search", () => {
    const hits = immigrationActIndex().search("deleted", 20);
    expect(hits.every((hit) => !(hit.en?.deleted ?? false))).toBe(true);
  });
});

describe("helpers", () => {
  it("expands Uzbek immigration terms", () => {
    expect(expandUzbek("jarima")).toEqual(expect.arrayContaining(["fine", "과태료"]));
  });

  it("excerpts around the first match", () => {
    expect(excerpt("a ".repeat(100) + "extend the stay", ["extend"], 40)).toMatch(/^….*extend/);
  });
});
