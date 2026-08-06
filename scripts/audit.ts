import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { GITHUB_PAGES_MAX_BYTES } from "../src/shared/limits.ts";

const steps: Array<{ command: string; args: string[] }> = [
  { command: "npm", args: ["run", "validate"] },
  { command: "npm", args: ["run", "check:hex"] },
  { command: "npm", args: ["run", "check:contrast"] },
  { command: "npm", args: ["run", "check:a11y-css"] },
  { command: "npm", args: ["run", "build", "--", "--target=internal"] },
  { command: "npm", args: ["run", "build", "--", "--target=public"] },
  { command: "npm", args: ["run", "check:public-leak"] },
  { command: "npm", args: ["run", "test:filter"] },
  { command: "npm", args: ["run", "test:phase4"] },
  { command: "npm", args: ["run", "build:ui"] },
];

for (const step of steps) {
  console.log(`\n==== ${step.command} ${step.args.join(" ")} ====`);
  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const target of ["internal", "public"] as const) {
  const reportPath = `reports/${target}-build-report.json`;
  if (!existsSync(reportPath)) {
    console.error(`FAIL: missing ${reportPath}`);
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
    capturesIncluded: number;
    capturesTotal: number;
    assetBytesCopied: number;
    oversizeFiles: unknown[];
    githubPagesRemainingBytes: number;
  };
  console.log(
    `\n${target}: ${report.capturesIncluded}/${report.capturesTotal} captures, assets ${report.assetBytesCopied} bytes, Pages remaining ${report.githubPagesRemainingBytes}/${GITHUB_PAGES_MAX_BYTES}`,
  );
  if (report.oversizeFiles.length > 0) {
    console.error(`FAIL: ${target} has oversize files`);
    process.exit(1);
  }
}

console.log(`
Manual keyboard checklist (human, mouse off):
1. Tab through nav → mode toggle → Archive search → All/Pin tabs → card link
2. Enter opens capture detail; Tab to Pin / Archive
3. Pin from detail; return to Archive Pin tab to confirm
4. Intake file chooser and Analyze receive visible keyboard focus
5. Confirm :focus-visible rings on each interactive control
6. Escape in Archive search clears filters
`);

console.log("OK: automated Phase 5 audit passed");
