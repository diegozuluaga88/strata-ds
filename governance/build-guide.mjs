#!/usr/bin/env node
/**
 * build-guide.mjs — Generate a single self-contained HTML guide that
 * consolidates every Strata DS rule into one shareable, offline-readable
 * artifact.
 *
 * Reads:
 *   - governance/LAWS.md
 *   - governance/rules/01..07-*.md
 *   - governance/anti-patterns/common-errors.md
 *   - governance/tokens/token-reference.md
 *   - src/styles/tokens/variables.css       (light tokens)
 *   - src/styles/tokens/variables-dark.css  (dark tokens)
 *
 * Writes:
 *   - governance/rules-guide.html  (single self-contained file)
 *
 * Usage:
 *   node governance/build-guide.mjs
 */

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { slugify } from './build-guide-shared.mjs';
import { EXAMPLES_BY_HEADING } from './examples-data.mjs';

// ── Paths ──────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(__dirname, 'rules-guide.html');

// ── Sources ────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'laws',                  title: 'Absolute Laws',           file: 'governance/LAWS.md' },
  { id: 'code-usage',            title: 'Code Usage Rules',        file: 'governance/code-usage.md' },
  { id: 'rules-color-tokens',    title: 'Color tokens',            file: 'governance/rules/01-color-tokens.md' },
  { id: 'rules-brand-colors',    title: 'Brand colors',            file: 'governance/rules/02-brand-colors.md' },
  { id: 'rules-containers',      title: 'Containers and cards',    file: 'governance/rules/03-containers-and-cards.md' },
  { id: 'rules-buttons',         title: 'Buttons and actions',     file: 'governance/rules/04-buttons-and-actions.md' },
  { id: 'rules-icons',           title: 'Icons',                   file: 'governance/rules/05-icons.md' },
  { id: 'rules-typography',      title: 'Typography',              file: 'governance/rules/06-typography.md' },
  { id: 'rules-elevation',       title: 'Elevation and shadows',   file: 'governance/rules/07-elevation.md' },
  { id: 'anti-patterns',         title: 'Anti-patterns (10)',      file: 'governance/anti-patterns/common-errors.md' },
  { id: 'token-reference',       title: 'Token reference',         file: 'governance/tokens/token-reference.md' },
  // F33 — DS Manager rule set (composition, states, voice, a11y, data display)
  { id: 'modal-patterns',        title: 'Modal patterns',          file: 'governance/rules/08-modal-patterns.md' },
  { id: 'layout-density',        title: 'Layout density',          file: 'governance/rules/09-layout-density.md' },
  { id: 'spacing-rhythm',        title: 'Spacing & rhythm',        file: 'governance/rules/10-spacing-rhythm.md' },
  { id: 'responsive-behavior',   title: 'Responsive behavior',     file: 'governance/rules/11-responsive-behavior.md' },
  { id: 'empty-states',          title: 'Empty states',            file: 'governance/rules/12-empty-states.md' },
  { id: 'loading-states',        title: 'Loading states',          file: 'governance/rules/13-loading-states.md' },
  { id: 'microcopy-tone',        title: 'Microcopy & tone',        file: 'governance/rules/14-microcopy-tone.md' },
  { id: 'accessibility-focus',   title: 'Accessibility & focus',   file: 'governance/rules/15-accessibility-focus.md' },
  { id: 'data-display',          title: 'Data display',            file: 'governance/rules/16-data-display.md' },
];

const TOKENS_LIGHT = 'src/styles/tokens/variables.css';
const TOKENS_DARK  = 'src/styles/tokens/variables-dark.css';

// ── Visual examples per section ────────────────────────────────────────
// Each entry is HTML injected after the section's <h2> heading. The chrome
// for these examples is defined in buildStyle() and respects the active
// theme via CSS variables.

const ICON = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  iconSized: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
};

const EXAMPLES = {
  laws: `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · LAWS in action</span>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ LAW 1 — hardcoded hex</span>
          <div class="ec-body"><button class="demo-btn" style="background:#E6F993;color:#02060C;">Save</button></div>
          <div class="ec-code">className="bg-[#E6F993] text-[#02060C]"</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ LAW 1 — semantic token</span>
          <div class="ec-body"><button class="demo-btn demo-btn-primary">Save</button></div>
          <div class="ec-code">className="bg-primary text-primary-foreground"</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ LAW 2 — brand as text on light bg</span>
          <div class="ec-body"><span style="color:var(--primary);font-weight:700;font-size:14px;">Welcome to Strata</span></div>
          <div class="ec-code">className="text-brand-300"  // contrast 1.8:1, fails WCAG</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ LAW 2 — brand only as CTA / signal</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-primary">Sign in</button>
            <span class="status-pill status-success">${ICON.check} Active</span>
          </div>
          <div class="ec-code">bg-primary, bg-status-success/15, ring-primary</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card is-good">
          <span class="ec-tag">✓ LAW 5 — dark mode via tokens (no manual <code>dark:</code>)</span>
          <div class="ec-body">
            <div class="surface-demo" style="padding:12px;">
              <span class="sd-label">bg-background</span>
              <div class="sd-card"><span class="sd-label">bg-card text-foreground</span></div>
            </div>
          </div>
          <div class="ec-code">Toggle theme (top-right) to confirm the same classes adapt</div>
        </div>
      </div>
    </div>
  `,

  'rules-color-tokens': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Surface hierarchy &amp; status colors</span>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Surface hierarchy — bg → card → muted</span>
          <div class="ec-body" style="display:block;">
            <div class="surface-demo">
              <span class="sd-label">Level 0 · bg-background</span>
              <div class="sd-card">
                <span class="sd-label">Level 1 · bg-card</span>
                <div class="sd-muted"><span class="sd-label">Level 2 · bg-muted</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="example-card">
          <span class="ec-tag">Sidebar inversion (light app → dark side, vice versa)</span>
          <div class="ec-body" style="display:block;">
            <div class="sidebar-demo">
              <div class="sd-side">
                <span class="sd-item active">Overview</span>
                <span class="sd-item">Components</span>
                <span class="sd-item">Tokens</span>
              </div>
              <div class="sd-main">bg-sidebar text-sidebar-foreground</div>
            </div>
          </div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">State colors — semantic tokens</span>
          <div class="ec-body" style="display:block;">
            <div class="status-row">
              <span class="status-pill status-success">${ICON.check} Active</span>
              <span class="status-pill status-warning">${ICON.alert} Pending</span>
              <span class="status-pill status-destructive">${ICON.alert} Error</span>
              <span class="status-pill status-info">${ICON.info} Info</span>
            </div>
          </div>
          <div class="ec-code">text-status-success, bg-status-success/15, text-status-warning, text-destructive</div>
        </div>
      </div>
    </div>
  `,

  'rules-brand-colors': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Brand color usage</span>

      <div class="example-row">
        <div class="example-card is-good">
          <span class="ec-tag">✓ Brand as CTA — high-emphasis action</span>
          <div class="ec-body"><button class="demo-btn demo-btn-primary">Approve &amp; continue</button></div>
          <div class="ec-code">bg-primary text-primary-foreground</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ Brand as focus / active state</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-outline" style="box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 40%, transparent);">Focused input</button>
          </div>
          <div class="ec-code">ring-2 ring-primary/40</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Brand scale — primitive ramp (use sparingly)</span>
          <div class="ec-body" style="display:block;">
            <div class="brand-row">
              ${[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => {
                // approximate lime ramp; the actual values live in variables.css
                const shades = {
                  50: '#fafee5', 100: '#f4fbc4', 200: '#ebf99a',
                  300: '#dff463', 400: '#E6F993', 500: '#c0e032',
                  600: '#9fbb1f', 700: '#7e911b', 800: '#65741c',
                  900: '#56631e', 950: '#2e370a',
                };
                const bg = shades[n];
                const fg = n >= 500 ? '#02060C' : '#02060C';
                return `<div class="brand-cell" style="background:${bg};color:${fg};">${n}</div>`;
              }).join('')}
            </div>
          </div>
          <div class="ec-code">brand-50 → brand-950 (use semantic primary in app code)</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ Brand-300/400 as text on light bg</span>
          <div class="ec-body"><p style="color:#dff463; background:#fff; padding:8px 12px; border-radius:4px; margin:0; font-size:14px;">Body text in brand-300</p></div>
          <div class="ec-code">text-brand-300 on bg-white — contrast fails</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ Brand as panel bg + dark text</span>
          <div class="ec-body"><div style="background:var(--primary); color:var(--primary-fg); padding:10px 14px; border-radius:6px; font-weight:600; font-size:14px;">Highlighted panel</div></div>
          <div class="ec-code">bg-primary text-primary-foreground</div>
        </div>
      </div>
    </div>
  `,

  'rules-containers': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Containers &amp; cards</span>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Real card composition</span>
          <div class="ec-body" style="display:block;">
            <div class="mock-card">
              <div class="mc-header">
                <div>
                  <div class="mc-title">SO2604102</div>
                  <div class="mc-sub">Leland Furniture</div>
                </div>
                <span class="status-pill status-success">${ICON.check} Reviewed</span>
              </div>
              <div class="mc-row"><span class="mc-label">Date</span><span class="mc-value">Mar 28, 2025</span></div>
              <div class="mc-row"><span class="mc-label">Discount</span><span class="mc-value">60.8% avg</span></div>
              <div class="mc-row"><span class="mc-label">Total</span><span class="mc-value">$4,159.12</span></div>
            </div>
          </div>
          <div class="ec-code">bg-card border border-border rounded-xl + shadow-sm</div>
        </div>

        <div class="example-card">
          <span class="ec-tag">Nested surfaces inside a card</span>
          <div class="ec-body" style="display:block;">
            <div class="surface-demo" style="padding:16px;">
              <div class="sd-card">
                <span class="sd-label">Card body</span>
                <div class="sd-muted"><span class="sd-label">Sub-panel</span></div>
              </div>
            </div>
          </div>
          <div class="ec-code">bg-background &gt; bg-card &gt; bg-muted</div>
        </div>
      </div>
    </div>
  `,

  'rules-buttons': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Button variants &amp; states</span>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Variants</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-primary">Default</button>
            <button class="demo-btn demo-btn-secondary">Secondary</button>
            <button class="demo-btn demo-btn-outline">Outline</button>
            <button class="demo-btn demo-btn-ghost">Ghost</button>
            <button class="demo-btn demo-btn-destructive">Destructive</button>
            <button class="demo-btn demo-btn-link">Link</button>
          </div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">States</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-primary">Default</button>
            <button class="demo-btn demo-btn-primary" style="filter: brightness(0.9);">Hover</button>
            <button class="demo-btn demo-btn-primary" style="box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 40%, transparent);">Focus</button>
            <button class="demo-btn demo-btn-disabled" disabled>Disabled</button>
            <button class="demo-btn demo-btn-primary">${ICON.download} With icon</button>
          </div>
        </div>
        <div class="example-card">
          <span class="ec-tag">Action hierarchy in a row</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-outline">Cancel</button>
            <button class="demo-btn demo-btn-primary">Save changes</button>
          </div>
          <div class="ec-code">Single primary CTA; outline for secondary actions</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ Two primary CTAs competing</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-primary">Approve</button>
            <button class="demo-btn demo-btn-primary">Reject</button>
          </div>
          <div class="ec-code">Demote one to outline or destructive</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ Primary + outline + destructive</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-destructive">Reject</button>
            <button class="demo-btn demo-btn-outline">Skip</button>
            <button class="demo-btn demo-btn-primary">Approve</button>
          </div>
        </div>
      </div>
    </div>
  `,

  'rules-icons': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Icon sizes &amp; tones</span>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Sizes — 12 · 14 · 16 · 20 · 24 px</span>
          <div class="ec-body" style="align-items:center;">
            <span class="icon-pair">${ICON.iconSized(12)} 12 (inline)</span>
            <span class="icon-pair">${ICON.iconSized(14)} 14 (dense)</span>
            <span class="icon-pair">${ICON.iconSized(16)} 16 (default)</span>
            <span class="icon-pair">${ICON.iconSized(20)} 20 (button)</span>
            <span class="icon-pair">${ICON.iconSized(24)} 24 (heading)</span>
          </div>
          <div class="ec-code">h-3, h-3.5, h-4, h-5, h-6 (lucide / heroicons)</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Tone — driven by semantic color</span>
          <div class="ec-body">
            <span class="icon-pair icon-tone-success">${ICON.check} text-status-success</span>
            <span class="icon-pair icon-tone-warning">${ICON.alert} text-status-warning</span>
            <span class="icon-pair icon-tone-destructive">${ICON.alert} text-destructive</span>
            <span class="icon-pair icon-tone-muted">${ICON.info} text-muted-foreground</span>
          </div>
        </div>
        <div class="example-card is-bad">
          <span class="ec-tag">✕ Hardcoded color on the SVG</span>
          <div class="ec-body">
            <span class="icon-pair" style="color:#22c55e;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> stroke="#22c55e"</span>
          </div>
          <div class="ec-code">Use className="text-status-success" — SVG inherits via currentColor</div>
        </div>
      </div>
    </div>
  `,

  'rules-typography': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Type scale</span>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Hierarchy</span>
          <div class="ec-body" style="display:block;">
            <div class="type-scale">
              <div class="type-row"><span class="t-tag">h1 / 32</span><span class="type-h1">Display heading</span></div>
              <div class="type-row"><span class="t-tag">h2 / 24</span><span class="type-h2">Section heading</span></div>
              <div class="type-row"><span class="t-tag">h3 / 18</span><span class="type-h3">Subsection</span></div>
              <div class="type-row"><span class="t-tag">eyebrow</span><span class="type-h4">Eyebrow label</span></div>
              <div class="type-row"><span class="t-tag">body / 15</span><span class="type-body">Body copy is the canonical text. Use this for paragraph content.</span></div>
              <div class="type-row"><span class="t-tag">small / 12</span><span class="type-small">Helper / meta text</span></div>
              <div class="type-row"><span class="t-tag">mono</span><code>const sample = "monospace inline"</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  'rules-elevation': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Elevation levels</span>

      <div class="example-row">
        <div class="example-card">
          <span class="ec-tag">Shadows — sm · md · lg · xl</span>
          <div class="ec-body" style="display:block;">
            <div class="elev-row">
              <div class="elev-card elev-sm">shadow-sm</div>
              <div class="elev-card elev-md">shadow-md</div>
              <div class="elev-card elev-lg">shadow-lg</div>
              <div class="elev-card elev-xl">shadow-xl</div>
            </div>
          </div>
          <div class="ec-code">shadow-sm inputs · shadow-md cards · shadow-lg dialogs · shadow-xl overlays</div>
        </div>
      </div>
    </div>
  `,

  'anti-patterns': `
    <div class="visual-examples">
      <span class="ve-label">Visual examples · Anti-pattern pairs</span>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ ERROR 01 — raw Tailwind state color</span>
          <div class="ec-body"><span style="color:#22c55e; font-weight:600;">Saved!</span></div>
          <div class="ec-code">text-green-500</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ Semantic state token</span>
          <div class="ec-body"><span style="color:var(--success); font-weight:600;">Saved!</span></div>
          <div class="ec-code">text-status-success</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ ERROR 02 — bg-white / bg-zinc-900</span>
          <div class="ec-body">
            <div style="background:#fff; color:#000; border:1px solid #e5e7eb; padding:10px 12px; border-radius:6px; font-size:13px;">Hardcoded surface</div>
          </div>
          <div class="ec-code">bg-white / bg-zinc-900</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ Semantic surface token</span>
          <div class="ec-body">
            <div style="background:var(--card); color:var(--fg); border:1px solid var(--border); padding:10px 12px; border-radius:6px; font-size:13px;">Adaptive surface</div>
          </div>
          <div class="ec-code">bg-card / bg-background / bg-muted</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ ERROR 06 — clickable without hover</span>
          <div class="ec-body"><button class="demo-btn" style="background:var(--card); color:var(--fg); border:1px solid var(--border);">No transition</button></div>
          <div class="ec-code">No hover:, no transition-colors</div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ Hover + transition</span>
          <div class="ec-body"><button class="demo-btn demo-btn-secondary" onmouseover="this.style.background='var(--muted)'" onmouseout="this.style.background='var(--card)'" style="transition:background 0.15s;">Hover me</button></div>
          <div class="ec-code">hover:bg-muted transition-colors</div>
        </div>
      </div>

      <div class="example-row">
        <div class="example-card is-bad">
          <span class="ec-tag">✕ ERROR 09 — multiple primary CTAs</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-primary">Approve</button>
            <button class="demo-btn demo-btn-primary">Reject</button>
            <button class="demo-btn demo-btn-primary">Skip</button>
          </div>
        </div>
        <div class="example-card is-good">
          <span class="ec-tag">✓ One primary, rest demoted</span>
          <div class="ec-body">
            <button class="demo-btn demo-btn-ghost">Skip</button>
            <button class="demo-btn demo-btn-outline">Reject</button>
            <button class="demo-btn demo-btn-primary">Approve</button>
          </div>
        </div>
      </div>
    </div>
  `,
};

// ── Helpers ────────────────────────────────────────────────────────────

function read(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

const MD_OPTIONS = { gfm: true, headerIds: false, mangle: false };

// ── marked renderer override — inject example block after each heading ──

let activeSectionExamples = {};

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const raw = tokens.map((t) => t.text || t.raw || '').join('').trim();
      const slug = slugify(raw);
      const example = activeSectionExamples[slug];
      const headingHtml = `<h${depth} id="${slug}">${text}</h${depth}>\n`;
      return headingHtml + (example ? renderExampleBlock(example, slug) : '');
    },
  },
});

function renderExampleBlock(example, slug) {
  const { eyebrow, explanation, visual, code, howto } = example;
  return `
<aside class="ve-block" data-key="${slug}">
  <header class="ve-block-head">
    <span class="ve-block-eyebrow">Example${eyebrow ? ` · ${eyebrow}` : ''}</span>
  </header>
  ${explanation ? `<p class="ve-block-explanation">${explanation}</p>` : ''}
  ${visual ? `<div class="ve-block-visual">${visual}</div>` : ''}
  ${code ? `<pre class="ve-block-code"><code>${escapeHtml(code)}</code></pre>` : ''}
  ${howto ? `<p class="ve-block-howto"><strong>How to use:</strong> ${howto}</p>` : ''}
</aside>
`;
}

function renderMarkdown(md, sectionId) {
  // Strip the top-level `# title` (we render our own <h2> per section)
  const withoutTitle = md.replace(/^#\s+[^\n]+\n+/, '');
  // Bind the example map for THIS section before parsing — the marked
  // renderer reads `activeSectionExamples` via closure.
  const previous = activeSectionExamples;
  activeSectionExamples = EXAMPLES_BY_HEADING[sectionId] ?? {};
  try {
    return marked.parse(withoutTitle, MD_OPTIONS);
  } finally {
    activeSectionExamples = previous;
  }
}

/**
 * Parse a tokens CSS file into Map<tokenName, value>.
 * Accepts both `:root { ... }` and `.dark { ... }` blocks (handled transparently
 * because we match `--name: value;` lines anywhere).
 */
function parseTokens(css) {
  const tokens = new Map();
  const re = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gim;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1].trim();
    const value = m[2].trim();
    if (!tokens.has(name)) tokens.set(name, value);
  }
  return tokens;
}

function categoryOf(name) {
  if (name.startsWith('--color-chart')) return 'Chart';
  if (name.startsWith('--color-sidebar')) return 'Sidebar';
  if (name.startsWith('--color-brand')) return 'Brand scale';
  if (name.startsWith('--color-')) return 'Semantic colors';
  if (name.startsWith('--shadow-')) return 'Shadow / elevation';
  if (name.startsWith('--radius')) return 'Radius';
  if (name.startsWith('--font-')) return 'Typography';
  if (name.startsWith('--spacing')) return 'Spacing';
  return 'Other';
}

const CAT_ORDER = [
  'Semantic colors',
  'Brand scale',
  'Sidebar',
  'Chart',
  'Shadow / elevation',
  'Radius',
  'Typography',
  'Spacing',
  'Other',
];

function isColor(value) {
  return /^(#|rgb|hsl|oklch|var\()/i.test(value.trim());
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTokenTable(light, dark) {
  const names = Array.from(new Set([...light.keys(), ...dark.keys()])).sort();
  const grouped = new Map();
  for (const name of names) {
    const cat = categoryOf(name);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(name);
  }

  let html = '';
  for (const cat of CAT_ORDER) {
    const rows = grouped.get(cat);
    if (!rows || rows.length === 0) continue;
    html += `<h3>${cat}</h3>\n`;
    html += '<table class="token-table"><thead><tr>';
    html += '<th>Token</th><th>Light</th><th>Dark</th>';
    html += '</tr></thead><tbody>';
    for (const name of rows) {
      const l = light.get(name) ?? '—';
      const d = dark.get(name) ?? '—';
      html += '<tr>';
      html += `<td class="token-name"><code>${escapeHtml(name)}</code></td>`;
      html += `<td class="token-value">${swatch(l)}<code>${escapeHtml(l)}</code></td>`;
      html += `<td class="token-value">${swatch(d)}<code>${escapeHtml(d)}</code></td>`;
      html += '</tr>';
    }
    html += '</tbody></table>\n';
  }
  return html;
}

function swatch(value) {
  if (!isColor(value)) return '';
  return `<span class="swatch" style="background:${escapeHtml(value)}" aria-hidden="true"></span>`;
}

// ── Style ──────────────────────────────────────────────────────────────
// Hard-coded from variables.css so the guide stays self-contained even when
// opened with file://. The HTML chrome respects light/dark via a manual
// toggle that toggles the `.dark` class on <html>.

function buildStyle(tokensLight, tokensDark) {
  const pick = (m, k) => m.get(k) ?? '#000';
  const tL = {
    bg: pick(tokensLight, '--color-background'),
    fg: pick(tokensLight, '--color-foreground'),
    card: pick(tokensLight, '--color-card'),
    muted: pick(tokensLight, '--color-muted'),
    mutedFg: pick(tokensLight, '--color-muted-foreground'),
    border: pick(tokensLight, '--color-border'),
    primary: pick(tokensLight, '--color-primary'),
    primaryFg: pick(tokensLight, '--color-primary-foreground'),
    accent: pick(tokensLight, '--color-accent') || '#fafafa',
    destructive: pick(tokensLight, '--color-destructive'),
    success: pick(tokensLight, '--color-success') || '#10B981',
    warning: pick(tokensLight, '--color-warning') || '#F59E0B',
  };
  const tD = {
    bg: pick(tokensDark, '--color-background'),
    fg: pick(tokensDark, '--color-foreground'),
    card: pick(tokensDark, '--color-card'),
    muted: pick(tokensDark, '--color-muted'),
    mutedFg: pick(tokensDark, '--color-muted-foreground'),
    border: pick(tokensDark, '--color-border'),
    primary: pick(tokensDark, '--color-primary'),
    primaryFg: pick(tokensDark, '--color-primary-foreground'),
    accent: pick(tokensDark, '--color-accent') || '#171717',
    destructive: pick(tokensDark, '--color-destructive'),
    success: pick(tokensDark, '--color-success') || '#10B981',
    warning: pick(tokensDark, '--color-warning') || '#F59E0B',
  };

  return `
:root {
  --bg: ${tL.bg};
  --fg: ${tL.fg};
  --card: ${tL.card};
  --muted: ${tL.muted};
  --muted-fg: ${tL.mutedFg};
  --border: ${tL.border};
  --primary: ${tL.primary};
  --primary-fg: ${tL.primaryFg};
  --accent: ${tL.accent};
  --destructive: ${tL.destructive};
  --success: ${tL.success};
  --warning: ${tL.warning};
}
html.dark {
  --bg: ${tD.bg};
  --fg: ${tD.fg};
  --card: ${tD.card};
  --muted: ${tD.muted};
  --muted-fg: ${tD.mutedFg};
  --border: ${tD.border};
  --primary: ${tD.primary};
  --primary-fg: ${tD.primaryFg};
  --accent: ${tD.accent};
  --destructive: ${tD.destructive};
  --success: ${tD.success};
  --warning: ${tD.warning};
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  transition: background-color 0.2s ease, color 0.2s ease;
}

a { color: var(--fg); text-decoration: underline; text-decoration-color: var(--border); text-underline-offset: 3px; }
a:hover { text-decoration-color: var(--fg); }

code, pre, kbd, samp {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85em;
}
code {
  background: var(--muted);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  border: 1px solid var(--border);
}
pre {
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 12px 0;
}
pre > code {
  background: transparent;
  border: none;
  padding: 0;
}

h1, h2, h3, h4 { color: var(--fg); margin-top: 1.4em; margin-bottom: 0.5em; line-height: 1.25; }
h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-top: 0; }
h2 { font-size: 24px; font-weight: 700; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
h3 { font-size: 18px; font-weight: 700; }
h4 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted-fg); }

p { margin: 0.8em 0; }
ul, ol { padding-left: 1.4em; }
li { margin: 0.3em 0; }

strong { color: var(--fg); font-weight: 700; }
blockquote {
  border-left: 3px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  padding: 0.6em 1em;
  margin: 0.8em 0;
  border-radius: 0 6px 6px 0;
}

hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }

table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
th, td { padding: 8px 12px; text-align: left; vertical-align: top; }
thead { background: var(--muted); }
thead th { font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted-fg); }
tbody tr { border-top: 1px solid var(--border); }
tbody tr:nth-child(odd) { background: color-mix(in srgb, var(--muted) 30%, transparent); }

/* Layout */

.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

aside.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  background: var(--card);
  border-right: 1px solid var(--border);
  padding: 24px 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.brand .logo {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: var(--fg);
  color: var(--bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -0.02em;
}
.brand .title { font-weight: 800; font-size: 14px; }
.brand .meta { font-size: 11px; color: var(--muted-fg); }

nav.toc { display: flex; flex-direction: column; gap: 2px; margin-top: 12px; }
nav.toc a {
  text-decoration: none;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--muted-fg);
  transition: background 0.15s, color 0.15s;
}
nav.toc a:hover { background: var(--muted); color: var(--fg); }
nav.toc a.active {
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}

main.content {
  padding: 32px 48px 80px;
  max-width: 900px;
  margin: 0;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.page-header h1 { margin: 0; }
.page-header .subtitle { color: var(--muted-fg); font-size: 14px; margin-top: 4px; }

.theme-toggle {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--fg);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.theme-toggle:hover { background: var(--muted); }

section.guide-section {
  padding-top: 24px;
  scroll-margin-top: 16px;
}
section.guide-section + section.guide-section { margin-top: 32px; }

/* Tokens table */
.token-table { font-size: 13px; }
.token-name { width: 36%; }
.token-value { width: 32%; white-space: nowrap; }
.token-value code { font-size: 11.5px; }
.swatch {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 3px;
  border: 1px solid var(--border);
  vertical-align: middle;
  margin-right: 8px;
}

footer.guide-footer {
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted-fg);
  line-height: 1.5;
}

/* Print */
@media print {
  .layout { grid-template-columns: 1fr; }
  aside.sidebar { display: none; }
  main.content { max-width: 100%; padding: 0; }
  .theme-toggle { display: none; }
  section.guide-section { break-inside: avoid; }
  a { color: var(--fg); text-decoration: none; }
}

/* Narrow viewport */
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  aside.sidebar { position: static; height: auto; }
  main.content { padding: 24px 20px 60px; }
}

/* ── Visual examples ───────────────────────────────────────────────── */

.visual-examples {
  background: color-mix(in srgb, var(--muted) 50%, transparent);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px 20px;
  margin: 16px 0 28px;
}
.visual-examples > .ve-label {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted-fg);
  margin-bottom: 14px;
}
.example-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.example-row:last-child { margin-bottom: 0; }
.example-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.example-card.is-bad { border-color: color-mix(in srgb, var(--destructive) 50%, var(--border)); }
.example-card.is-good { border-color: color-mix(in srgb, var(--success) 50%, var(--border)); }
.example-card .ec-tag {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-fg);
}
.example-card.is-bad .ec-tag { color: var(--destructive); }
.example-card.is-good .ec-tag { color: var(--success); }
.example-card .ec-body { padding: 8px 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.example-card .ec-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  background: color-mix(in srgb, var(--muted) 60%, transparent);
  padding: 6px 8px;
  border-radius: 4px;
  color: var(--muted-fg);
  word-break: break-all;
}

/* Demo buttons */
.demo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  font-family: inherit;
  line-height: 1.2;
}
.demo-btn-primary { background: var(--primary); color: var(--primary-fg); }
.demo-btn-secondary { background: var(--card); color: var(--fg); border-color: var(--border); }
.demo-btn-outline { background: transparent; color: var(--fg); border-color: var(--border); }
.demo-btn-ghost { background: transparent; color: var(--fg); }
.demo-btn-destructive { background: var(--destructive); color: #fff; }
.demo-btn-link {
  background: transparent;
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
  padding-left: 0;
  padding-right: 0;
}
.demo-btn-disabled {
  background: var(--muted);
  color: var(--muted-fg);
  cursor: not-allowed;
  opacity: 0.7;
}

/* Surface hierarchy */
.surface-demo {
  background: var(--bg);
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 18px;
}
.surface-demo .sd-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 14px;
  margin-top: 10px;
}
.surface-demo .sd-muted {
  background: var(--muted);
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
}
.surface-demo .sd-label {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: color-mix(in srgb, var(--fg) 8%, transparent);
  padding: 2px 7px;
  border-radius: 3px;
  color: var(--muted-fg);
}

/* Sidebar inversion demo */
.sidebar-demo {
  display: grid;
  grid-template-columns: 140px 1fr;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  min-height: 140px;
}
.sidebar-demo .sd-side {
  background: var(--fg);
  color: var(--bg);
  padding: 12px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sidebar-demo .sd-side .sd-item {
  padding: 4px 8px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--bg) 12%, transparent);
}
.sidebar-demo .sd-side .sd-item.active { background: var(--primary); color: var(--primary-fg); }
.sidebar-demo .sd-main {
  background: var(--bg);
  padding: 14px;
  font-size: 12px;
  color: var(--muted-fg);
}

/* Status colors */
.status-row { display: flex; gap: 10px; flex-wrap: wrap; }
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status-success { color: var(--success); background: color-mix(in srgb, var(--success) 12%, transparent); }
.status-warning { color: var(--warning); background: color-mix(in srgb, var(--warning) 14%, transparent); }
.status-destructive { color: var(--destructive); background: color-mix(in srgb, var(--destructive) 12%, transparent); }
.status-info { color: var(--fg); background: var(--muted); }

/* Brand swatches */
.brand-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 6px; }
.brand-cell {
  border-radius: 6px;
  padding: 10px 6px;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  font-family: ui-monospace, monospace;
}

/* Typography scale */
.type-scale { display: flex; flex-direction: column; gap: 8px; }
.type-row { display: flex; align-items: baseline; gap: 14px; }
.type-row .t-tag {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: var(--muted-fg);
  min-width: 54px;
  flex-shrink: 0;
}
.type-h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
.type-h2 { font-size: 24px; font-weight: 700; line-height: 1.2; }
.type-h3 { font-size: 18px; font-weight: 600; }
.type-h4 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted-fg); }
.type-body { font-size: 15px; }
.type-small { font-size: 12px; color: var(--muted-fg); }

/* Icons demo */
.icon-row { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.icon-pair {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--muted);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--muted-fg);
}
.icon-pair svg { color: var(--fg); }
.icon-tone-success svg { color: var(--success); }
.icon-tone-warning svg { color: var(--warning); }
.icon-tone-destructive svg { color: var(--destructive); }
.icon-tone-muted svg { color: var(--muted-fg); }

/* Elevation cards */
.elev-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; padding: 8px; }
.elev-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 18px 14px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-fg);
}
.elev-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.elev-md { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06); }
.elev-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.06); }
.elev-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.06); }

/* ── Per-sub-rule example block ────────────────────────────────────── */

.ve-block {
  margin: 18px 0 26px;
  padding: 18px 20px;
  background: color-mix(in srgb, var(--muted) 38%, transparent);
  border: 1px solid var(--border);
  border-left: 3px solid var(--primary);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ve-block-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ve-block-eyebrow {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg);
  background: var(--primary);
  color: var(--primary-fg);
  padding: 3px 8px;
  border-radius: 3px;
}
.ve-block-explanation {
  font-size: 14px;
  line-height: 1.55;
  margin: 0;
  color: var(--fg);
  max-width: 760px;
}
.ve-block-explanation code,
.ve-block-howto code {
  background: var(--card);
  border: 1px solid var(--border);
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 3px;
}
.ve-block-visual {
  margin: 0;
}
.ve-block-visual > .example-row { margin: 0; }
.ve-block-code {
  margin: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 14px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.55;
}
.ve-block-code code {
  background: transparent;
  border: none;
  padding: 0;
  font-size: inherit;
  white-space: pre;
}
.ve-block-howto {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  padding: 10px 14px;
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  border-radius: 6px;
  color: var(--fg);
  max-width: 760px;
}
.ve-block-howto strong {
  color: var(--fg);
  font-weight: 700;
}

@media print {
  .ve-block {
    page-break-inside: avoid;
    border-left-width: 1px;
    background: transparent;
  }
}

/* ── Copy-code button (injected on every <pre>) ───────────────────── */

pre {
  position: relative;
  padding-right: 64px;
}
.copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--card);
  color: var(--muted-fg);
  border: 1px solid var(--border);
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1;
}
pre:hover .copy-btn { opacity: 1; }
.copy-btn:focus-visible { opacity: 1; outline: 2px solid var(--primary); outline-offset: 1px; }
.copy-btn:hover {
  color: var(--fg);
  background: var(--muted);
}
.copy-btn.is-copied {
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 50%, var(--border));
  opacity: 1;
}
.copy-btn.is-error {
  color: var(--destructive);
  border-color: color-mix(in srgb, var(--destructive) 50%, var(--border));
  opacity: 1;
}
.copy-btn svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
@media print { .copy-btn { display: none !important; } }

/* Mock card composition */
.mock-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  max-width: 340px;
}
.mock-card .mc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.mock-card .mc-title { font-size: 14px; font-weight: 700; color: var(--fg); }
.mock-card .mc-sub { font-size: 11px; color: var(--muted-fg); }
.mock-card .mc-row { display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid var(--border); font-size: 12px; }
.mock-card .mc-row:first-of-type { border-top: none; }
.mock-card .mc-row .mc-label { color: var(--muted-fg); }
.mock-card .mc-row .mc-value { color: var(--fg); font-weight: 600; }
`;
}

// ── Scroll-spy JS (vanilla, no deps) ───────────────────────────────────

const SCRIPT = `
(function () {
  // Theme toggle with localStorage persistence
  var html = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('strata-guide-theme'); } catch (_) {}
  if (saved === 'dark') html.classList.add('dark');
  else if (saved === 'light') html.classList.remove('dark');
  else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) html.classList.add('dark');

  var btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', function () {
      var nowDark = html.classList.toggle('dark');
      try { localStorage.setItem('strata-guide-theme', nowDark ? 'dark' : 'light'); } catch (_) {}
      btn.textContent = nowDark ? 'Light mode' : 'Dark mode';
    });
    btn.textContent = html.classList.contains('dark') ? 'Light mode' : 'Dark mode';
  }

  // Copy-code buttons — inject into every <pre><code> block
  var COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  function setupCopyButtons() {
    document.querySelectorAll('pre').forEach(function (pre) {
      if (pre.querySelector(':scope > .copy-btn')) return;
      var code = pre.querySelector(':scope > code');
      var text = (code ? code.textContent : pre.textContent) || '';
      if (!text.trim()) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      btn.innerHTML = COPY_SVG + '<span>Copy</span>';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var payload = (code ? code.textContent : pre.textContent) || '';
        var done = function () {
          btn.classList.remove('is-error');
          btn.classList.add('is-copied');
          btn.innerHTML = CHECK_SVG + '<span>Copied</span>';
          setTimeout(function () {
            btn.classList.remove('is-copied');
            btn.innerHTML = COPY_SVG + '<span>Copy</span>';
          }, 1600);
        };
        var fail = function () {
          btn.classList.add('is-error');
          btn.innerHTML = '<span>Failed</span>';
          setTimeout(function () {
            btn.classList.remove('is-error');
            btn.innerHTML = COPY_SVG + '<span>Copy</span>';
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(payload).then(done).catch(function () {
            // Fallback for browsers that block clipboard on file://
            try {
              var ta = document.createElement('textarea');
              ta.value = payload;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              done();
            } catch (_) { fail(); }
          });
        } else {
          try {
            var ta = document.createElement('textarea');
            ta.value = payload;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            done();
          } catch (_) { fail(); }
        }
      });
      pre.appendChild(btn);
    });
  }
  setupCopyButtons();

  // Scroll-spy
  var sections = Array.prototype.slice.call(document.querySelectorAll('section.guide-section'));
  var links = {};
  document.querySelectorAll('nav.toc a[data-id]').forEach(function (a) {
    links[a.getAttribute('data-id')] = a;
  });
  function setActive(id) {
    Object.keys(links).forEach(function (k) {
      links[k].classList.toggle('active', k === id);
    });
  }
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (s) { obs.observe(s); });
  }
})();
`;

// ── Build ──────────────────────────────────────────────────────────────

function build() {
  console.log('Strata DS — Rules Guide generator');
  console.log('─'.repeat(50));

  // 1. Load markdown sources
  let totalSubExamples = 0;
  const sectionsHtml = SECTIONS.map((s) => {
    const md = read(s.file);
    const body = renderMarkdown(md, s.id);
    const sectionExamples = EXAMPLES_BY_HEADING[s.id] ?? {};
    const count = Object.keys(sectionExamples).length;
    totalSubExamples += count;
    const tag = count > 0 ? ` · ${count} sub-examples` : '';
    console.log(`  · ${s.file.padEnd(48)} ${md.split('\n').length} lines${tag}`);
    return {
      id: s.id,
      title: s.title,
      file: s.file,
      html: body,
    };
  });
  console.log(`  · total sub-rule examples injected: ${totalSubExamples}`);

  // 2. Load + parse token CSS
  const lightCss = read(TOKENS_LIGHT);
  const darkCss = read(TOKENS_DARK);
  const lightTokens = parseTokens(lightCss);
  const darkTokens = parseTokens(darkCss);
  console.log(`  · ${TOKENS_LIGHT.padEnd(48)} ${lightTokens.size} tokens`);
  console.log(`  · ${TOKENS_DARK.padEnd(48)} ${darkTokens.size} tokens`);

  const tokenTableHtml = buildTokenTable(lightTokens, darkTokens);

  // 3. Compose final document
  const generatedAt = new Date().toISOString();
  const style = buildStyle(lightTokens, darkTokens);

  const navLinks = [
    ...sectionsHtml.map((s) => `      <a href="#${s.id}" data-id="${s.id}">${s.title}</a>`),
    `      <a href="#css-tokens" data-id="css-tokens">CSS tokens (live)</a>`,
  ].join('\n');

  const sectionsBlocks = sectionsHtml
    .map((s) => {
      const examples = EXAMPLES[s.id] ?? '';
      return `
    <section id="${s.id}" class="guide-section">
      <h2>${s.title}</h2>
      ${examples}
      ${s.html}
    </section>`;
    })
    .join('\n');

  const cssTokensBlock = `
    <section id="css-tokens" class="guide-section">
      <h2>CSS tokens (live)</h2>
      <p>Auto-generated from <code>src/styles/tokens/variables.css</code> and <code>src/styles/tokens/variables-dark.css</code>. Light and dark values are shown side by side. Use these exact token names — never inline a hex.</p>
      ${tokenTableHtml}
    </section>`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Strata DS — Rules Guide</title>
  <style>${style}</style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <span class="logo">ST</span>
        <div>
          <div class="title">Strata DS</div>
          <div class="meta">Rules Guide</div>
        </div>
      </div>
      <nav class="toc" aria-label="Table of contents">
${navLinks}
      </nav>
    </aside>

    <main class="content">
      <div class="page-header">
        <div>
          <h1>Strata DS — Rules Guide</h1>
          <div class="subtitle">Generated ${generatedAt} · ${SECTIONS.length} rule files · ${Object.keys(EXAMPLES).length} overview blocks + ${totalSubExamples} sub-rule examples · ${lightTokens.size} CSS tokens</div>
        </div>
        <button id="theme-toggle" class="theme-toggle" type="button">Toggle theme</button>
      </div>

      ${sectionsBlocks}
      ${cssTokensBlock}

      <footer class="guide-footer">
        <p>This guide is auto-generated from the canonical <code>governance/</code> markdown files and the live token CSS in <code>src/styles/tokens/</code>. Re-run <code>node governance/build-guide.mjs</code> after editing any source. The MCP <code>strata-ds</code> server reads the same files.</p>
        <p>If the CSS tokens table reflects unexpected values, check your working tree — uncommitted edits in <code>variables.css</code> and <code>variables-dark.css</code> are picked up as-is.</p>
      </footer>
    </main>
  </div>

  <script>${SCRIPT}</script>
</body>
</html>
`;

  writeFileSync(OUT, html, 'utf8');
  const kb = (statSync(OUT).size / 1024).toFixed(1);
  console.log('─'.repeat(50));
  console.log(`Wrote ${OUT.replace(ROOT + '\\', '').replace(ROOT + '/', '')} (${kb} KB) at ${generatedAt}`);
}

build();
