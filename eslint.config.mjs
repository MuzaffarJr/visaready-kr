import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Domain modules (rules, law corpus, i18n catalogues) must stay framework-free.
    files: ["lib/rules/**/*.ts", "lib/law/**/*.ts", "lib/i18n/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom", "react/*"], message: "Domain modules must not depend on React." },
            { group: ["next", "next/*"], message: "Domain modules must not depend on Next.js." },
            { group: ["@supabase/*"], message: "Domain modules must not depend on Supabase." },
            { group: ["@/*"], message: "Domain modules may only use relative imports." },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);
