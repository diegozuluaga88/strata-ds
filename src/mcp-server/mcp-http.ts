import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import { validateCode, formatValidation } from './validator.js';
import { getGovernancePath } from './lib/source.js';
import { checkVersion, formatVersionReport } from './lib/version.js';
import { listComponents, formatComponentList } from './lib/components.js';
import { installSkill, formatInstallResult } from './lib/skills.js';

// Resolve governance path: F38.2 source layer (env override → gh tarball
// cache → bundled fallback). Backward-compat: GOVERNANCE_PATH env var still
// works (set as STRATA_LOCAL_ROOT first if present).
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (process.env.GOVERNANCE_PATH && !process.env.STRATA_LOCAL_ROOT) {
  process.env.STRATA_LOCAL_ROOT = process.env.GOVERNANCE_PATH;
}
// Last-resort: point STRATA_LOCAL_ROOT at the dev sibling governance/
// folder when nothing else is set (preserves existing dev ergonomics).
if (!process.env.STRATA_LOCAL_ROOT) {
  const devSibling = path.resolve(__dirname, '../../governance');
  if (fs.existsSync(path.join(devSibling, 'LAWS.md'))) {
    process.env.STRATA_LOCAL_ROOT = devSibling;
  }
}

function getGovernanceRoot(): string {
  return getGovernancePath();
}

const GOVERNANCE_PATH = getGovernanceRoot(); // resolved once; further calls use the cache.

function readGovernanceFile(relativePath: string): string {
  const root = getGovernanceRoot();
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) return `File not found: ${relativePath} (looked in ${filePath})`;
  return fs.readFileSync(filePath, 'utf-8');
}

function searchGovernance(query: string): string {
  const results: string[] = [];
  const queryLower = query.toLowerCase();
  const SEARCH_ROOT = getGovernanceRoot();

  function searchDir(dir: string, prefix = '') {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        searchDir(fullPath, relPath);
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.toLowerCase().includes(queryLower)) {
          const matches = content.split('\n')
            .filter(l => l.toLowerCase().includes(queryLower))
            .slice(0, 3)
            .map(l => `  > ${l.trim()}`);
          results.push(`### ${relPath}\n${matches.join('\n')}`);
        }
      }
    }
  }

  searchDir(SEARCH_ROOT);
  return results.length > 0
    ? `Found in ${results.length} file(s):\n\n${results.join('\n\n')}`
    : `No results for: "${query}"`;
}

// Keyword-based component recommender for plan_ui
const COMPONENT_KB = [
  { id: 'navbar', name: 'Navbar', keywords: ['navbar','nav','navigation','header','top bar','app bar'], import: `import { Navbar } from "@/components/application-ui/navbar"`, tokens: { 'bg-card/80': 'Frosted surface', 'border-border': 'Separator', 'text-foreground': 'Nav links', 'text-primary': 'Active' }, rationale: 'Standard full-width navigation bar.', example: `<Navbar logo={<Logo />} links={navLinks} />` },
  { id: 'navbar-floating', name: 'NavbarFloating', keywords: ['floating','pill','pill nav','floating nav','rounded nav'], import: `import { NavbarFloating } from "@/components/application-ui/navbar-floating"`, tokens: { 'bg-card/80': 'Frosted', 'rounded-full': 'Pill shape', 'shadow-lg': 'Elevation' }, rationale: 'Pill-shaped floating navbar — matches the Strata demo pattern.', example: `<NavbarFloating logo={<Logo />} tabs={tabs} />` },
  { id: 'sidebar', name: 'Sidebar', keywords: ['sidebar','side nav','left nav','lateral','side menu'], import: `import { Sidebar, SidebarContent, SidebarMenu } from "@/components/overlays/sidebar"`, tokens: { 'bg-sidebar': 'Background', 'text-sidebar-foreground': 'Text', 'bg-sidebar-accent': 'Active item' }, rationale: 'Collapsible sidebar — for dashboards and admin panels.', example: `<Sidebar><SidebarContent><SidebarMenu items={navItems} /></SidebarContent></Sidebar>` },
  { id: 'button', name: 'Button', keywords: ['cta','call to action','primary button'], import: `import { Button } from "@/components/application-ui/button"`, tokens: { 'bg-primary': 'CTA fill', 'text-primary-foreground': 'Always dark', 'bg-secondary': 'Secondary variant' }, rationale: 'Use variant="default" for CTAs, "secondary" for alternatives.', example: `<Button variant="default">Save</Button>` },
  { id: 'dialog', name: 'Dialog', keywords: ['modal','dialog','popup','overlay','lightbox'], import: `import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/overlays/dialog"`, tokens: { 'bg-card': 'Surface', 'bg-background/80': 'Backdrop', 'backdrop-blur-sm': 'Blur' }, rationale: 'Never build raw overlays — always use Dialog.', example: `<Dialog open={open} onOpenChange={setOpen}><DialogContent>...</DialogContent></Dialog>` },
  { id: 'alert-dialog', name: 'AlertDialog', keywords: ['confirm','destructive dialog','delete confirm','irreversible','danger'], import: `import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/overlays/alert-dialog"`, tokens: { 'bg-destructive': 'Destructive action', 'bg-card': 'Surface' }, rationale: 'For destructive/irreversible actions — forces explicit confirmation.', example: `<AlertDialog><AlertDialogContent>...</AlertDialogContent></AlertDialog>` },
  { id: 'table', name: 'Table', keywords: ['table','data table','grid','rows','columns','sortable','tabular'], import: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/application-ui/table"`, tokens: { 'bg-muted/50': 'Header + alt rows', 'border-border': 'Borders', 'hover:bg-muted/50': 'Row hover' }, rationale: 'Never use raw <table> — always use the DS Table components.', example: `<Table><TableHeader>...</TableHeader><TableBody>...</TableBody></Table>` },
  { id: 'card', name: 'Card', keywords: ['card','panel','container','surface','section','box','tile'], import: `import { Card, CardHeader, CardTitle, CardContent } from "@/components/application-ui/card"`, tokens: { 'bg-card': 'Surface', 'border-border': 'Border', 'rounded-xl': 'Radius' }, rationale: 'Standard surface container for grouping related content.', example: `<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>...</CardContent></Card>` },
  { id: 'kpi-card', name: 'KpiCard', keywords: ['kpi','metric','stat','statistic','dashboard card','analytics'], import: `import { KpiCard } from "@/components/application-ui/kpi-card"`, tokens: { 'text-status-success': 'Positive trend', 'text-status-error': 'Negative trend' }, rationale: 'Specialized card for metrics with trend indicator.', example: `<KpiCard label="Revenue" value="$42,500" trend="+12%" trendPositive />` },
  { id: 'form', name: 'Form + Field', keywords: ['form','formulario','input form','sign up','sign-in','signin','login','log in','register','registration','auth','authentication','password','email field','settings form','onboarding','wizard','credentials'], import: `import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/forms/form"`, tokens: { 'bg-input': 'Input bg', 'border-border': 'Border', 'text-status-error': 'Validation error' }, rationale: 'Use the Form system for all user input — sign-in, registration, settings, any field collection.', example: `<Form onSubmit={handleSubmit}><FormField name="email">...</FormField></Form>` },
  { id: 'badge', name: 'Badge', keywords: ['badge','tag','label','chip','status badge','indicator'], import: `import { Badge } from "@/components/application-ui/badge"`, tokens: { 'bg-primary/10': 'Default bg', 'bg-status-success/10': 'Success bg', 'text-status-success': 'Success text' }, rationale: 'Use Badge for all status labels — never raw colored spans.', example: `<Badge>Active</Badge><StatusBadge status="success">Done</StatusBadge>` },
  { id: 'dropdown-menu', name: 'DropdownMenu', keywords: ['dropdown','menu','context menu','actions menu','kebab','three dots'], import: `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/overlays/dropdown-menu"`, tokens: { 'bg-popover': 'Menu surface', 'hover:bg-accent': 'Item hover', 'text-destructive': 'Danger item' }, rationale: 'Never build custom positioned menus — use DropdownMenu.', example: `<DropdownMenu><DropdownMenuTrigger>...</DropdownMenuTrigger><DropdownMenuContent>...</DropdownMenuContent></DropdownMenu>` },
  { id: 'tabs', name: 'Tabs', keywords: ['tabs','tab','tabbed','tab panel','tab navigation'], import: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/application-ui/tabs"`, tokens: { 'bg-muted': 'List bg', 'bg-background': 'Active tab', 'text-muted-foreground': 'Inactive' }, rationale: 'Standard tab interface for switching between content sections.', example: `<Tabs defaultValue="overview"><TabsList>...</TabsList><TabsContent value="overview">...</TabsContent></Tabs>` },
  { id: 'alert', name: 'Alert', keywords: ['alert','notification','message','info box','warning','feedback','banner'], import: `import { Alert, AlertTitle, AlertDescription } from "@/components/overlays/alert"`, tokens: { 'bg-status-info/10': 'Info', 'bg-status-warning/10': 'Warning', 'bg-status-error/10': 'Error', 'bg-status-success/10': 'Success' }, rationale: 'Inline feedback — use semantic status tokens, never hardcoded colors.', example: `<Alert variant="info"><AlertTitle>Note</AlertTitle><AlertDescription>...</AlertDescription></Alert>` },
  { id: 'sheet', name: 'Sheet', keywords: ['sheet','slide panel','side panel','drawer','slide in','side drawer'], import: `import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/overlays/sheet"`, tokens: { 'bg-card': 'Surface', 'bg-background/80': 'Backdrop' }, rationale: 'Slide-in panel from the edge — for filters or secondary forms.', example: `<Sheet open={open} onOpenChange={setOpen}><SheetContent side="right">...</SheetContent></Sheet>` },
  { id: 'input', name: 'Input', keywords: ['input','text field','text input','search','search bar','campo'], import: `import { Input } from "@/components/forms/input"`, tokens: { 'bg-input': 'Input bg', 'border-border': 'Border', 'focus:border-primary': 'Focus ring' }, rationale: 'Never raw <input> — always use the DS Input with tokens.', example: `<Input type="text" placeholder="Search..." />` },
  { id: 'select', name: 'Select', keywords: ['select','dropdown select','picker','choose','options'], import: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select"`, tokens: { 'bg-input': 'Trigger', 'bg-popover': 'Dropdown', 'border-border': 'Border' }, rationale: 'Never raw <select> — use the DS Select.', example: `<Select><SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger><SelectContent>...</SelectContent></Select>` },
  { id: 'sonner', name: 'Sonner (Toast)', keywords: ['toast','toaster','notification toast','snackbar','sonner'], import: `import { Toaster } from "@/components/overlays/sonner"\nimport { toast } from "sonner"`, tokens: { 'bg-card': 'Toast surface', 'text-foreground': 'Text', 'bg-status-success': 'Success toast' }, rationale: 'Use Sonner for all transient notifications — never custom fixed divs.', example: `toast.success("Saved!"); toast.error("Something went wrong");` },
];

const ANTI_PATTERNS = [
  'Never hardcode hex values — use semantic tokens (bg-primary, text-foreground, bg-card)',
  'Never use brand-300/400 as text color on light backgrounds (contrast failure)',
  'Never build raw overlays with position:fixed — use Dialog, Sheet, or Drawer',
  'Never use bg-white/text-black without dark pair — use bg-background/text-foreground',
  'Never use raw status Tailwind (bg-green-500) — use bg-status-success',
  'Never use gray-* — use zinc-* scale or semantic tokens',
  'Never use explicit dark: classes for theming — use semantic tokens that auto-switch',
];

const RULES = [
  'LEY-1: Always use semantic tokens — never hex or raw Tailwind color classes',
  'LEY-4: Token priority: bg-primary > bg-brand-300 > bg-[#E6F993]',
  'LEY-5: Dark mode via tokens only — not explicit dark: classes (except sidebar)',
];

function planUI(description: string): string {
  const lower = description.toLowerCase();
  const scored = COMPONENT_KB.map(c => ({
    c,
    score: c.keywords.reduce((s, kw) => s + (lower.includes(kw) ? (kw.length > 5 ? 2 : 1) : 0), 0),
  })).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const primary = top.score > 0 ? top.c : COMPONENT_KB.find(c => c.id === 'card')!;
  const alts = scored.filter(s => s.score > 0 && s.c.id !== primary.id).slice(0, 3);

  return JSON.stringify({
    query: description,
    primary_recommendation: {
      component: primary.name,
      id: primary.id,
      rationale: primary.rationale,
      import: primary.import,
      tokens: primary.tokens,
      example: primary.example,
    },
    alternatives: alts.map(a => ({ component: a.c.name, when_to_choose: a.c.rationale, score: a.score })),
    rules_that_apply: RULES,
    anti_patterns: ANTI_PATTERNS,
    next_steps: [
      `Call get_component("${primary.id}") for full variant documentation`,
      'Call get_tokens() for the complete token reference',
      'Call get_anti_patterns() for all documented patterns to avoid',
    ],
  });
}

function createServer() {
  const server = new McpServer({ name: 'strata-ds', version: '1.0.0' });

  server.tool('plan_ui',
    '🚨 MANDATORY BEFORE ANY UI. Given a description, returns the recommended DS component, tokens, rules, and anti-patterns to avoid.',
    { description: z.string().describe('UI element to plan, e.g. "floating pill navbar with tabs"') },
    async ({ description }) => ({ content: [{ type: 'text', text: planUI(description) }] }));

  server.tool('get_laws',
    'Absolute DS laws — consult first before any new component.',
    {}, async () => ({ content: [{ type: 'text', text: readGovernanceFile('LAWS.md') }] }));

  server.tool('get_rules',
    'DS rules for a specific category. 17 categories cover: tokens (color/brand/typography/elevation), components (containers/buttons/icons), code conventions (code-usage), composition (modal-patterns, layout-density, spacing-rhythm, responsive-behavior, data-display), states (empty-states, loading-states), microcopy + accessibility.',
    { category: z.enum([
      'color-tokens', 'brand-colors', 'containers-and-cards',
      'buttons-and-actions', 'icons', 'typography', 'elevation', 'code-usage',
      'modal-patterns', 'layout-density', 'spacing-rhythm',
      'responsive-behavior', 'empty-states', 'loading-states',
      'microcopy-tone', 'accessibility-focus', 'data-display',
    ]) },
    async ({ category }) => {
      const map: Record<string, string> = {
        'color-tokens': 'rules/01-color-tokens.md',
        'brand-colors': 'rules/02-brand-colors.md',
        'containers-and-cards': 'rules/03-containers-and-cards.md',
        'buttons-and-actions': 'rules/04-buttons-and-actions.md',
        'icons': 'rules/05-icons.md',
        'typography': 'rules/06-typography.md',
        'elevation': 'rules/07-elevation.md',
        'code-usage': 'code-usage.md',
        'modal-patterns': 'rules/08-modal-patterns.md',
        'layout-density': 'rules/09-layout-density.md',
        'spacing-rhythm': 'rules/10-spacing-rhythm.md',
        'responsive-behavior': 'rules/11-responsive-behavior.md',
        'empty-states': 'rules/12-empty-states.md',
        'loading-states': 'rules/13-loading-states.md',
        'microcopy-tone': 'rules/14-microcopy-tone.md',
        'accessibility-focus': 'rules/15-accessibility-focus.md',
        'data-display': 'rules/16-data-display.md',
      };
      return { content: [{ type: 'text', text: readGovernanceFile(map[category]) }] };
    });

  server.tool('get_tokens',
    'Complete token reference — CSS vars + Tailwind classes by category.',
    {}, async () => ({ content: [{ type: 'text', text: readGovernanceFile('tokens/token-reference.md') }] }));

  server.tool('get_anti_patterns',
    'All documented errors and anti-patterns to avoid.',
    {}, async () => ({ content: [{ type: 'text', text: readGovernanceFile('anti-patterns/common-errors.md') }] }));

  server.tool('search_governance',
    'Full-text search across all governance docs.',
    { query: z.string() },
    async ({ query }) => ({ content: [{ type: 'text', text: searchGovernance(query) }] }));

  server.tool('get_overview',
    'High-level map of all DS governance: laws + tokens + anti-patterns + the headlines of every rule category. For full text of a specific rule call get_rules({category}).',
    {}, async () => {
      const ruleCategories: Array<[string, string]> = [
        ['color-tokens', 'rules/01-color-tokens.md'],
        ['brand-colors', 'rules/02-brand-colors.md'],
        ['containers-and-cards', 'rules/03-containers-and-cards.md'],
        ['buttons-and-actions', 'rules/04-buttons-and-actions.md'],
        ['icons', 'rules/05-icons.md'],
        ['typography', 'rules/06-typography.md'],
        ['elevation', 'rules/07-elevation.md'],
        ['code-usage', 'code-usage.md'],
        ['modal-patterns', 'rules/08-modal-patterns.md'],
        ['layout-density', 'rules/09-layout-density.md'],
        ['spacing-rhythm', 'rules/10-spacing-rhythm.md'],
        ['responsive-behavior', 'rules/11-responsive-behavior.md'],
        ['empty-states', 'rules/12-empty-states.md'],
        ['loading-states', 'rules/13-loading-states.md'],
        ['microcopy-tone', 'rules/14-microcopy-tone.md'],
        ['accessibility-focus', 'rules/15-accessibility-focus.md'],
        ['data-display', 'rules/16-data-display.md'],
      ];
      const ruleHeadlines = ruleCategories.map(([slug, path]) => {
        const md = readGovernanceFile(path);
        const headings = md.split('\n').filter((l) => /^##\s+/.test(l)).slice(0, 6);
        return `### ${slug}\n${headings.join('\n')}`;
      }).join('\n\n');
      const text = [
        '# Strata DS — Governance map\n',
        '> Call `get_rules({category})` for the full text of any category below.',
        '> Call `get_laws()`, `get_tokens()`, `get_anti_patterns()` for the full text of those.',
        '',
        '## LAWS\n', readGovernanceFile('LAWS.md'),
        '\n## TOKENS\n', readGovernanceFile('tokens/token-reference.md'),
        '\n## ANTI-PATTERNS\n', readGovernanceFile('anti-patterns/common-errors.md'),
        '\n## RULE CATEGORIES (headings only)\n', ruleHeadlines,
      ].join('\n');
      return { content: [{ type: 'text', text }] };
    });

  server.tool('get_component',
    'Spec for a DS component: variants, tokens, when to use, anti-patterns.',
    { id: z.string().describe('Component id, e.g. "button", "navbar-floating", "dialog"') },
    async ({ id }) => {
      const comp = COMPONENT_KB.find(c => c.id === id);
      if (!comp) return { content: [{ type: 'text', text: `Component "${id}" not found. Use search_governance to explore.` }] };
      return { content: [{ type: 'text', text: JSON.stringify(comp, null, 2) }] };
    });

  server.tool('get_foundations',
    'DS foundations: colors, typography, spacing, borders, shadows.',
    { section: z.enum(['colors', 'typography', 'spacing', 'borders', 'shadows', 'all']).optional() },
    async ({ section = 'all' }) => {
      const text = section === 'all'
        ? readGovernanceFile('tokens/token-reference.md')
        : readGovernanceFile('tokens/token-reference.md'); // can be split by section later
      return { content: [{ type: 'text', text }] };
    });

  server.tool('report_error',
    'Report a DS violation or gap to be tracked.',
    { description: z.string(), context: z.string().optional() },
    async ({ description, context }) => ({
      content: [{ type: 'text', text: `DS gap/violation reported:\n\nDescription: ${description}\nContext: ${context || 'n/a'}\n\nThis will be reviewed by the DS team.` }],
    }));

  server.tool('get_session_briefing',
    'Compact briefing for the start of a session: laws + tokens snapshot + headlines of every rule category + workflow. Call this BEFORE generating any UI. Keep it under 4 KB so it fits cheaply in context.',
    {}, async () => {
      const laws = readGovernanceFile('LAWS.md');
      const RULE_FILES: Array<[string, string]> = [
        ['color-tokens', 'rules/01-color-tokens.md'],
        ['brand-colors', 'rules/02-brand-colors.md'],
        ['containers-and-cards', 'rules/03-containers-and-cards.md'],
        ['buttons-and-actions', 'rules/04-buttons-and-actions.md'],
        ['icons', 'rules/05-icons.md'],
        ['typography', 'rules/06-typography.md'],
        ['elevation', 'rules/07-elevation.md'],
        ['code-usage', 'code-usage.md'],
        ['modal-patterns', 'rules/08-modal-patterns.md'],
        ['layout-density', 'rules/09-layout-density.md'],
        ['spacing-rhythm', 'rules/10-spacing-rhythm.md'],
        ['responsive-behavior', 'rules/11-responsive-behavior.md'],
        ['empty-states', 'rules/12-empty-states.md'],
        ['loading-states', 'rules/13-loading-states.md'],
        ['microcopy-tone', 'rules/14-microcopy-tone.md'],
        ['accessibility-focus', 'rules/15-accessibility-focus.md'],
        ['data-display', 'rules/16-data-display.md'],
      ];
      const briefing = RULE_FILES.map(([slug, file]) => {
        const md = readGovernanceFile(file);
        const heading = (md.split('\n').find((l) => /^#\s+/.test(l)) ?? '').replace(/^#\s+/, '');
        const firstH2 = (md.split('\n').find((l) => /^##\s+/.test(l)) ?? '').replace(/^##\s+/, '');
        return `- **${slug}** — ${heading}${firstH2 ? ` · first sub-rule: ${firstH2}` : ''}`;
      }).join('\n');
      const text = [
        '# Strata DS — Session briefing',
        '',
        '## Absolute laws',
        laws,
        '',
        '## Rule categories (17 total)',
        briefing,
        '',
        '## Mandatory workflow',
        '1. Read these laws before generating UI.',
        '2. For any new component: call `plan_ui({description})`.',
        '3. For specific guidance: call `get_rules({category})`.',
        '4. For exact token values: call `get_tokens()`.',
        '5. Before committing AI-generated TSX: call `validate_component_against_rules({code})` and fix every reported error.',
      ].join('\n');
      return { content: [{ type: 'text', text }] };
    });

  server.tool('check_version',
    'Check whether the consumer project is on the latest published Strata DS version. Walks up from the search root looking for a package.json that depends on the DS, then compares against the latest GitHub release.',
    { searchRoot: z.string().optional().describe('Project root to walk up from. Defaults to process.cwd().') },
    async ({ searchRoot }) => {
      const report = checkVersion(searchRoot);
      return { content: [{ type: 'text', text: formatVersionReport(report) }] };
    });

  server.tool('list_components',
    'Grouped catalog of every DS component (Strata Components, Application UI, Forms, Overlays, Data Visualization). Each entry includes the canonical import string.',
    {}, async () => {
      const entries = listComponents();
      return { content: [{ type: 'text', text: formatComponentList(entries) }] };
    });

  server.tool('install_skill',
    'Installs the planning-strata-ui Agent Skill into either the current project (./.claude/skills/) or the current user (~/.claude/skills/). The skill teaches a coding agent the canonical workflow for any Strata UI task.',
    {
      target: z.enum(['user', 'project']).describe('Where to install the skill.'),
      projectRoot: z.string().optional().describe('Project root path. Used when target=project. Defaults to process.cwd().'),
    },
    async ({ target, projectRoot }) => {
      const r = installSkill(target, projectRoot);
      return { content: [{ type: 'text', text: formatInstallResult(r) }] };
    });

  server.tool('validate_component_against_rules',
    'Lint a TSX / JSX / CSS snippet against the Strata DS rules. Returns per-violation: rule reference (LAW-N or rules/0X), severity, the offending match, a suggested fix. Use this before committing any component code generated by AI or hand-written.',
    {
      code: z.string().describe('The TSX, JSX, or CSS snippet to validate.'),
      filename: z.string().optional().describe('Optional filename for reporting context.'),
    },
    async ({ code, filename }) => {
      const result = validateCode(code, filename);
      return { content: [{ type: 'text', text: formatValidation(result) }] };
    });

  return server;
}

// ── (Validation engine extracted to ./validator.ts) ────────────────────
/*

interface Violation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  match: string;
  line: number;
  suggestion?: string;
}

interface Check {
  id: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  pattern: RegExp;
  message: string;
  suggestion?: string;
  // Optional: skip the match if a sibling pattern is present in the SAME line
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
    pattern: /\btext-(?:brand-[34]00|primary)\b/g,
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
    skipIfAlso: /\bprose\b|article|markdown/,  // long-form content is fine
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
];

function validateCode(code: string, filename?: string): { ok: boolean; violations: Violation[]; summary: { errors: number; warnings: number; infos: number } } {
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
    let m: RegExpExecArray | null;
    const rx = new RegExp(check.pattern.source, check.pattern.flags.includes('g') ? check.pattern.flags : check.pattern.flags + 'g');
    while ((m = rx.exec(code)) !== null) {
      const line = offsetToLine(m.index);
      // Skip if the same line has a "rescue" pattern
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

function formatValidation(r: { ok: boolean; violations: Violation[]; summary: { errors: number; warnings: number; infos: number } }): string {
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
  // Group by severity
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
*/

const PORT = 3001; // Railway networking is mapped to port 3001 — Railway's PORT env var is intentionally ignored

const httpServer = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      name: 'Strata DS MCP Server',
      version: '1.0.0',
      tools: 11,
      components: 126,
      foundations: 8,
      rules: 5,
      antiPatterns: 17,
      governancePath: GOVERNANCE_PATH,
      governanceReady: fs.existsSync(path.join(GOVERNANCE_PATH, 'LAWS.md')),
    }));
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/plan_ui')) {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const description = parsedUrl.searchParams.get('description') || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(planUI(description));
    return;
  }

  if (req.url === '/mcp') {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Strata DS MCP HTTP Server — port ${PORT}`);
  console.log(`MCP endpoint:  http://localhost:${PORT}/mcp`);
  console.log(`Health:        http://localhost:${PORT}/health`);
  console.log(`Governance:    ${GOVERNANCE_PATH}`);
  console.log(`Governance OK: ${fs.existsSync(path.join(GOVERNANCE_PATH, 'LAWS.md'))}`);
});
