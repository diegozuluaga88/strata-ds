/**
 * validator.ts — Strata DS rule-validation engine.
 *
 * Pure (no IO) — accepts a TSX / JSX / CSS string, returns a structured
 * report of violations keyed to specific Strata DS rules. Shared by the
 * MCP `validate_component_against_rules` tool exposed in both the stdio
 * (mcp.ts) and HTTP (mcp-http.ts) transports.
 */

export interface Violation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  match: string;
  line: number;
  suggestion?: string;
}

export interface ValidationResult {
  ok: boolean;
  violations: Violation[];
  summary: { errors: number; warnings: number; infos: number };
}

interface Check {
  id: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  pattern: RegExp;
  message: string;
  suggestion?: string;
  skipIfAlso?: RegExp;
}

const CHECKS: Check[] = [
  // ── Tokens / colors (LAW 1, rules/01, anti-patterns 01-05) ──────────
  {
    id: 'hardcoded-hex',
    rule: 'LAW 1 · rules/01-color-tokens',
    severity: 'error',
    pattern: /(?:bg|text|border|ring|stroke|fill)-\[#[0-9a-f]{3,8}\]|style=\{?[^}]*?(?:color|background|border-color)[^}]*?#[0-9a-f]{3,8}/gi,
    message: 'Hardcoded hex value. Use a semantic token.',
    suggestion: 'Replace with bg-primary / text-foreground / bg-card / etc.',
  },
  {
    id: 'tailwind-state-color',
    rule: 'anti-patterns ERROR 01',
    severity: 'error',
    pattern: /\b(?:text|bg|border|ring)-(green|red|blue|yellow|emerald|amber)-(?:[1-9]00|950)\b/g,
    message: 'Raw Tailwind state color.',
    suggestion: 'green → success, red → destructive, yellow/amber → warning, blue → info',
  },
  {
    id: 'forbidden-tailwind-palette',
    rule: 'anti-patterns ERROR 04 · LAW 4',
    severity: 'error',
    pattern: /\b(?:text|bg|border|ring)-(lime|purple|pink|orange|teal|cyan|sky|fuchsia|rose|violet|indigo)-(?:[1-9]00|950)\b/g,
    message: 'Forbidden Tailwind primitive palette. Strata maps these to brand or semantic tokens.',
    suggestion: 'lime → brand · purple/violet/indigo → indigo · pink/rose/fuchsia → red · orange → amber · teal/cyan/sky → info',
  },
  {
    id: 'hardcoded-surface',
    rule: 'anti-patterns ERROR 02',
    severity: 'error',
    pattern: /\b(?:bg)-(white|black)(?:\b|\/)|\b(?:bg)-zinc-(?:50|100|800|900|950)\b|\b(?:bg)-gray-(?:50|100|800|900|950)\b/g,
    message: 'Hardcoded surface color.',
    suggestion: 'bg-white → bg-background or bg-card · bg-zinc-900/950 → bg-background · bg-zinc-50 → bg-muted',
  },
  {
    id: 'dark-mode-cascade',
    rule: 'LAW 5 · anti-patterns ERROR 05',
    severity: 'warning',
    pattern: /\bdark:(?:bg|text|border|ring)-/g,
    message: 'Manual dark: class. Semantic tokens already adapt to dark mode.',
    suggestion: 'Replace with the semantic token (text-foreground, bg-card, etc.) and remove dark: variant',
  },
  {
    id: 'brand-text',
    rule: 'LAW 2 · rules/02-brand-colors',
    severity: 'error',
    // Match text-brand-300 / text-brand-400 / text-primary
    // but NOT text-primary-foreground (the dark text ON primary, which is correct).
    pattern: /\btext-(?:brand-[34]00|primary)(?![-\w])/g,
    message: 'brand-300/400 (or text-primary) as text fails WCAG contrast.',
    suggestion: 'Use text-foreground for body. Use brand as background, badge, or focus ring.',
  },
  {
    id: 'opacity-on-container',
    rule: 'anti-patterns ERROR 07',
    severity: 'warning',
    pattern: /\b(bg-(?:primary|success|warning|destructive|info))\s+[^"`]*?\bopacity-(?:5|10|15|20|25|30)\b/g,
    message: 'Opacity on container fades text too. Use color opacity syntax.',
    suggestion: 'bg-success opacity-10 → bg-success/10',
  },

  // ── Component choice (rule 04, code-usage) ──────────────────────────
  {
    id: 'raw-button',
    rule: 'rules/04-buttons-and-actions · code-usage Rule 5',
    severity: 'warning',
    pattern: /<button[^>]*className=["'`][^"'`]*\bborder\b/g,
    message: 'Raw <button> with Tailwind border styling. Use the DS <Button>.',
    suggestion: 'import { Button } from "@avantodev/strata-design-system" and use <Button variant="outline" />',
  },
  {
    id: 'raw-anchor-styled',
    rule: 'code-usage Rule 5',
    severity: 'warning',
    pattern: /<a\s+href=[^>]*className=["'`][^"'`]*\b(?:underline|text-(?:lime|brand))/g,
    message: 'Raw <a> with link styling. Use the DS <Link>.',
    suggestion: 'import { Link } from "@avantodev/strata-design-system"',
  },
  {
    id: 'raw-date-input',
    rule: 'code-usage Rule 5',
    severity: 'warning',
    pattern: /<[Ii]nput[^>]*type=["'`]date["'`]/g,
    message: 'Raw date input. Use DS <DatePicker> for consistent calendar UX.',
    suggestion: '<DatePicker value={date} onChange={setDate} />',
  },
  {
    id: 'storybook-source-import',
    rule: 'code-usage Rule 1',
    severity: 'error',
    pattern: /from\s+["'`][^"'`]*storybook\/src/g,
    message: 'Import reaches into storybook source. Use the public package.',
    suggestion: 'from "@avantodev/strata-design-system"',
  },

  // ── Icons (rule 05, code-usage Rule 3) ──────────────────────────────
  // ── Typography (rules/06) ───────────────────────────────────────────
  {
    // The unambiguous half: a heading or a dialog title is our interface, so a
    // serif on it is always wrong. This is the exact shape that reached a demo —
    // 17 of them — without the validator noticing.
    id: 'serif-on-ui-heading',
    rule: 'rules/06-typography',
    severity: 'error',
    pattern: /<(?:DialogTitle|Title|CardTitle|h[1-4])[^>]*className=(?:"[^"]*|\{`[^`]*)\bfont-serif\b/g,
    message: 'Serif on UI chrome. Headings and dialog titles are sans (Inter), which is the default.',
    suggestion: 'Drop font-serif and keep the size and weight classes.',
  },
  {
    // The rest needs judgment the engine does not have: it cannot tell a
    // letterhead from a label. A warning asks for the justification instead of
    // guessing, the way the dark: and raw-<button> checks already do.
    id: 'serif-outside-facsimile',
    rule: 'rules/06-typography',
    severity: 'warning',
    // Acotado a UNA línea (bandera m): sin eso, el className con template
    // literal dejaba que `[^`]*` cruzara el archivo y un solo font-serif
    // producía decenas de avisos. El lookahead descarta las líneas que el
    // chequeo de error de arriba ya reporta, así ninguna sale dos veces.
    pattern: /^(?!.*<(?:DialogTitle|Title|CardTitle|h[1-4])).*\bfont-serif\b.*$/gm,
    message: 'Serif is for document facsimiles only — letterheads, reproduced invoices, quoted correspondence.',
    suggestion: 'If this is Strata UI, remove it. If it represents paper from outside Strata, keep it and say so in a comment.',
  },
  {
    id: 'text-character-icon',
    rule: 'rules/05-icons · code-usage Rule 3',
    severity: 'warning',
    pattern: />(?:\s*)(?:›|‹|→|←|↑|↓|✕|✖|★|☆|✓|✔|•|◆|▶|◀)(?:\s*)<\/(?:span|button|div|a)/g,
    message: 'Text character used as an icon. Use lucide-react.',
    suggestion: '> → ArrowRight · ✕ → X · ✓ → Check · ★ → Star · • → CircleDot',
  },
  {
    id: 'svg-hardcoded-stroke',
    rule: 'rules/05-icons',
    severity: 'warning',
    pattern: /<svg[^>]*\bstroke=["'`]#[0-9a-f]{3,8}["'`]/gi,
    message: 'SVG with hardcoded stroke color.',
    suggestion: 'Use className with a semantic color token; SVG inherits via currentColor.',
  },

  // ── className merging (code-usage Rule 4) ───────────────────────────
  {
    id: 'string-concat-classname',
    rule: 'code-usage Rule 4',
    severity: 'warning',
    pattern: /className=\{(?:["'`][^"'`]+["'`]\s*\+|`[^`]*\$\{)/g,
    message: 'String concatenation or template literal for className. Use cn().',
    suggestion: 'import { cn } from "@avantodev/strata-design-system" and use cn("base", isActive && "active", className)',
  },

  // ── Modal patterns (rule 08) ────────────────────────────────────────
  {
    id: 'custom-modal-scaffold',
    rule: 'rules/08-modal-patterns · code-usage Overlays',
    severity: 'error',
    pattern: /className=["'`][^"'`]*\bfixed\s+inset-0[^"'`]*bg-black\//g,
    message: 'Custom modal scaffold (fixed inset-0 + black overlay). Use DS <Dialog> or <SplitPaneReviewModal>.',
    suggestion: 'import { Dialog, DialogContent, DialogHeader, ... } from the DS',
  },

  // ── Layout density (rule 09) ────────────────────────────────────────
  {
    id: 'narrow-center-column',
    rule: 'rules/09-layout-density',
    severity: 'info',
    pattern: /\bmax-w-(?:xl|2xl|3xl)\s+mx-auto\b/g,
    message: 'Narrow center column on every viewport. Consider a multi-column grid on lg+.',
    suggestion: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
    skipIfAlso: /\bprose\b|article|markdown/,
  },

  // ── Spacing scale (rule 10) ─────────────────────────────────────────
  {
    id: 'arbitrary-spacing',
    rule: 'rules/10-spacing-rhythm',
    severity: 'warning',
    pattern: /\b(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-(?:x|y))-\[(?:\d+(?:\.\d+)?(?:px|rem)?|\d+(?:px|rem))\]/g,
    message: 'Arbitrary spacing value off the 4-point scale.',
    suggestion: 'Use a scale value: p-1/2/3/4/6/8/12/16 (4/8/12/16/24/32/48/64px)',
  },
  {
    id: 'font-light',
    rule: 'rules/06-typography · rules/10-spacing-rhythm anti-patterns',
    severity: 'warning',
    pattern: /\bfont-(?:thin|extralight|light)\b/g,
    message: 'font-light is too washed-out for body text.',
    suggestion: 'Use font-normal (400) as the body default.',
  },

  // ── Microcopy (rule 14) ─────────────────────────────────────────────
  {
    id: 'bare-verb-button',
    rule: 'rules/14-microcopy-tone',
    severity: 'info',
    pattern: />\s*(?:Save|Submit|Approve|Reject|Delete|Send|Apply|Confirm)\s*</g,
    message: 'Bare verb button label. Use verb + object so the action stays clear when context scrolls off.',
    suggestion: 'Save → Save quote · Reject → Reject report · Delete → Delete record',
    skipIfAlso: /<\/?(?:option|li|h[1-6])\b/,
  },

  // ── Accessibility (rule 15) ─────────────────────────────────────────
  {
    id: 'outline-none-no-replacement',
    rule: 'rules/15-accessibility-focus',
    severity: 'error',
    pattern: /\boutline-none\b(?![^"'`]*focus(?:-visible)?:(?:ring|outline))/g,
    message: 'outline-none with no focus replacement. Keyboard users lose focus indicator.',
    suggestion: 'Pair with focus-visible:ring-2 focus-visible:ring-primary/40',
  },
  {
    id: 'icon-only-button-no-aria',
    rule: 'rules/15-accessibility-focus',
    severity: 'warning',
    pattern: /<button(?:(?!aria-label)[^>])*?>\s*<(?:svg|[A-Z]\w+)[^>]*\/?>(?:\s*<\/[A-Z]\w+>)?\s*<\/button>/g,
    message: 'Icon-only button with no aria-label. Screen readers cannot announce it.',
    suggestion: '<button aria-label="Describe the action"> ... </button>',
  },

  // ── F43: extra checks ───────────────────────────────────────────────
  {
    id: 'arbitrary-text-size',
    rule: 'rules/06-typography',
    severity: 'warning',
    pattern: /\btext-\[(?:\d+(?:\.\d+)?(?:px|rem)?|\d+(?:px|rem))\]/g,
    message: 'Arbitrary text size off the canonical scale.',
    suggestion: 'Use text-xs / sm / base / lg / xl / 2xl / 3xl / 4xl instead of text-[15px].',
  },
  {
    id: 'light-font-weights',
    rule: 'rules/06-typography · rules/14-microcopy-tone',
    severity: 'warning',
    pattern: /\bfont-(?:thin|extralight)\b/g,
    message: 'font-thin / font-extralight is too washed-out for product UI.',
    suggestion: 'Use font-normal (400) as the body default.',
  },
  {
    id: 'placeholder-href',
    rule: 'code-usage Rule 5 · rules/15-accessibility-focus',
    severity: 'info',
    pattern: /\bhref=(?:["'`]#["'`]|\{['"`]#['"`]\})/g,
    message: 'Placeholder href="#" is not a real navigation target.',
    suggestion: 'Use a real route or a <Button> with onClick for non-navigation actions.',
  },
  {
    id: 'arbitrary-height',
    rule: 'rules/10-spacing-rhythm · rules/09-layout-density',
    severity: 'warning',
    pattern: /\b(?:min-h|max-h|h|w|min-w|max-w)-\[(?:\d+(?:\.\d+)?(?:px|rem|vh|vw)?|\d+(?:px|rem|vh|vw))\]/g,
    message: 'Arbitrary size value. Stick to the canonical scale or semantic tokens.',
    suggestion: 'Use h-screen / h-full / h-1/2 / max-w-md|lg|xl|2xl etc., or pull from the spacing scale.',
    skipIfAlso: /\b(?:max-h-\[90vh\]|max-h-\[calc)/, // common modal pattern
  },
  {
    id: 'bare-verb-button-extended',
    rule: 'rules/14-microcopy-tone',
    severity: 'info',
    pattern: />\s*(?:Open|Close|Edit|Add|Create|Update|View|Yes|No)\s*</g,
    message: 'Bare verb / yes-no button label. Use verb + object so the action stays clear.',
    suggestion: 'Open → Open quote · Edit → Edit row · Yes → Yes, delete · No → Cancel',
    skipIfAlso: /<\/?(?:option|li|h[1-6]|p|span|td|th)\b/,
  },
  {
    id: 'non-lucide-icons',
    rule: 'rules/05-icons · code-usage Rule 3',
    severity: 'info',
    pattern: /from\s+["'`](?:react-icons|@heroicons|tabler-icons-react|@fortawesome|feather-icons)/g,
    message: 'Strata standardises on lucide-react for application icons.',
    suggestion: 'import { ... } from "lucide-react" instead.',
  },
  {
    id: 'inline-style-hex-color',
    rule: 'LAW 1 · rules/01-color-tokens',
    severity: 'error',
    pattern: /style=\{[^}]*?(?:color|background|backgroundColor|borderColor):\s*['"`]#[0-9a-f]{3,8}['"`][^}]*?\}/gi,
    message: 'Inline style with hardcoded hex color.',
    suggestion: 'Replace with className="text-... / bg-... / border-..." using semantic tokens.',
  },
  {
    id: 'role-dialog-without-ds',
    rule: 'rules/08-modal-patterns · code-usage Overlays',
    severity: 'warning',
    pattern: /role=["'`]dialog["'`]/g,
    message: 'Custom role="dialog" markup. Use the DS <Dialog> compound for focus trap + a11y.',
    suggestion: 'import { Dialog, DialogContent, DialogHeader, ... } from "@avantodev/strata-design-system"',
    skipIfAlso: /Radix|@radix-ui|aria-labelledby|aria-describedby/,
  },
];

export function validateCode(code: string, _filename?: string): ValidationResult {
  const violations: Violation[] = [];
  const lines = code.split('\n');
  const lineStarts: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    lineStarts.push(lineStarts[i] + lines[i].length + 1);
  }
  const offsetToLine = (offset: number) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
  for (const check of CHECKS) {
    const rx = new RegExp(check.pattern.source, check.pattern.flags.includes('g') ? check.pattern.flags : check.pattern.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = rx.exec(code)) !== null) {
      const line = offsetToLine(m.index);
      if (check.skipIfAlso) {
        const lineStart = lineStarts[line - 1];
        const lineEnd = lineStarts[line] ?? code.length;
        const lineText = code.slice(lineStart, lineEnd);
        if (check.skipIfAlso.test(lineText)) continue;
      }
      violations.push({
        rule: check.rule,
        severity: check.severity,
        message: check.message,
        match: m[0].slice(0, 100),
        line,
        suggestion: check.suggestion,
      });
    }
  }
  const summary = { errors: 0, warnings: 0, infos: 0 };
  for (const v of violations) {
    if (v.severity === 'error') summary.errors++;
    else if (v.severity === 'warning') summary.warnings++;
    else summary.infos++;
  }
  return { ok: summary.errors === 0, violations, summary };
}

export function formatValidation(r: ValidationResult): string {
  const lines: string[] = [];
  lines.push(`# Strata DS — Validation report`);
  lines.push('');
  lines.push(r.ok
    ? `✅ **No errors found.** ${r.summary.warnings} warning(s) · ${r.summary.infos} info(s).`
    : `❌ **${r.summary.errors} error(s).** ${r.summary.warnings} warning(s) · ${r.summary.infos} info(s).`);
  lines.push('');
  if (r.violations.length === 0) {
    lines.push('Code passes every active check. Run again after any edit — the validator is fast.');
    return lines.join('\n');
  }
  for (const sev of ['error', 'warning', 'info'] as const) {
    const filtered = r.violations.filter(v => v.severity === sev);
    if (filtered.length === 0) continue;
    lines.push(`## ${sev.toUpperCase()} (${filtered.length})`);
    lines.push('');
    for (const v of filtered) {
      lines.push(`- **L${v.line} · ${v.rule}** — ${v.message}`);
      lines.push(`  \`\`\`${v.match}\`\`\``);
      if (v.suggestion) lines.push(`  Suggestion: ${v.suggestion}`);
    }
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push('Call `get_rules({category})` for the full text of any cited rule. Call `validate_component_against_rules` again after fixing to confirm.');
  return lines.join('\n');
}
