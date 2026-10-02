import type { DeepPartial } from "../types";
import type { Messages } from "./en";

// Vietnamese and Simplified Chinese UI copy, waiting for translators (backlog
// P1-1). These locales are not routable until their catalogues are complete;
// any key added here already overrides the English fallback.
export const vi: DeepPartial<Messages> = {};
export const zh: DeepPartial<Messages> = {};
