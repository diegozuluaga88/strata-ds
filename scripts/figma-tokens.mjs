#!/usr/bin/env node
/**
 * figma-tokens.mjs — genera `strata-tokens.figma.json` desde los tokens CSS canónicos.
 *
 * POR QUÉ EXISTE
 * Las variables que hoy viven en los archivos de Figma quedaron congeladas en una generación
 * vieja de tokens (`Success-Green #098400`, `Error-Red #d20322`, `Light Green #e5f9e4`…) y la
 * documentación de governance se escribió mirando Figma, no el código. Resultado: tres verdades
 * distintas y devs traduciendo a mano.
 *
 * Este generador invierte la dirección: **el CSS es la fuente de verdad** y Figma se siembra desde
 * él. Cuando un token cambia en `variables.css`, se regenera este JSON y se re-siembra el archivo
 * de Figma — nunca al revés.
 *
 * SALIDA
 *   src/tokens/strata-tokens.figma.json
 *
 * USO
 *   npm run tokens:figma            # genera
 *   npm run tokens:figma:check      # falla si el JSON en disco está desactualizado (CI, pre-commit)
 *   npm run tokens:figma:audit      # imprime un snippet listo para pegar en `use_figma`
 *                                   # que diffea el archivo de Figma contra este JSON
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const LIGHT_CSS = resolve(ROOT, 'src/styles/tokens/variables.css')
const DARK_CSS = resolve(ROOT, 'src/styles/tokens/variables-dark.css')
const OUT = resolve(ROOT, 'src/tokens/strata-tokens.figma.json')

const REM = 16

/** Escalas primitivas. El orden define la prioridad al resolver aliases (ver resolveAlias). */
const SCALES = ['zinc', 'brand', 'red', 'green', 'blue', 'amber', 'indigo', 'violet']

/**
 * Figma bindea `fontFamily` a UNA familia, no a un stack CSS. Estos son los
 * valores que se siembran en Figma; el stack completo queda en el codeSyntax.
 *
 * `brand` resuelve a Inter a propósito: el DS declara PP Monument Extended pero
 * no distribuye ningún archivo de fuente, así que en producción cae a sans.
 * `mono` es Consolas, que es a lo que Windows resuelve la stack de sistema.
 */
const FONT_FAMILY_FIGMA_VALUES = {
  'FontFamily/sans': 'Inter',
  'FontFamily/brand': 'Inter',
  'FontFamily/mono': 'Consolas',
  'FontFamily/serif': 'Georgia',
}

/** `--color-zinc-300` → `Zinc/zinc-300`. Devuelve null si no es de una escala primitiva. */
function primitiveColorName(token) {
  for (const scale of SCALES) {
    if (token.startsWith(`--color-${scale}-`)) {
      const rest = token.slice(`--color-${scale}-`.length)
      const group = scale[0].toUpperCase() + scale.slice(1)
      return `${group}/${scale}-${rest}`
    }
  }
  if (token === '--color-white') return 'Base/white'
  if (token === '--color-black') return 'Base/black'
  return null
}

/** Parsea un bloque CSS de custom properties a un Map preservando el orden de aparición. */
function parseCssVars(css, file) {
  const vars = new Map()
  const re = /^\s*(--[A-Za-z0-9-]+)\s*:\s*([^;]+);\s*$/gm
  let m
  while ((m = re.exec(css)) !== null) {
    const [, name, rawValue] = m
    const value = rawValue.trim()
    if (vars.has(name)) {
      throw new Error(`Token duplicado \`${name}\` en ${file}`)
    }
    vars.set(name, value)
  }
  if (vars.size === 0) throw new Error(`No se encontró ningún token en ${file}`)
  return vars
}

/** `0.5rem` → 8 · `1px` → 1 · `0` → 0 · `9999px` → 9999. null si no es dimensión. */
function toPx(value) {
  const rem = /^(-?[\d.]+)rem$/.exec(value)
  if (rem) return Number(rem[1]) * REM
  const px = /^(-?[\d.]+)px$/.exec(value)
  if (px) return Number(px[1])
  if (/^-?[\d.]+$/.test(value)) return Number(value)
  return null
}

function normalizeHex(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : null
}

/**
 * Un token de color es SEMÁNTICO si no pertenece a una escala primitiva.
 * Incluye deliberadamente `chart-*` (no son una escala, son roles) y `status-*`.
 */
function isSemanticColor(token) {
  return token.startsWith('--color-') && primitiveColorName(token) === null
}

/**
 * Busca qué primitivo tiene ese mismo hex, para enlazar la variable semántica por alias en vez de
 * por valor crudo. Varias escalas comparten hex (`#fafafa` es zinc-50; `#02060C` es zinc-900), por
 * eso SCALES define la prioridad: zinc primero, que es el neutro estructural.
 */
function resolveAlias(hex, primitivesByHex) {
  return primitivesByHex.get(hex) ?? null
}

/**
 * Utilidades Tailwind reales para cada token semántico. Se acota a propósito: un hint que sugiere
 * `border-background` es exactamente el ruido que este archivo existe para eliminar.
 */
function tailwindUtilities(name) {
  if (name === 'ring') return ['ring-ring']
  if (name === 'border' || name === 'input') return [`border-${name}`]
  if (name.endsWith('-foreground')) return [`text-${name}`]
  if (name.startsWith('chart-')) return [`fill-${name}`, `stroke-${name}`]
  if (name.startsWith('status-')) return [`text-${name}`, `bg-${name}/10`, `border-${name}/20`]
  return [`bg-${name}`, `text-${name}`]
}

function build() {
  const lightCss = readFileSync(LIGHT_CSS, 'utf8')
  const darkCss = readFileSync(DARK_CSS, 'utf8')
  const light = parseCssVars(lightCss, LIGHT_CSS)
  const dark = parseCssVars(darkCss, DARK_CSS)

  const warnings = []

  // --- Guardia de deriva: todo lo que NO es color semántico debe ser idéntico en ambos archivos.
  // Si esto falla, alguien metió una divergencia que este generador no sabe representar.
  for (const [token, value] of light) {
    if (isSemanticColor(token)) continue
    if (!dark.has(token)) {
      warnings.push(`\`${token}\` existe en light y falta en dark`)
      continue
    }
    if (dark.get(token) !== value) {
      warnings.push(
        `\`${token}\` no es semántico pero difiere entre modos (light \`${value}\` / dark \`${dark.get(token)}\`)`,
      )
    }
  }
  for (const token of dark.keys()) {
    if (!light.has(token)) warnings.push(`\`${token}\` existe en dark y falta en light`)
  }

  // --- Colección de primitivos -------------------------------------------------------------
  const primitives = []
  const primitivesByHex = new Map()

  const pushPrimitive = (name, type, value, codeToken) => {
    const entry = { name, type, codeToken, values: { Value: value } }
    // Para las familias tipográficas, el valor sembrado en Figma difiere del
    // stack CSS: Figma bindea una familia concreta.
    if (FONT_FAMILY_FIGMA_VALUES[name] !== undefined) {
      entry.figmaValue = FONT_FAMILY_FIGMA_VALUES[name]
    }
    primitives.push(entry)
  }

  // Colores, en orden de prioridad de escala para que el reverse-map quede determinista.
  for (const scale of [...SCALES, 'base']) {
    for (const [token, value] of light) {
      const name = primitiveColorName(token)
      if (!name) continue
      const group = name.split('/')[0].toLowerCase()
      if (group !== scale) continue
      const hex = normalizeHex(value)
      if (!hex) {
        warnings.push(`\`${token}\` no es un hex de 6 dígitos: \`${value}\``)
        continue
      }
      pushPrimitive(name, 'COLOR', hex, token)
      if (!primitivesByHex.has(hex)) primitivesByHex.set(hex, name)
    }
  }

  const dimensionGroups = [
    { prefix: '--borderRadius-', group: 'Radius' },
    { prefix: '--spacing-', group: 'Spacing' },
    { prefix: '--borderWidth-', group: 'BorderWidth' },
    { prefix: '--fontSize-', group: 'FontSize' },
  ]
  for (const { prefix, group } of dimensionGroups) {
    for (const [token, value] of light) {
      if (!token.startsWith(prefix)) continue
      const px = toPx(value)
      if (px === null) {
        warnings.push(`\`${token}\` no se pudo convertir a px: \`${value}\``)
        continue
      }
      pushPrimitive(`${group}/${token.slice(prefix.length)}`, 'FLOAT', px, token)
    }
  }

  for (const [token, value] of light) {
    if (token.startsWith('--fontWeight-')) {
      pushPrimitive(`FontWeight/${token.slice('--fontWeight-'.length)}`, 'FLOAT', Number(value), token)
    } else if (token.startsWith('--lineHeight-')) {
      pushPrimitive(`LineHeight/${token.slice('--lineHeight-'.length)}`, 'FLOAT', Number(value), token)
    } else if (token.startsWith('--fontFamily-')) {
      pushPrimitive(`FontFamily/${token.slice('--fontFamily-'.length)}`, 'STRING', value, token)
    } else if (token.startsWith('--letterSpacing-')) {
      pushPrimitive(`LetterSpacing/${token.slice('--letterSpacing-'.length)}`, 'STRING', value, token)
    }
  }

  // --- Colección semántica (dos modos) -----------------------------------------------------
  const semantic = []
  for (const [token, lightValue] of light) {
    if (!isSemanticColor(token)) continue
    const name = token.slice('--color-'.length) // regla de oro: nombre Figma = token sin `--color-`
    const lightHex = normalizeHex(lightValue)
    const darkHex = normalizeHex(dark.get(token) ?? '')
    if (!lightHex || !darkHex) {
      warnings.push(`\`${token}\` no resolvió a hex en ambos modos`)
      continue
    }
    semantic.push({
      name,
      type: 'COLOR',
      codeToken: token,
      values: { Light: lightHex, Dark: darkHex },
      alias: {
        Light: resolveAlias(lightHex, primitivesByHex),
        Dark: resolveAlias(darkHex, primitivesByHex),
      },
      tailwind: tailwindUtilities(name),
      flipsBetweenModes: lightHex !== darkHex,
    })
  }

  // --- Estilos de efecto -------------------------------------------------------------------
  const effectStyles = []
  for (const [token, value] of light) {
    if (!token.startsWith('--shadow-')) continue
    effectStyles.push({
      name: `shadow/${token.slice('--shadow-'.length)}`,
      codeToken: token,
      css: value,
    })
  }

  const doc = {
    $schema: 'strata-figma-tokens/1',
    $meta: {
      description:
        'Semilla de variables para Figma. Generado desde variables.css + variables-dark.css. ' +
        'NO editar a mano: correr `npm run tokens:figma`.',
      generator: 'scripts/figma-tokens.mjs',
      sources: ['src/styles/tokens/variables.css', 'src/styles/tokens/variables-dark.css'],
      remBasePx: REM,
      namingRule: 'El nombre de la variable en Figma es el token de código sin el prefijo `--color-`.',
      starterPlanFallback:
        'Figma Starter no permite modos. Sembrar la colección semántica como dos colecciones de un ' +
        'modo: "Strata · Semantic — Light" y "Strata · Semantic — Dark". Al subir a Professional, ' +
        'fusionarlas en una sola con modos Light/Dark.',
      counts: {
        primitives: primitives.length,
        semantic: semantic.length,
        effectStyles: effectStyles.length,
      },
      warnings,
    },
    collections: [
      { name: 'Strata · Primitives', modes: ['Value'], variables: primitives },
      { name: 'Strata · Semantic', modes: ['Light', 'Dark'], variables: semantic },
    ],
    effectStyles,
  }

  return { doc, warnings }
}

/**
 * Emite un script listo para pegar en `use_figma`, con los valores esperados ya
 * incrustados desde este JSON.
 *
 * Existe porque la primera auditoría se hizo transcribiendo el set esperado a
 * mano y se cayeron cuatro variables, produciendo falsos positivos. Generarlo
 * elimina esa clase de error por completo.
 */
function auditSnippet(doc) {
  const prim = {}
  for (const v of doc.collections[0].variables) prim[v.name] = v.values.Value
  const sem = {}
  for (const v of doc.collections[1].variables) {
    sem[v.name] = { v: v.values.Light, a: v.alias.Light }
  }

  return `// AUTOGENERADO por \`npm run tokens:figma:audit\` — no editar a mano.
// Pegar como \`code\` en una llamada a use_figma sobre el archivo de la librería.
const PRIM = ${JSON.stringify(prim)};
const SEM = ${JSON.stringify(sem)};
// Las FontFamily se guardan en Figma como la familia que puede bindear, no como
// el stack CSS completo. El stack vive en el codeSyntax.
const FONT_OVERRIDES = ${JSON.stringify(FONT_FAMILY_FIGMA_VALUES)};

function hex(c) {
  const to = n => Math.round(n * 255).toString(16).padStart(2, '0');
  return ('#' + to(c.r) + to(c.g) + to(c.b)).toUpperCase();
}

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const all = await figma.variables.getLocalVariablesAsync();
const byId = new Map(all.map(v => [v.id, v]));
const primCol = cols.find(c => c.name === 'Strata · Primitives');
const semCol = cols.find(c => c.name === 'Strata · Semantic');
if (!primCol || !semCol) throw new Error('Faltan las colecciones Strata · Primitives / Semantic');

const problems = { valueMismatch: [], aliasMismatch: [], missing: [], extra: [], noCodeSyntax: [], badScopes: [] };
const primMode = primCol.modes[0].modeId;
const semMode = semCol.modes[0].modeId;

const seenP = new Set();
for (const id of primCol.variableIds) {
  const v = byId.get(id); seenP.add(v.name);
  if (PRIM[v.name] === undefined) { problems.extra.push('Primitives · ' + v.name); continue; }
  const expected = FONT_OVERRIDES[v.name] !== undefined ? FONT_OVERRIDES[v.name] : PRIM[v.name];
  const raw = v.valuesByMode[primMode];
  const actual = (raw && typeof raw.r === 'number') ? hex(raw) : raw;
  if (String(actual) !== String(expected)) problems.valueMismatch.push(v.name + ': figma=' + actual + ' · ds=' + expected);
  if (!v.codeSyntax || !v.codeSyntax.WEB) problems.noCodeSyntax.push('Primitives · ' + v.name);
  if (v.scopes.includes('ALL_SCOPES')) problems.badScopes.push('Primitives · ' + v.name);
}
for (const n of Object.keys(PRIM)) if (!seenP.has(n)) problems.missing.push('Primitives · ' + n);

const seenS = new Set();
for (const id of semCol.variableIds) {
  const v = byId.get(id); seenS.add(v.name);
  const exp = SEM[v.name];
  if (!exp) { problems.extra.push('Semantic · ' + v.name); continue; }
  const raw = v.valuesByMode[semMode];
  let actual, alias = null;
  if (raw && raw.type === 'VARIABLE_ALIAS') {
    const t = byId.get(raw.id);
    alias = t ? t.name : '(missing)';
    actual = t ? hex(t.valuesByMode[primMode]) : null;
  } else { actual = hex(raw); }
  if (actual !== exp.v) problems.valueMismatch.push(v.name + ': figma=' + actual + ' · ds=' + exp.v);
  if (alias !== exp.a) problems.aliasMismatch.push(v.name + ': figma=' + alias + ' · ds=' + exp.a);
  if (!v.codeSyntax || !v.codeSyntax.WEB) problems.noCodeSyntax.push('Semantic · ' + v.name);
  if (v.scopes.includes('ALL_SCOPES')) problems.badScopes.push('Semantic · ' + v.name);
}
for (const n of Object.keys(SEM)) if (!seenS.has(n)) problems.missing.push('Semantic · ' + n);

const textStyles = await figma.getLocalTextStylesAsync();
return {
  counts: { primitives: primCol.variableIds.length, semantic: semCol.variableIds.length, textStyles: textStyles.length },
  fontFamiliesInTextStyles: [...new Set(textStyles.map(s => s.fontName.family))],
  legacyCollections: cols.filter(c => !c.name.startsWith('Strata · ')).map(c => c.name + ' (' + c.variableIds.length + ')'),
  problems,
  totalProblems: Object.values(problems).reduce((n, a) => n + a.length, 0),
};
`
}

function main() {
  const check = process.argv.includes('--check')
  const audit = process.argv.includes('--audit-snippet')
  const { doc, warnings } = build()
  const json = `${JSON.stringify(doc, null, 2)}\n`

  if (audit) {
    process.stdout.write(auditSnippet(doc))
    return
  }

  if (check) {
    if (!existsSync(OUT)) {
      console.error(`✗ ${OUT} no existe. Correr \`npm run tokens:figma\`.`)
      process.exit(1)
    }
    if (readFileSync(OUT, 'utf8') !== json) {
      console.error(`✗ ${OUT} está desactualizado respecto a los tokens CSS. Correr \`npm run tokens:figma\`.`)
      process.exit(1)
    }
    console.log('✓ strata-tokens.figma.json está al día')
    return
  }

  writeFileSync(OUT, json, 'utf8')
  const { counts } = doc.$meta
  console.log(`✓ ${OUT}`)
  console.log(`  ${counts.primitives} primitivas · ${counts.semantic} semánticas · ${counts.effectStyles} sombras`)
  const flipping = doc.collections[1].variables.filter((v) => v.flipsBetweenModes).length
  console.log(`  ${flipping} de ${counts.semantic} semánticas cambian entre Light y Dark`)
  if (warnings.length) {
    console.warn(`\n⚠ ${warnings.length} advertencia(s):`)
    for (const w of warnings) console.warn(`  - ${w}`)
  }
}

main()
