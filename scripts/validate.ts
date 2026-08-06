import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { FORBIDDEN_DERIVED_KEYS } from "../src/shared/vocabulary.ts";
import { loadVault } from "./lib/vault.ts";

const vault = loadVault();
const issues = [...vault.issues];

const templatePath = resolve("obsidian/_templates/capture.md");
if (!existsSync(templatePath)) {
  issues.push({
    path: relative(process.cwd(), templatePath).replaceAll("\\", "/"),
    message: "Capture template is missing",
  });
} else {
  const template = readFileSync(templatePath, "utf8");
  for (const key of FORBIDDEN_DERIVED_KEYS) {
    if (new RegExp(`^${key}\\s*:`, "im").test(template)) {
      issues.push({
        path: relative(process.cwd(), templatePath).replaceAll("\\", "/"),
        field: key,
        message: `Template must not include derived field "${key}"`,
      });
    }
  }
}

console.log("Vault validation report");
console.log("-----------------------");
console.log(`captures: ${vault.captures.length}`);
console.log(`collections: ${vault.collections.length}`);
console.log(`wiki pages: ${vault.wikiPages.length}`);
console.log(`visibility defaults applied: ${vault.visibilityDefaults}`);
console.log(`tag normalizations: ${vault.tagNormalizations.length}`);
for (const item of vault.tagNormalizations) {
  console.log(`  ${item.path}: "${item.raw}" → ${item.canonical}`);
}

if (issues.length === 0) {
  console.log("\nOK: vault passed schema validation");
  process.exit(0);
}

console.error(`\nFAIL: ${issues.length} issue(s)`);
for (const issue of issues) {
  const field = issue.field ? ` [${issue.field}]` : "";
  console.error(`- ${issue.path}${field}: ${issue.message}`);
}
process.exit(1);
