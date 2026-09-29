#!/usr/bin/env node
/**
 * Strata DS — Pre-commit hook
 *
 * Detects DS governance tier from CLAUDE.md and runs the appropriate audit.
 * - Tier 1: errors AND warnings block the commit
 * - Tier 2: only hex errors block the commit
 * - Tier 3: nothing blocks (audit runs but exits 0)
 *
 * Install: node scripts/install-hooks.mjs
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.env.GIT_DIR
  ? join(process.env.GIT_DIR, "..")
  : process.cwd();

// ─── DETECT TIER ──────────────────────────────────────────────────────────────

function detectTier() {
  const claudeMdPath = join(PROJECT_ROOT, "CLAUDE.md");
  if (!existsSync(claudeMdPath)) return 2; // Default to Tier 2 if no CLAUDE.md

  const content = readFileSync(claudeMdPath, "utf-8");
  const match = content.match(/DS Governance Tier:\s*([123])/i);
  if (match) return parseInt(match[1], 10);
  return 2;
}

// ─── FIGMA TOKEN FRESHNESS ────────────────────────────────────────────────────
// Only runs inside the design system repo, where the token source lives. Keeps
// strata-tokens.figma.json (the seed for the Figma library) in sync with
// variables.css, so Figma can never drift from the code the way it did before.

const figmaTokenScript = join(PROJECT_ROOT, "scripts/figma-tokens.mjs");
if (existsSync(figmaTokenScript)) {
  try {
    execSync(`node "${figmaTokenScript}" --check`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: "pipe",
    });
    console.log("✅ strata-tokens.figma.json está al día");
  } catch (err) {
    console.error(err.stdout || "");
    console.error("\n❌ Commit blocked — los tokens CSS cambiaron y strata-tokens.figma.json quedó viejo.");
    console.error("   Correr: npm run tokens:figma");
    console.error("   Después hay que re-sembrar las variables en el archivo de Figma.");
    process.exit(1);
  }
}

// ─── RUN AUDIT ────────────────────────────────────────────────────────────────

const tier = detectTier();
const auditScript = join(PROJECT_ROOT, "scripts/audit-tokens.mjs");
const p1AuditScript = join(
  __dirname,
  "audit-tokens.mjs"
);

// Use P1's audit script if local one not found
const scriptToRun = existsSync(auditScript) ? auditScript : p1AuditScript;

console.log(`\n🔍 Strata DS Token Audit (Tier ${tier})...`);

try {
  const result = execSync(`node "${scriptToRun}" --path src`, {
    cwd: PROJECT_ROOT,
    encoding: "utf-8",
    stdio: "pipe",
  });
  console.log(result);
} catch (err) {
  const output = err.stdout || "";
  const errorOutput = err.stderr || "";

  if (errorOutput) console.error(errorOutput);

  // Parse violation counts from output
  const errorMatch = output.match(/❌ Errors:\s+(\d+)/);
  const warnMatch = output.match(/⚠️.*Warnings:\s+(\d+)/);
  const errorCount = errorMatch ? parseInt(errorMatch[1]) : 0;
  const warnCount = warnMatch ? parseInt(warnMatch[1]) : 0;

  console.log(output);

  if (tier === 1 && (errorCount > 0 || warnCount > 0)) {
    console.error(`\n❌ Tier 1: Commit blocked — ${errorCount} errors, ${warnCount} warnings`);
    console.error(`   Fix violations or add // @ds-ignore: reason to suppress.`);
    process.exit(1);
  }

  if (tier === 2 && errorCount > 0) {
    console.error(`\n❌ Tier 2: Commit blocked — ${errorCount} hex color errors`);
    console.error(`   Replace hex values with DS tokens or add // @ds-ignore: reason.`);
    process.exit(1);
  }

  if (tier === 3) {
    console.log(`\n⚠️  Tier 3: Violations found but commit allowed (simulation mode).`);
    console.log(`   Add // @ds-ignore: reason to document intentional deviations.`);
    process.exit(0);
  }
}

console.log(`\n✅ Token audit passed (Tier ${tier}).`);
process.exit(0);
