#!/usr/bin/env node

/**
 * Token Validation Script
 *
 * Valida DOS capas:
 *
 *   1. **Primitivos** — que `tokens/primitives/colors.json` coincida con la
 *      documentación visual canónica (`color-reference.json`).
 *
 *   2. **Semánticos** — que el CSS generado coincida con las dos copias que se
 *      mantienen a mano: `src/app/data/foundations-data.ts`, que es lo que
 *      enseña la galería, y `src/mcp-server/index.mjs`, que es lo que
 *      `get_tokens()` responde a `ds-plan`, al agente `ds-architect` y a la
 *      skill `planning-strata-ui` **antes de que nadie escriba UI**.
 *
 * **Por qué existe la segunda.** Un token semántico vive en cinco sitios: el
 * JSON fuente, los seis ficheros que genera `build:tokens`, el puente de Figma,
 * la galería y el MCP. Los tres primeros están cubiertos por su generador o por
 * `tokens:figma:check`; los dos últimos no los miraba nadie. El resultado fue
 * que los arreglos de contraste de octubre —`input` a #546070, `ring` a #141E2C,
 * `muted-foreground` a #616A76— llegaron a los tokens y **nunca a la galería ni
 * al MCP**, que siguieron un mes documentando y aconsejando los valores que
 * fallaban WCAG. En silencio, porque nada lo comparaba.
 *
 * La verdad es el CSS generado, porque sale del JSON por construcción. Si esto
 * falla, lo que hay que corregir son las copias, no el CSS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REFERENCE_FILE = path.join(__dirname, 'color-reference.json');
const PRIMITIVES_FILE = path.join(__dirname, '../tokens/primitives/colors.json');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Error loading ${filePath}: ${error.message}`, 'red');
    process.exit(1);
  }
}

function normalizeHex(hex) {
  // Normalize hex values to lowercase for comparison
  return hex.toLowerCase().trim();
}

function validateColors() {
  log('\n🔍 Validating Design Tokens...', 'cyan');
  log('━'.repeat(50), 'cyan');

  const reference = loadJSON(REFERENCE_FILE);
  const primitives = loadJSON(PRIMITIVES_FILE);

  let hasErrors = false;
  let errorCount = 0;
  let successCount = 0;

  // Validate each palette
  for (const [paletteName, paletteData] of Object.entries(reference.palettes)) {
    if (!paletteData.complete && paletteData.displayed_shades?.length === 0) {
      // Skip palettes with no displayed shades (like green)
      continue;
    }

    log(`\n📦 Validating ${paletteName.toUpperCase()} palette...`, 'blue');

    const sourcePalette = primitives.color[paletteName];

    if (!sourcePalette) {
      log(`  ❌ Palette '${paletteName}' not found in primitives/colors.json`, 'red');
      hasErrors = true;
      errorCount++;
      continue;
    }

    for (const [shade, expectedHex] of Object.entries(paletteData.colors)) {
      const sourceShade = sourcePalette[shade];

      if (!sourceShade) {
        log(`  ❌ ${paletteName}-${shade} not found in primitives`, 'red');
        hasErrors = true;
        errorCount++;
        continue;
      }

      const sourceHex = normalizeHex(sourceShade.value);
      const referenceHex = normalizeHex(expectedHex);

      if (sourceHex !== referenceHex) {
        log(`  ❌ ${paletteName}-${shade}: ${sourceHex} (source) ≠ ${referenceHex} (visual)`, 'red');
        hasErrors = true;
        errorCount++;
      } else {
        log(`  ✅ ${paletteName}-${shade}: ${sourceHex}`, 'green');
        successCount++;
      }
    }
  }

  // Check for forbidden 'mono' palette
  log(`\n🔍 Checking for forbidden palettes...`, 'blue');
  if (primitives.color.mono) {
    log(`  ❌ FORBIDDEN: 'mono' palette found - must be removed!`, 'red');
    log(`     Use 'zinc' palette instead.`, 'yellow');
    hasErrors = true;
    errorCount++;
  } else {
    log(`  ✅ No forbidden 'mono' palette`, 'green');
    successCount++;
  }

  // Summary
  log('\n' + '━'.repeat(50), 'cyan');
  log(`\n📊 Validation Summary:`, 'bold');
  log(`   ✅ Passed: ${successCount}`, 'green');
  log(`   ❌ Failed: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

  if (hasErrors) {
    log('\n❌ Primitivos: FALLA', 'red');
    log('   Compara tokens/primitives/colors.json con la documentación visual de', 'yellow');
    log('   src/app/components/ColorsView.tsx, que es la fuente de verdad.', 'yellow');
  } else {
    log('\n✅ Primitivos: todos coinciden con la documentación visual.', 'green');
  }
  return { ok: !hasErrors, passed: successCount, failed: errorCount };
}

/* ─────────────────────────────────────────────────────── capa semántica ── */

const CSS_CLARO = path.join(__dirname, "../src/styles/tokens/variables.css");
const CSS_OSCURO = path.join(__dirname, "../src/styles/tokens/variables-dark.css");

/** Las copias que se mantienen a mano, y por qué importa cada una. */
const COPIAS = [
  {
    ruta: path.join(__dirname, "../src/app/data/foundations-data.ts"),
    nombre: "src/app/data/foundations-data.ts",
    porQue: "es lo que la galería enseña como valor del token",
  },
  {
    ruta: path.join(__dirname, "../src/mcp-server/index.mjs"),
    nombre: "src/mcp-server/index.mjs",
    porQue: "es lo que get_tokens() aconseja antes de escribir UI",
  },
];

/** El CSS generado, que es la verdad: sale del JSON por construcción. */
function tokensDelCss(ruta) {
  const texto = fs.readFileSync(ruta, "utf8");
  const mapa = {};
  for (const [, nombre, valor] of texto.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g)) {
    mapa[nombre] = normalizeHex(valor);
  }
  return mapa;
}

/**
 * Las copias de a mano, **conscientes de la sección**.
 *
 * Las dos agrupan los tokens: lo que está bajo `status` se llama
 * `--color-status-<nombre>` en el CSS y lo demás `--color-<nombre>`. Leerlas en
 * plano daba diez tokens «sin equivalente» que sí existen y además coinciden.
 */
function tokensDeCopia(ruta) {
  const texto = fs.readFileSync(ruta, "utf8");
  const lineas = texto.split(/\r?\n/);
  const mapa = {};
  let seccion = "";
  const reSeccion = /^\s{2,6}([a-zA-Z]+)\s*:\s*\{\s*$/;
  const reToken =
    /^\s*["']?([a-z0-9-]+)["']?\s*:\s*\{\s*light:\s*["'](#[0-9a-fA-F]{3,8})["']\s*,\s*dark:\s*["'](#[0-9a-fA-F]{3,8})["']/;

  for (const linea of lineas) {
    const s = linea.match(reSeccion);
    if (s) { seccion = s[1]; continue; }
    const m = linea.match(reToken);
    if (!m) continue;
    const [, nombre, claro, oscuro] = m;
    const clave = seccion === "status" ? `status-${nombre}` : nombre;
    mapa[clave] = { light: normalizeHex(claro), dark: normalizeHex(oscuro) };
  }
  return mapa;
}

function validateSemantics() {
  log("\n🔍 Validando la capa semántica (CSS generado vs copias a mano)...", "cyan");
  log("━".repeat(50), "cyan");

  const claro = tokensDelCss(CSS_CLARO);
  const oscuro = tokensDelCss(CSS_OSCURO);
  let passed = 0;
  let failed = 0;

  for (const copia of COPIAS) {
    const declarados = tokensDeCopia(copia.ruta);
    const nombres = Object.keys(declarados);
    const cruzables = nombres.filter((k) => claro[k] !== undefined);
    const huerfanos = nombres.filter((k) => claro[k] === undefined);

    log(`\n  ${copia.nombre}`, "blue");
    log(`    ${copia.porQue}`, "reset");

    for (const k of cruzables) {
      const esperadoClaro = claro[k];
      const esperadoOscuro = oscuro[k];
      const malClaro = declarados[k].light !== esperadoClaro;
      const malOscuro = esperadoOscuro !== undefined && declarados[k].dark !== esperadoOscuro;
      if (malClaro || malOscuro) {
        failed++;
        const detalle = [
          malClaro ? `claro dice ${declarados[k].light}, el CSS ${esperadoClaro}` : null,
          malOscuro ? `oscuro dice ${declarados[k].dark}, el CSS ${esperadoOscuro}` : null,
        ].filter(Boolean).join(" · ");
        log(`    ❌ ${k}: ${detalle}`, "red");
      } else {
        passed++;
      }
    }

    /*
     * Un token declarado que no existe en el CSS no se cuenta como fallo: puede
     * ser de otra capa. Pero se dice, porque documentar un token que el sistema
     * no tiene es su propia clase de mentira.
     */
    if (huerfanos.length > 0) {
      log(`    ⚠️  sin equivalente en el CSS: ${huerfanos.join(", ")}`, "yellow");
    }
  }

  if (failed > 0) {
    log(`\n❌ Semánticos: ${failed} fuera de sitio`, "red");
    log("   El CSS generado tiene razón por construcción: sale del JSON.", "yellow");
    log("   Lo que hay que corregir son las copias de a mano, no el CSS.", "yellow");
  } else {
    log(`\n✅ Semánticos: las ${passed} comparaciones coinciden con el CSS.`, "green");
  }
  return { ok: failed === 0, passed, failed };
}

/* ──────────────────────────────────────────────── tablas de governance ── */

const REGLAS_DIR = path.join(__dirname, "../governance/rules");

/**
 * Las reglas no deberían repetir valores, pero los repiten.
 *
 * `01-color-tokens.md` lleva tablas de «token → hex», y son la autoridad que se
 * cita en las revisiones. Al meter esta capa, 10 de sus 17 filas estaban viejas:
 * decían el borde a #D0D4D8 y el anillo a #959DA7, que son los valores de antes
 * de los arreglos de contraste de octubre. Un documento de gobierno equivocado
 * es peor que ninguno, porque se cita.
 *
 * Se compara sólo la fila que tiene **a la vez** un hex y el nombre de un token
 * como utilidad (`bg-x`, `text-x`, `border-x`, `ring-x`). Un hex suelto en un
 * ejemplo de código no se toca: ahí puede ser a propósito, enseñando lo que no
 * hay que hacer.
 */
function validateGovernance() {
  log("\n🔍 Validando las tablas de governance...", "cyan");
  log("━".repeat(50), "cyan");

  const claro = tokensDelCss(CSS_CLARO);
  const oscuro = tokensDelCss(CSS_OSCURO);
  const nombres = [...new Set([...Object.keys(claro), ...Object.keys(oscuro)])]
    .sort((a, b) => b.length - a.length); // el más largo primero: `input-background` antes que `input`

  let passed = 0;
  let failed = 0;

  for (const archivo of fs.readdirSync(REGLAS_DIR).filter((x) => x.endsWith(".md"))) {
    const lineas = fs.readFileSync(path.join(REGLAS_DIR, archivo), "utf8").split(/\r?\n/);
    const malas = [];

    lineas.forEach((linea, i) => {
      if (!linea.includes("|")) return;
      const hexes = [...linea.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => normalizeHex(m[0]));
      if (hexes.length === 0) return;

      const token = nombres.find((n) =>
        new RegExp("(^|[^a-z-])(bg|text|border|ring)-" + n + "(?![a-z-])").test(linea),
      );
      if (!token) return;

      const esperados = [claro[token], oscuro[token]].filter(Boolean);
      const sobran = hexes.filter((h) => !esperados.includes(h));
      if (sobran.length > 0) {
        failed++;
        malas.push(`    ❌ línea ${i + 1} · ${token}: dice ${sobran.join(", ")}, el CSS ${esperados.join(" / ")}`);
      } else {
        passed++;
      }
    });

    if (malas.length > 0) {
      log(`\n  governance/rules/${archivo}`, "blue");
      for (const m of malas) log(m, "red");
    }
  }

  if (failed > 0) {
    log(`\n❌ Governance: ${failed} filas con un valor que ya no existe`, "red");
    log("   Una regla que cita un hex viejo se usa para aprobar el color viejo.", "yellow");
  } else {
    log(`\n✅ Governance: las ${passed} filas con valor citan el del CSS.`, "green");
  }
  return { ok: failed === 0, passed, failed };
}

/* ───────────────────────────────────────────────────────────── arranque ── */

try {
  const primitivos = validateColors();
  const semanticos = validateSemantics();
  const gobierno = validateGovernance();

  log("\n" + "━".repeat(50), "cyan");
  log("\n📊 Resumen:", "bold");
  log(`   primitivos  ✅ ${primitivos.passed}   ❌ ${primitivos.failed}`, primitivos.ok ? "green" : "red");
  log(`   semánticos  ✅ ${semanticos.passed}   ❌ ${semanticos.failed}`, semanticos.ok ? "green" : "red");
  log(`   governance  ✅ ${gobierno.passed}   ❌ ${gobierno.failed}`, gobierno.ok ? "green" : "red");
  log("", "reset");

  process.exit(primitivos.ok && semanticos.ok && gobierno.ok ? 0 : 1);
} catch (error) {
  log(`\n❌ Validation error: ${error.message}`, "red");
  log(error.stack, "red");
  process.exit(1);
}
