# Strata Design System

A technical, functional, and precise design system operating as the intelligence layer that unifies data, workflows, and AI across the ecosystem. Built with React, TypeScript, and a robust token architecture.

## Features

- 🎨 **Strata Identity** - Implements the "Volt Lime" brand palette with adaptive color strategy (brand-300 for light mode, brand-500 for dark mode) and Zinc neutral palette.
- 🎯 **Token-Based** - Comprehensive JSON-based token architecture (Primitive -> Semantic -> Component).
- 🔠 **Typography** - "Inter" for system clarity and "PP Monument Extended" for brand presence.
- 🌗 **Dark Mode** - Built-in dark mode with deep graphite tones.
- 📦 **Tree-Shakeable** - Optimized bundle size.
- 🔷 **TypeScript** - Full type safety.
- ♿ **Accessible** - ARIA compliant components.

## Quickstart for AI-assisted projects

The DS ships with an **MCP server** + a **`ds-architect` subagent** so any AI
tool (Cursor, Claude Code, VS Code Copilot) can consult tokens, components,
governance rules, and anti-patterns *before* writing UI — preventing drift.

### Three integration paths

#### 1. MCP only (any IDE) — universal

Configure your IDE to point at the local MCP server. Your AI gets 10
callable tools (`plan_ui`, `get_component`, `get_foundations`, etc.).

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "strata-ds": {
      "command": "node",
      "args": ["./design system/strata-ds/src/mcp-server/index.mjs"]
    }
  }
}
```

**Claude Code** (`.claude/settings.json`):
```json
{
  "mcpServers": {
    "strata-ds": {
      "command": "node",
      "args": ["../design system/strata-ds/src/mcp-server/index.mjs"]
    }
  }
}
```

**VS Code Copilot** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "strata-ds": {
      "type": "stdio",
      "command": "node",
      "args": ["./design system/strata-ds/src/mcp-server/index.mjs"]
    }
  }
}
```

#### 2. MCP + ds-architect agent (Claude Code) — recommended

The agent fires automatically on "build/add/create a [UI thing]" prompts and
forces a deterministic blueprint workflow. Copy two files into your project:

```bash
mkdir -p .claude/agents .claude/commands
cp "../design system/strata-ds/.claude/agents/ds-architect.md" .claude/agents/
cp "../design system/strata-ds/.claude/commands/ds-plan.md" .claude/commands/
```

Then in any task: `/ds-plan navbar with tabs and avatar` returns the
component to use, tokens, anti-patterns, and a starter snippet.

#### 3. Curl/CLI direct (no AI)

The MCP exposes an HTTP demo endpoint on `localhost:3001`:

```bash
# Start server
node "../design system/strata-ds/src/mcp-server/index.mjs"

# Query
curl 'http://localhost:3001/plan_ui?description=floating+pill+navbar+with+tabs'
curl http://localhost:3001/foundations/colors
curl http://localhost:3001/components/button
```

See the live demo at `localhost:5173` (run `npm run dev` from this folder)
→ MCP Connection page.

---

## Library installation

```bash
npm install strata-design-system
```

## Quick Start

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from 'strata-design-system';
import 'strata-design-system/styles';

function App() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-brand">Welcome to Strata</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Initialize System</Button>
      </CardContent>
    </Card>
  );
}
```

## Documentation

### Foundations
- **Colors**: Volt Lime brand palette with adaptive strategy:
  - Light Mode: brand-300 (#E6F993) for primary actions
  - Dark Mode: brand-500 (#C3E433) for primary actions
  - Zinc palette for neutral backgrounds, borders, and text
- **Typography**: Inter (Body), PP Monument Extended (Display).
- **Branding**: Official logo assets and usage guidelines.

For detailed component documentation, see [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md).

## Components

### Core UI
- Button, Input, Card, Badge, Modal

### Forms
- Checkbox, Switch, Label, Textarea, Select, Radio, RadioGroup

### Feedback
- Alert, Progress, Tooltip

### Navigation
- Breadcrumb, Pagination

### Data Display
- Table, Accordion, Avatar

### Overlays
- Dropdown, Dialog, Popover, Toast

### Layout & Utilities
- Sidebar, Separator, Tabs, Skeleton, Spinner, Slider, ScrollArea

## Theming

Customize the design system using the generated CSS tokens:

```css
:root {
  /* Light mode primary action */
  --color-primary: #E6F993; /* brand-300 */
  --color-brand-300: #E6F993;
  --color-brand-500: #C3E433;
  --font-brand: 'PP Monument Extended', sans-serif;
}

.dark {
  /* Dark mode primary action */
  --color-primary: #C3E433; /* brand-500 */
}
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## License

MIT © Strata Team