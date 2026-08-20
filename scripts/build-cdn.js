#!/usr/bin/env node
/**
 * Build SVG files for CDN deployment
 *
 * Outputs to cdn/ directory:
 *   cdn/lu/lu-activity.svg
 *   cdn/hi/hi-arrow-right.svg
 *   cdn/metadata.json
 *
 * Usage:
 *   node scripts/build-cdn.js              # Build default families
 *   node scripts/build-cdn.js --all        # Build all families
 *   node scripts/build-cdn.js lu hi        # Build specific families
 */

import { writeFile, mkdir, readFile, copyFile, cp } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
// ⛔ This script is the WRITER of the corpus layout; @uniweb/runtime and this
// package's own resolver are its READERS. They share `iconPath` so the two
// halves cannot drift — respelling `${family}-${name}.svg` here is how one
// corpus acquires two incompatible spellings.
import { iconPath } from '@uniweb/core/icon-corpus'
import { buildSearchIndex } from './lib/search-index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CDN_DIR = join(__dirname, '../cdn')

/**
 * react-icons family configurations
 *
 * License notes:
 * - MIT, ISC, Apache-2.0: Include license file
 * - CC BY 4.0 (Font Awesome): Attribution required but flexible - include license file
 * - CC0: Public domain, no requirements
 */
const FAMILIES = {
  // Core families (most popular, permissive licenses)
  lu: { package: 'react-icons/lu', prefix: 'Lu', displayName: 'Lucide', license: 'ISC' },
  hi: { package: 'react-icons/hi', prefix: 'Hi', displayName: 'Heroicons', license: 'MIT' },
  hi2: { package: 'react-icons/hi2', prefix: 'Hi', displayName: 'Heroicons 2', license: 'MIT' },
  fi: { package: 'react-icons/fi', prefix: 'Fi', displayName: 'Feather', license: 'MIT' },

  // Font Awesome (CC BY 4.0 for icons - attribution required)
  fa: { package: 'react-icons/fa', prefix: 'Fa', displayName: 'Font Awesome 5', license: 'CC-BY-4.0' },
  fa6: { package: 'react-icons/fa6', prefix: 'Fa', displayName: 'Font Awesome 6', license: 'CC-BY-4.0' },

  // Additional popular families
  bs: { package: 'react-icons/bs', prefix: 'Bs', displayName: 'Bootstrap', license: 'MIT' },
  md: { package: 'react-icons/md', prefix: 'Md', displayName: 'Material Design', license: 'Apache-2.0' },
  ai: { package: 'react-icons/ai', prefix: 'Ai', displayName: 'Ant Design', license: 'MIT' },
  ri: { package: 'react-icons/ri', prefix: 'Ri', displayName: 'Remix', license: 'Apache-2.0' },
  si: { package: 'react-icons/si', prefix: 'Si', displayName: 'Simple Icons', license: 'CC0-1.0' },
  io5: { package: 'react-icons/io5', prefix: 'Io', displayName: 'Ionicons 5', license: 'MIT' },
  bi: { package: 'react-icons/bi', prefix: 'Bi', displayName: 'Boxicons', license: 'MIT' },

  // Large families (excluded from defaults due to size)
  pi: { package: 'react-icons/pi', prefix: 'Pi', displayName: 'Phosphor', license: 'MIT' },
  tb: { package: 'react-icons/tb', prefix: 'Tb', displayName: 'Tabler', license: 'MIT' },
  gi: { package: 'react-icons/gi', prefix: 'Gi', displayName: 'Game Icons', license: 'CC-BY-3.0' },

  // Specialized families
  // vsc and wi are NOT MIT — both were declared so until 2026-07-29, and both
  // require more than MIT does. Licences here are the upstream ones as listed
  // by react-icons' own README table; do not fill this column from memory.
  vsc: { package: 'react-icons/vsc', prefix: 'Vsc', displayName: 'VS Code', license: 'CC-BY-4.0' },
  wi: { package: 'react-icons/wi', prefix: 'Wi', displayName: 'Weather', license: 'OFL-1.1' },

  // Remaining react-icons packs. Every `prefix` below was read off the real
  // exports rather than inferred from the family code — `im` and `lia` both
  // sort `Im500Px` / `Lia500Px` first, so a rule derived from the first export
  // name yields `Im500`/`Lia500` and matches exactly one icon. A wrong prefix
  // here does not error; it silently builds an empty family.
  cg: { package: 'react-icons/cg', prefix: 'Cg', displayName: 'css.gg', license: 'MIT' },
  ci: { package: 'react-icons/ci', prefix: 'Ci', displayName: 'Circum Icons', license: 'MPL-2.0' },
  di: { package: 'react-icons/di', prefix: 'Di', displayName: 'Devicons', license: 'MIT' },
  fc: { package: 'react-icons/fc', prefix: 'Fc', displayName: 'Flat Color Icons', license: 'MIT' },
  go: { package: 'react-icons/go', prefix: 'Go', displayName: 'Github Octicons', license: 'MIT' },
  gr: { package: 'react-icons/gr', prefix: 'Gr', displayName: 'Grommet Icons', license: 'Apache-2.0' },
  im: { package: 'react-icons/im', prefix: 'Im', displayName: 'IcoMoon Free', license: 'CC-BY-4.0' },
  io: { package: 'react-icons/io', prefix: 'Io', displayName: 'Ionicons 4', license: 'MIT' },
  lia: { package: 'react-icons/lia', prefix: 'Lia', displayName: 'Line Awesome', license: 'MIT' },
  rx: { package: 'react-icons/rx', prefix: 'Rx', displayName: 'Radix Icons', license: 'MIT' },
  sl: { package: 'react-icons/sl', prefix: 'Sl', displayName: 'Simple Line Icons', license: 'MIT' },
  tfi: { package: 'react-icons/tfi', prefix: 'Tfi', displayName: 'Themify Icons', license: 'MIT' },
  ti: { package: 'react-icons/ti', prefix: 'Ti', displayName: 'Typicons', license: 'CC-BY-SA-3.0' }
}

// Families published to the CDN — all of them.
//
// Derived rather than listed, so adding a family to FAMILIES publishes it.
// Went 12 → 30 → 31 on 2026-08-20: the 12-family set was a size decision that
// left a consuming picker able to reach under half its records, and `ti` was
// then held back for a licence reading that did not survive contact with the
// licence (see ATTRIBUTION.md § Typicons — CC BY-SA reaches Adaptations, and a
// format conversion that leaves the artwork untouched is not one).
const DEFAULT_FAMILIES = Object.keys(FAMILIES)

/**
 * SVG attributes that should remain camelCase
 */
const CAMEL_CASE_ATTRS = new Set([
  'viewBox', 'preserveAspectRatio', 'baseFrequency', 'gradientTransform',
  'gradientUnits', 'patternTransform', 'patternUnits', 'clipPathUnits',
  'maskContentUnits', 'maskUnits', 'filterUnits', 'primitiveUnits',
  'spreadMethod', 'textLength', 'lengthAdjust', 'startOffset',
  'attributeName', 'attributeType', 'repeatCount', 'repeatDur',
  'keyPoints', 'keySplines', 'keyTimes', 'calcMode', 'stdDeviation',
  'baseProfile', 'glyphRef', 'xChannelSelector', 'yChannelSelector',
  'tableValues', 'surfaceScale', 'specularConstant', 'specularExponent',
  'diffuseConstant', 'kernelMatrix', 'kernelUnitLength', 'targetX',
  'targetY', 'pathLength', 'refX', 'refY', 'markerWidth', 'markerHeight',
  'markerUnits'
])

function toSvgAttr(name) {
  if (CAMEL_CASE_ATTRS.has(name)) return name
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function toKebabCase(name, prefix) {
  const withoutPrefix = name.startsWith(prefix) ? name.slice(prefix.length) : name
  return withoutPrefix
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
}

function renderChildren(children) {
  if (!children) return ''
  if (!Array.isArray(children)) children = [children]

  return children
    .map((child) => {
      if (typeof child === 'string') return child
      if (!child?.type) return ''

      const { type, props } = child
      const attrEntries = Object.entries(props || {}).filter(
        ([key]) => !['children', 'key', 'ref'].includes(key)
      )
      const attrs = attrEntries
        .map(([key, value]) => `${toSvgAttr(key)}="${value}"`)
        .join(' ')
      const innerChildren = renderChildren(props?.children)
      const attrStr = attrs ? ` ${attrs}` : ''

      if (innerChildren) {
        return `<${type}${attrStr}>${innerChildren}</${type}>`
      }
      return `<${type}${attrStr}/>`
    })
    .join('')
}

function iconToSvg(IconComponent) {
  const icon = IconComponent({})
  if (!icon?.props) return null

  const { attr, children } = icon.props
  const attrs = Object.entries(attr || {})
    .map(([key, value]) => `${toSvgAttr(key)}="${value}"`)
    .join(' ')

  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${renderChildren(children)}</svg>`
}

async function buildFamily(familyCode) {
  const config = FAMILIES[familyCode]
  if (!config) {
    console.error(`Unknown family: ${familyCode}`)
    return { success: 0, failed: 0, icons: [] }
  }

  console.log(`\nBuilding ${config.displayName} (${familyCode})...`)

  let icons
  try {
    icons = await import(config.package)
  } catch (err) {
    console.error(`  Failed to import ${config.package}: ${err.message}`)
    return { success: 0, failed: 0, icons: [] }
  }

  const outputDir = join(CDN_DIR, familyCode)
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  let success = 0
  let failed = 0
  const iconList = []

  for (const [exportName, IconComponent] of Object.entries(icons)) {
    if (typeof IconComponent !== 'function') continue
    if (!exportName.startsWith(config.prefix)) continue

    try {
      const svg = iconToSvg(IconComponent)
      if (!svg) {
        failed++
        continue
      }

      const iconName = toKebabCase(exportName, config.prefix)
      // CDN layout: {family}/{family}-{name}.svg — from the shared helper, so
      // what this writes is by construction what the resolvers request.
      const filePath = join(CDN_DIR, iconPath(familyCode, iconName))
      await writeFile(filePath, svg)

      // The react export name rides along: it is a real search surface in the
      // index (frontend measured plain-name matching beating the legacy tag
      // layer on `cart` and `team`), and collecting it here is what keeps the
      // index a product of the SAME pass that wrote the bytes.
      iconList.push({ name: iconName, react: exportName })
      success++
    } catch (err) {
      console.error(`  Failed: ${exportName}: ${err.message}`)
      failed++
    }
  }

  console.log(`  Built ${success} icons${failed > 0 ? `, ${failed} failed` : ''}`)
  return { success, failed, icons: iconList }
}

async function main() {
  const args = process.argv.slice(2)

  let familiesToBuild
  if (args.includes('--all')) {
    familiesToBuild = Object.keys(FAMILIES)
  } else if (args.length > 0) {
    familiesToBuild = args.filter((arg) => !arg.startsWith('--'))
  } else {
    familiesToBuild = DEFAULT_FAMILIES
  }

  console.log('Building CDN icons for:', familiesToBuild.join(', '))

  // Create CDN directory
  if (!existsSync(CDN_DIR)) {
    await mkdir(CDN_DIR, { recursive: true })
  }

  // The corpus is REBUILT WHOLE every publish from react-icons, so the version
  // that produced it is part of what the corpus IS — a name that upstream
  // retires disappears here on the next build. The dependency is pinned exactly
  // (not a range) so this field is a guarantee rather than an observation of
  // whatever the runner happened to resolve. See README § Releasing.
  const reactIconsVersion = JSON.parse(
    await readFile(new URL('../node_modules/react-icons/package.json', import.meta.url), 'utf8')
  ).version

  const metadata = {
    generatedAt: new Date().toISOString(),
    corpus: { reactIcons: reactIconsVersion },
    families: {}
  }

  let totalSuccess = 0
  let totalFailed = 0
  const indexFamilies = {}

  for (const family of familiesToBuild) {
    const { success, failed, icons } = await buildFamily(family)
    totalSuccess += success
    totalFailed += failed

    if (FAMILIES[family]) {
      indexFamilies[family] = {
        displayName: FAMILIES[family].displayName,
        license: FAMILIES[family].license,
        icons
      }
      metadata.families[family] = {
        displayName: FAMILIES[family].displayName,
        license: FAMILIES[family].license,
        count: icons.length,
        // Bare names, unchanged. metadata.json is a PUBLIC URL with consumers
        // this repo cannot enumerate, so its shape is not ours to tidy; the
        // richer records live in the search index beside it. Both come from
        // this one loop — never a second pass over the corpus.
        icons: icons.map((i) => i.name)
      }
    }
  }

  // Write metadata
  await writeFile(
    join(CDN_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  )

  // Search index — root + one file per family, per
  // `collab/context/icon-search-index-shape.md`.
  const { root, perFamily } = buildSearchIndex({
    families: indexFamilies,
    generatedAt: metadata.generatedAt,
    reactIcons: reactIconsVersion
  })
  await writeFile(join(CDN_DIR, 'index.json'), JSON.stringify(root))
  for (const [code, doc] of perFamily) {
    await writeFile(join(CDN_DIR, `${code}.json`), JSON.stringify(doc))
  }
  console.log(`Search index: ${Object.keys(root.terms).length} terms, ${perFamily.size} family files`)

  // ⛔ Attribution travels WITH the corpus, not just with the repo.
  //
  // Several published families require attribution — `fa`/`fa6`/`vsc`/`im` are
  // CC-BY-4.0, `gi` is CC-BY-3.0, `wi` is OFL-1.1, `ci` is MPL-2.0 — and until
  // 2026-08-20 this script copied neither ATTRIBUTION.md nor licenses/ into the
  // artifact. The analysis existed and was current; it simply was not served,
  // so the corpus offered ~23k SVGs with nothing beside them. A licence file in
  // a source repo is not attribution accompanying the bytes a CDN hands out.
  await copyFile(join(__dirname, '../ATTRIBUTION.md'), join(CDN_DIR, 'ATTRIBUTION.md'))
  await cp(join(__dirname, '../licenses'), join(CDN_DIR, 'licenses'), { recursive: true })

  // Write index.html for browsing
  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Uniweb Icons CDN</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; }
    a { color: #0066cc; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Uniweb Icons CDN</h1>
  <p>SVG icons for <a href="https://github.com/uniweb">Uniweb</a> sites.</p>

  <h2>Usage</h2>
  <p>Fetch icons via: <code>/{family}/{family}-{name}.svg</code></p>
  <p>Example: <code>/lu/lu-home.svg</code></p>

  <h2>Available Families</h2>
  <table>
    <tr><th>Family</th><th>Icons</th><th>License</th></tr>
    ${familiesToBuild.map(f => {
      const info = metadata.families[f]
      return info ? `<tr><td><a href="./${f}/">${info.displayName}</a> (${f})</td><td>${info.count}</td><td>${info.license}</td></tr>` : ''
    }).join('\n    ')}
  </table>

  <h2>Metadata</h2>
  <p><a href="./metadata.json">metadata.json</a> - Full icon list and metadata</p>
  <p><a href="./index.json">index.json</a> - Search index root (per-family files at <code>/{family}.json</code>)</p>

  <h2>Attribution &amp; licensing</h2>
  <p>These icons come from independent projects and each family keeps its own licence.
  Several require attribution when redistributed.</p>
  <ul>
    <li><a href="./ATTRIBUTION.md">ATTRIBUTION.md</a> - per-family terms, and which ones require attribution</li>
    <li><a href="./licenses/">licenses/</a> - the full licence text for every family</li>
  </ul>

  <p style="margin-top: 2rem; color: #666; font-size: 0.9rem;">
    Generated: ${new Date().toISOString()}
  </p>
</body>
</html>`

  await writeFile(join(CDN_DIR, 'index.html'), indexHtml)

  console.log(`\nDone! Built ${totalSuccess} icons to cdn/`)
  if (totalFailed > 0) {
    console.log(`${totalFailed} icons failed.`)
  }
}

main().catch(console.error)
