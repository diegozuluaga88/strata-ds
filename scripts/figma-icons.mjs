#!/usr/bin/env node
/**
 * figma-icons.mjs — extrae los iconos que un proyecto realmente usa y los deja
 * listos para sembrarlos como componentes en Figma.
 *
 * POR QUÉ EXISTE
 * El plan original decía copiar el set de iconos del archivo `UI Reps`, pero ese
 * set es de familia Material (`add`, `more_vert`, `local_shipping`) y ningún
 * proyecto Strata lo usa. Lo que se usa de verdad es `lucide-react` y, en el
 * caso de expert-hub, también `@heroicons/react`.
 *
 * Este script escanea el código, resuelve cada icono contra el paquete instalado
 * y emite el SVG. Así el set de Figma es exactamente el que el producto usa —
 * ni uno de más, ni uno inventado.
 *
 * USO
 *   node scripts/figma-icons.mjs --project <ruta> [--out <archivo>]
 *   node scripts/figma-icons.mjs --seed-script --batch 1 [--size 40]
 *   node scripts/figma-icons.mjs --audit-snippet
 *
 * `--seed-script` imprime el script COMPLETO para pegar en `use_figma`, con el
 * payload ya incrustado. Existe porque pasar los SVG a mano entre el JSON y el
 * script se comió dos iconos en la primera corrida: cualquier eslabón manual
 * entre la fuente de verdad y Figma termina perdiendo datos.
 *
 * `--audit-snippet` imprime un script que verifica el set sembrado contra este
 * JSON y devuelve solo las diferencias.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, extname } from 'node:path'

const args = process.argv.slice(2)
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const PROJECT = resolve(process.cwd(), arg('project', '.'))
const OUT = resolve(process.cwd(), arg('out', 'src/tokens/strata-icons.figma.json'))
const SRC = join(PROJECT, 'src')
const MODULES = join(PROJECT, 'node_modules')

if (!existsSync(SRC)) throw new Error(`No existe ${SRC}`)

/**
 * Mapa autoritativo nombre-exportado → archivo, leído del índice del paquete.
 *
 * Adivinar el nombre de archivo con kebab-case falla en dos casos frecuentes:
 * los alias deprecados (`AlertTriangle` vive en `triangle-alert.js`) y los
 * dígitos (`Building2` → `building-2.js`). El índice ya resuelve ambos.
 */
function buildLucideExportMap() {
  const index = join(MODULES, 'lucide-react/dist/esm/lucide-react.js')
  if (!existsSync(index)) return {}
  const src = readFileSync(index, 'utf8')
  const map = {}
  const re = /export\s*\{([^}]*)\}\s*from\s*'\.\/icons\/([^']+)'/g
  let m
  while ((m = re.exec(src)) !== null) {
    const file = m[2]
    for (const part of m[1].split(',')) {
      const alias = part.trim().match(/as\s+([A-Za-z0-9_]+)$/)
      if (alias) map[alias[1]] = file
    }
  }
  return map
}
const LUCIDE_FILES = buildLucideExportMap()

/** Recorre src/ y devuelve todos los archivos de código. */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      walk(full, acc)
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(full))) {
      acc.push(full)
    }
  }
  return acc
}

/** Extrae los nombres importados de un paquete, resolviendo los alias `X as Y`. */
function collectImports(files, packagePattern) {
  const names = new Set()
  const re = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${packagePattern}['"]`, 'g')
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    let m
    while ((m = re.exec(src)) !== null) {
      for (const part of m[1].split(',')) {
        // `Copy as CopyIcon` → nos interesa el nombre original, `Copy`.
        let original = part.trim().split(/\s+as\s+/)[0].trim()
        // `import { type LucideIcon }` no es un icono, es un tipo.
        if (!original || original.startsWith('type ')) continue
        // El regex escanea texto plano, así que también entra por un `import {...}`
        // citado dentro de un string — p. ej. el mensaje de sugerencia de
        // `src/mcp-server/validator.ts`. Un icono siempre es un identificador válido.
        if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(original)) continue
        names.add(original)
      }
    }
  }
  return [...names].sort()
}

/** Convierte el `__iconNode` de lucide en un SVG completo. */
function lucideSvg(name) {
  const fileName = LUCIDE_FILES[name]
  if (!fileName) return null
  const file = join(MODULES, 'lucide-react/dist/esm/icons', fileName)
  if (!existsSync(file)) return null
  const src = readFileSync(file, 'utf8')
  const start = src.indexOf('__iconNode = [')
  if (start < 0) return null
  const open = src.indexOf('[', start)
  let depth = 0, end = open
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++
    else if (src[i] === ']') { depth--; if (depth === 0) { end = i; break } }
  }
  const literal = src.slice(open, end + 1)

  let nodes
  try {
    // El literal es JS válido (claves sin comillas), así que se evalúa acotado.
    nodes = new Function(`return ${literal}`)()
  } catch {
    return null
  }

  const body = nodes.map(([tag, attrs]) => {
    const props = Object.entries(attrs)
      .filter(([k]) => k !== 'key')
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')
    return `<${tag} ${props}/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}

/** Extrae los <path> de un icono de heroicons 24/outline. */
function heroiconSvg(name) {
  const file = join(MODULES, '@heroicons/react/24/outline', `${name}.js`)
  if (!existsSync(file)) return null
  const src = readFileSync(file, 'utf8')
  const paths = [...src.matchAll(/d:\s*"([^"]+)"/g)].map(m => m[1])
  if (!paths.length) return null
  const body = paths
    .map(d => `<path stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.5">${body}</svg>`
}

/** Cuerpo compartido: convierte un SVG en componente y bindea sus paints. */
const SEED_BODY = `
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const sem = cols.find(c => c.name === 'Strata · Semantic');
const all = await figma.variables.getLocalVariablesAsync();
const fg = all.find(v => v.variableCollectionId === sem.id && v.name === 'foreground');
const bg = all.find(v => v.variableCollectionId === sem.id && v.name === 'background');
const bound = v => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);

let container = page.findOne(n => n.type === 'FRAME' && n.name === CONTAINER_NAME);
if (!container) {
  container = figma.createAutoLayout('HORIZONTAL', { name: CONTAINER_NAME, itemSpacing: 20 });
  container.layoutWrap = 'WRAP';
  container.counterAxisSpacing = 20;
  container.x = CONTAINER_X; container.y = CONTAINER_Y;
  container.paddingTop = 32; container.paddingBottom = 32;
  container.paddingLeft = 32; container.paddingRight = 32;
  container.primaryAxisSizingMode = 'FIXED';
  container.resize(1200, 200);
  container.counterAxisSizingMode = 'AUTO';
  container.fills = [bound(bg)];
}

const existing = new Set(container.children.map(c => c.name));
let created = 0;

for (const [lib, name, svg] of BATCH) {
  const compName = lib + '/' + name;
  if (existing.has(compName)) continue;
  const imported = figma.createNodeFromSvg(svg);
  const comp = figma.createComponent();
  comp.name = compName;
  comp.resize(24, 24);
  comp.fills = [];
  for (const child of [...imported.children]) {
    comp.appendChild(child);
    if ('strokes' in child && child.strokes.length) child.strokes = child.strokes.map(s => s.type === 'SOLID' ? bound(fg) : s);
    if ('fills' in child && Array.isArray(child.fills) && child.fills.length) child.fills = child.fills.map(f => f.type === 'SOLID' ? bound(fg) : f);
  }
  imported.remove();
  container.appendChild(comp);
  comp.layoutSizingHorizontal = 'FIXED';
  comp.layoutSizingVertical = 'FIXED';
  created++;
}

return { createdNodeIds: [container.id], created, total: container.children.length };
`

function seedScript(icons, batch, size) {
  const start = (batch - 1) * size
  const slice = icons.slice(start, start + size)
  if (!slice.length) throw new Error(`El lote ${batch} está vacío (hay ${Math.ceil(icons.length / size)} lotes de ${size})`)
  const payload = JSON.stringify(slice.map(i => [i.lib, i.name, i.svg]))
  return `// AUTOGENERADO — lote ${batch} de ${Math.ceil(icons.length / size)} · ${slice.length} iconos.
// Pegar tal cual como \`code\` en use_figma. No editar el payload a mano.
const PAGE_ID = '827:3849';            // 🧩 Components
const CONTAINER_NAME = 'Icons · lucide + heroicons';
const CONTAINER_X = 0, CONTAINER_Y = 1600;
const BATCH = ${payload};
${SEED_BODY}`
}

function auditScript(icons) {
  const expected = JSON.stringify(icons.map(i => `${i.lib}/${i.name}`))
  return `// AUTOGENERADO por \`npm run icons:figma:audit\` — verifica el set sembrado.
const EXPECTED = ${expected};
const page = await figma.getNodeByIdAsync('827:3849');
await figma.setCurrentPageAsync(page);
const container = page.findOne(n => n.type === 'FRAME' && n.name === 'Icons · lucide + heroicons');
if (!container) throw new Error('No existe el contenedor de iconos');

const present = new Set(container.children.map(c => c.name));
const missing = EXPECTED.filter(n => !present.has(n));
const extra = [...present].filter(n => !EXPECTED.includes(n));

let solid = 0, unbound = 0, wrongSize = [];
for (const c of container.children) {
  if (c.width !== 24 || c.height !== 24) wrongSize.push(c.name);
}
for (const n of container.findAll(() => true)) {
  for (const prop of ['fills', 'strokes']) {
    const paints = n[prop];
    if (!Array.isArray(paints)) continue;
    for (const p of paints) {
      if (p.type !== 'SOLID') continue;
      solid++;
      if (!p.boundVariables || !p.boundVariables.color) unbound++;
    }
  }
}
return {
  expected: EXPECTED.length,
  present: present.size,
  missing,
  extra,
  wrongSize,
  solidPaints: solid,
  unboundPaints: unbound,
  ok: missing.length === 0 && extra.length === 0 && unbound === 0 && wrongSize.length === 0,
};`
}

// ── Run ──────────────────────────────────────────────────────────────────────
const files = walk(SRC)
const lucideNames = collectImports(files, 'lucide-react')
const heroNames = collectImports(files, '@heroicons/react[^\'"]*')

const icons = []
const failed = []

for (const name of lucideNames) {
  const svg = lucideSvg(name)
  if (svg) icons.push({ lib: 'lucide', name, svg })
  else failed.push(`lucide · ${name}`)
}
for (const name of heroNames) {
  const svg = heroiconSvg(name)
  if (svg) icons.push({ lib: 'heroicons', name, svg })
  else failed.push(`heroicons · ${name}`)
}

const doc = {
  $meta: {
    description:
      'Iconos que el proyecto usa realmente, extraídos de los paquetes instalados. ' +
      'Semilla para el set de Figma. NO editar a mano.',
    generator: 'scripts/figma-icons.mjs',
    // Sin la ruta del proyecto a propósito: era absoluta, así que el archivo
    // salía distinto en cada máquina y no se podía verificar en otra parte.
    counts: {
      lucide: icons.filter(i => i.lib === 'lucide').length,
      heroicons: icons.filter(i => i.lib === 'heroicons').length,
      total: icons.length,
    },
    unresolved: failed,
  },
  icons,
}

if (args.includes('--seed-script')) {
  const batch = Number(arg('batch', '1'))
  const size = Number(arg('size', '40'))
  process.stdout.write(seedScript(icons, batch, size))
  process.exit(0)
}
if (args.includes('--audit-snippet')) {
  process.stdout.write(auditScript(icons))
  process.exit(0)
}

writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
console.log(`✓ ${OUT}`)
console.log(`  lucide: ${doc.$meta.counts.lucide} · heroicons: ${doc.$meta.counts.heroicons} · total: ${doc.$meta.counts.total}`)
if (failed.length) {
  console.warn(`\n⚠ ${failed.length} sin resolver:`)
  for (const f of failed) console.warn(`  - ${f}`)
}
