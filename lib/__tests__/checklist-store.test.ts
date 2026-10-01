import { describe, expect, it } from "vitest";
import { parseSavedChecklist } from "@/lib/checklist-store";
import { generateChecklist, ruleSets } from "@/lib/rules";

const ruleSet = ruleSets.find((r) => r.flowId === "d2-extension" && r.version === 2)!;
const generated = generateChecklist(ruleSet, { studyType: "degree", thesisStage: false }, "2026-10-01T00:00:00Z");
if (!generated.ok) throw new Error("fixture checklist did not generate");
const snapshot = generated.value;
const valid = { v: 1, snapshot, ready: { passport: true } };
// Loosely typed copy, so tests can corrupt it the way tampered storage would.
type Raw = { v: unknown; snapshot: typeof snapshot & Record<string, unknown>; ready?: Record<string, unknown> };
const clone = (): Raw => JSON.parse(JSON.stringify(valid));

describe("parseSavedChecklist", () => {
  it("accepts a record written by saveChecklist", () => {
    expect(parseSavedChecklist(clone(), "d2-extension")).toEqual(valid);
  });

  it("defaults missing ready state to empty", () => {
    const record = clone();
    delete record.ready;
    expect(parseSavedChecklist(record, "d2-extension")?.ready).toEqual({});
  });

  it.each([
    ["another flow", (r) => Object.assign(r.snapshot, { flowId: "d10-extension" })],
    ["an unknown rule set status", (r) => Object.assign(r.snapshot, { ruleSetStatus: "approved" })],
    ["a missing generatedAt", (r) => Object.assign(r.snapshot, { generatedAt: undefined })],
    ["an unparseable generatedAt", (r) => Object.assign(r.snapshot, { generatedAt: "yesterday" })],
    ["an object verifiedAt", (r) => Object.assign(r.snapshot, { verifiedAt: {} })],
    ["a malformed verifiedAt", (r) => Object.assign(r.snapshot, { verifiedAt: "1 Oct 2026" })],
    ["a null item", (r) => Object.assign(r.snapshot.items, { 0: null })],
    ["an item without sources", (r) => Object.assign(r.snapshot.items[0]!, { sources: undefined })],
    ["a non-https source url", (r) => Object.assign(r.snapshot.items[0]!.sources[0]!, { url: "javascript:alert(1)" })],
    ["a fee without an amount", (r) => Object.assign(r.snapshot.fees[0]!, { amountKrw: undefined })],
    ["a string ready flag", (r) => Object.assign(r.ready!, { passport: "false" })],
    ["an unknown version", (r) => Object.assign(r, { v: 2 })],
  ] satisfies [string, (r: Raw) => unknown][])("rejects %s", (_name, corrupt) => {
    const record = clone();
    corrupt(record);
    expect(parseSavedChecklist(record, "d2-extension")).toBeUndefined();
  });

  it("accepts a verified snapshot with an ISO verifiedAt", () => {
    const record = clone();
    Object.assign(record.snapshot, { ruleSetStatus: "verified", verifiedAt: "2026-10-01" });
    expect(parseSavedChecklist(record, "d2-extension")?.snapshot.verifiedAt).toBe("2026-10-01");
  });

  it("rejects non-objects", () => {
    expect(parseSavedChecklist(null, "d2-extension")).toBeUndefined();
    expect(parseSavedChecklist([], "d2-extension")).toBeUndefined();
  });
});
