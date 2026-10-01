import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The rules domain is the source of truth and must stay framework-free.
    files: ["lib/rules/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom", "react/*"], message: "lib/rules must not depend on React." },
            { group: ["next", "next/*"], message: "lib/rules must not depend on Next.js." },
            { group: ["@supabase/*"], message: "lib/rules must not depend on Supabase." },
            { group: ["@/*"], message: "lib/rules may only import from inside lib/rules." },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);
