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

import { writeFile, mkdir, readFile, copyFile, cp, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
// ⛔ This script is the WRITER of the corpus layout; @uniweb/runtime and this
// package's own resolver are its READERS. They share `iconPath` so the two
// halves cannot drift — respelling `${family}-${name}.svg` here is how one
// corpus acquires two incompatible spellings.
import { createHash } from 'crypto'
import { iconPath } from '@uniweb/core/icon-corpus'
import { buildSearchIndex } from './lib/search-index.js'
import { tarGz } from './lib/tar.js'

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
  lu: { package: 'react-icons/lu', prefix: 'Lu', displayName: 'Lucide', license: 'ISC', licenseFile: 'licenses/lucide.md' },
  hi: { package: 'react-icons/hi', prefix: 'Hi', displayName: 'Heroicons', license: 'MIT', licenseFile: 'licenses/heroicons.md' },
  hi2: { package: 'react-icons/hi2', prefix: 'Hi', displayName: 'Heroicons 2', license: 'MIT', licenseFile: 'licenses/heroicons.md' },
  fi: { package: 'react-icons/fi', prefix: 'Fi', displayName: 'Feather', license: 'MIT', licenseFile: 'licenses/feather.md' },

  // Font Awesome (CC BY 4.0 for icons - attribution required)
  fa: { package: 'react-icons/fa', prefix: 'Fa', displayName: 'Font Awesome 5', license: 'CC-BY-4.0', licenseFile: 'licenses/font-awesome.md' },
  fa6: { package: 'react-icons/fa6', prefix: 'Fa', displayName: 'Font Awesome 6', license: 'CC-BY-4.0', licenseFile: 'licenses/font-awesome.md' },

  // Additional popular families
  bs: { package: 'react-icons/bs', prefix: 'Bs', displayName: 'Bootstrap', license: 'MIT', licenseFile: 'licenses/bootstrap.md' },
  md: { package: 'react-icons/md', prefix: 'Md', displayName: 'Material Design', license: 'Apache-2.0', licenseFile: 'licenses/material-design.md' },
  ai: { package: 'react-icons/ai', prefix: 'Ai', displayName: 'Ant Design', license: 'MIT', licenseFile: 'licenses/ant-design.md' },
  ri: { package: 'react-icons/ri', prefix: 'Ri', displayName: 'Remix', license: 'Apache-2.0', licenseFile: 'licenses/remix.md' },
  si: { package: 'react-icons/si', prefix: 'Si', displayName: 'Simple Icons', license: 'CC0-1.0', licenseFile: 'licenses/simple-icons.md' },
  io5: { package: 'react-icons/io5', prefix: 'Io', displayName: 'Ionicons 5', license: 'MIT', licenseFile: 'licenses/ionicons.md' },
  bi: { package: 'react-icons/bi', prefix: 'Bi', displayName: 'Boxicons', license: 'MIT', licenseFile: 'licenses/boxicons.md' },

  // Large families (excluded from defaults due to size)
  pi: { package: 'react-icons/pi', prefix: 'Pi', displayName: 'Phosphor', license: 'MIT', licenseFile: 'licenses/phosphor.md' },
  tb: { package: 'react-icons/tb', prefix: 'Tb', displayName: 'Tabler', license: 'MIT', licenseFile: 'licenses/tabler.md' },
  gi: { package: 'react-icons/gi', prefix: 'Gi', displayName: 'Game Icons', license: 'CC-BY-3.0', licenseFile: 'licenses/game-icons.md' },

  // Specialized families
  // vsc and wi are NOT MIT — both were declared so until 2026-07-29, and both
  // require more than MIT does. Licences here are the upstream ones as listed
  // by react-icons' own README table; do not fill this column from memory.
  vsc: { package: 'react-icons/vsc', prefix: 'Vsc', displayName: 'VS Code', license: 'CC-BY-4.0', licenseFile: 'licenses/vscode.md' },
  wi: { package: 'react-icons/wi', prefix: 'Wi', displayName: 'Weather', license: 'OFL-1.1', licenseFile: 'licenses/weather.md' },

  // Remaining react-icons packs. Every `prefix` below was read off the real
  // exports rather than inferred from the family code — `im` and `lia` both
  // sort `Im500Px` / `Lia500Px` first, so a rule derived from the first export
  // name yields `Im500`/`Lia500` and matches exactly one icon. A wrong prefix
  // here does not error; it silently builds an empty family.
  cg: { package: 'react-icons/cg', prefix: 'Cg', displayName: 'css.gg', license: 'MIT', licenseFile: 'licenses/css-gg.md' },
  ci: { package: 'react-icons/ci', prefix: 'Ci', displayName: 'Circum Icons', license: 'MPL-2.0', licenseFile: 'licenses/circum-icons.md' },
  di: { package: 'react-icons/di', prefix: 'Di', displayName: 'Devicons', license: 'MIT', licenseFile: 'licenses/devicons.md' },
  fc: { package: 'react-icons/fc', prefix: 'Fc', displayName: 'Flat Color Icons', license: 'MIT', licenseFile: 'licenses/flat-color-icons.md' },
  go: { package: 'react-icons/go', prefix: 'Go', displayName: 'Github Octicons', license: 'MIT', licenseFile: 'licenses/octicons.md' },
  gr: { package: 'react-icons/gr', prefix: 'Gr', displayName: 'Grommet Icons', license: 'Apache-2.0', licenseFile: 'licenses/grommet.md' },
  im: { package: 'react-icons/im', prefix: 'Im', displayName: 'IcoMoon Free', license: 'CC-BY-4.0', licenseFile: 'licenses/icomoon-free.md' },
  io: { package: 'react-icons/io', prefix: 'Io', displayName: 'Ionicons 4', license: 'MIT', licenseFile: 'licenses/ionicons4.md' },
  lia: { package: 'react-icons/lia', prefix: 'Lia', displayName: 'Line Awesome', license: 'MIT', licenseFile: 'licenses/line-awesome.md' },
  rx: { package: 'react-icons/rx', prefix: 'Rx', displayName: 'Radix Icons', license: 'MIT', licenseFile: 'licenses/radix.md' },
  sl: { package: 'react-icons/sl', prefix: 'Sl', displayName: 'Simple Line Icons', license: 'MIT', licenseFile: 'licenses/simple-line-icons.md' },
  tfi: { package: 'react-icons/tfi', prefix: 'Tfi', displayName: 'Themify Icons', license: 'MIT', licenseFile: 'licenses/themify.md' },
  ti: { package: 'react-icons/ti', prefix: 'Ti', displayName: 'Typicons', license: 'CC-BY-SA-3.0', licenseFile: 'licenses/typicons.md' }
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

/**
 * ⛔ The family → licence-file mapping is HAND-WRITTEN, so it is checked.
 *
 * `metadata.json` carries an SPDX id (9 distinct values) while the files are
 * named by project (29 of them), so `lu` → `licenses/lucide.md` is derivable by
 * nobody — a mirror could only crawl or guess, and guessing is precisely what
 * the corpus's own filename rule forbids. Hosting found this (channel
 * hosting↔framework): the doc said "mirror the whole tree" while the
 * index could not express the tree.
 *
 * Enumerating it is the fix; asserting it is what keeps the fix true. A copy
 * with no check drifts — two licence strings in this very file were wrong until
 * `97f0ab6` — so this fails the build rather than publishing a dangling path or
 * silently orphaning a licence nobody references.
 */
async function assertLicenseMapping() {
  const declared = new Map()
  for (const [code, cfg] of Object.entries(FAMILIES)) {
    if (!cfg.licenseFile) throw new Error(`licence mapping: family "${code}" declares no licenseFile`)
    declared.set(cfg.licenseFile, (declared.get(cfg.licenseFile) || []).concat(code))
  }

  const onDisk = new Set(
    (await readdir(join(__dirname, '../licenses'))).filter((f) => f.endsWith('.md')).map((f) => `licenses/${f}`)
  )

  const dangling = [...declared.keys()].filter((f) => !onDisk.has(f))
  if (dangling.length) throw new Error(`licence mapping: declared but missing on disk: ${dangling.join(', ')}`)

  const orphaned = [...onDisk].filter((f) => !declared.has(f))
  if (orphaned.length) {
    throw new Error(
      `licence mapping: present on disk but claimed by no family: ${orphaned.join(', ')}. ` +
        `Every licence text must belong to a published family, or it is redistributed with nothing it covers.`
    )
  }

  console.log(`Licence mapping: ${declared.size} files claimed by ${Object.keys(FAMILIES).length} families ✓`)
  return declared
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

  // Fail fast: a broken licence mapping should cost a second, not a full build.
  await assertLicenseMapping()

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

    // ⛔ A requested family that yields nothing is fatal, not a warning.
    //
    // The corpus is republished WHOLE, so a family that fails to import does not
    // arrive empty — it VANISHES, taking every name in it with it. Stored
    // documents reference those names forever, so a silent import failure would
    // break live content and read, to a mirror, as a deliberate removal.
    // `buildFamily` already logs and continues on a bad import; that is right for
    // one icon and wrong for a whole pack.
    if (success === 0) {
      throw new Error(
        `family "${family}" produced 0 icons — refusing to publish a corpus that silently drops it. ` +
          `Check that ${FAMILIES[family]?.package} imports and that the "${FAMILIES[family]?.prefix}" prefix is right.`
      )
    }

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
        // The SPDX id says WHICH licence; this says WHERE ITS TEXT IS. They are
        // not derivable from each other — 9 ids, 29 files — and a mirror needs
        // the second to stock the files that carry the obligation.
        licenseFile: FAMILIES[family].licenseFile,
        count: icons.length,
        // Bare names, unchanged. metadata.json is a PUBLIC URL with consumers
        // this repo cannot enumerate, so its shape is not ours to tidy; the
        // richer records live in the search index beside it. Both come from
        // this one loop — never a second pass over the corpus.
        icons: icons.map((i) => i.name)
      }
    }
  }

  // ── Attribution first: it belongs INSIDE the archives, being immutable bulk ──
  await copyFile(join(__dirname, '../ATTRIBUTION.md'), join(CDN_DIR, 'ATTRIBUTION.md'))
  await cp(join(__dirname, '../licenses'), join(CDN_DIR, 'licenses'), { recursive: true })

  // ── Archives ────────────────────────────────────────────────────────────────
  //
  // Walking the tree is 51,003 requests. One archive is 1. Both shapes ship: the
  // whole corpus for a cold stock, per-family for re-stocking only what moved.
  //
  // ⛔ They carry the IMMUTABLE BULK ONLY — SVGs, ATTRIBUTION.md, licenses/ —
  // and never the JSON indexes. Two reasons and the second is the load-bearing
  // one: metadata.json holds these archives' digests, so including it would be
  // circular; and the indexes change every publish while the bulk almost never
  // does, so an archive mixing them forces a consumer to re-fetch 18 MB to pick
  // up a `generatedAt` change.
  await mkdir(join(CDN_DIR, 'archives'), { recursive: true })

  const readEntry = async (rel) => ({ path: rel, data: await readFile(join(CDN_DIR, rel)) })
  const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

  const licenseFiles = (await readdir(join(CDN_DIR, 'licenses'))).map((f) => `licenses/${f}`)
  const attribution = ['ATTRIBUTION.md', ...licenseFiles]

  const archives = {}
  const bulkEntries = []

  for (const family of familiesToBuild) {
    if (!metadata.families[family]) continue
    const entries = await Promise.all(
      metadata.families[family].icons.map((name) => readEntry(iconPath(family, name)))
    )
    bulkEntries.push(...entries)
    const { gz, sha256: gzSha, contentSha256 } = tarGz(entries)
    await writeFile(join(CDN_DIR, 'archives', `${family}.tar.gz`), gz)
    archives[`archives/${family}.tar.gz`] = { sha256: gzSha, contentSha256, bytes: gz.length, family }
  }

  const corpus = tarGz([...bulkEntries, ...(await Promise.all(attribution.map(readEntry)))])
  await writeFile(join(CDN_DIR, 'archives', 'corpus.tar.gz'), corpus.gz)
  archives['archives/corpus.tar.gz'] = {
    sha256: corpus.sha256,
    // ⛔ Trigger a re-stock on THIS, not on sha256: gzip differs across zlib
    // builds, so the compressed digest moves when a CI runner upgrades Node.
    contentSha256: corpus.contentSha256,
    bytes: corpus.gz.length
  }

  metadata.archives = archives
  metadata.files = {
    attribution,
    indexes: ['metadata.json', 'index.json', 'digests.json',
              ...familiesToBuild.filter((f) => metadata.families[f]).map((f) => `${f}.json`)],
    archives: Object.keys(archives),
    page: ['index.html']
  }

  console.log(
    `Archives: corpus ${(corpus.gz.length / 1048576).toFixed(1)} MB + ${familiesToBuild.length} per-family`
  )

  // Write metadata
  await writeFile(
    join(CDN_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  )

  // Search index — root + one file per family, per
  // the shape the frontend lane specified, 2026-08-20.
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

  // ── digests.json — written LAST, because it covers everything else ──────────
  //
  // The audit instrument, not the stocking path: a mirror fetching archives
  // verifies one digest from metadata.json and never needs this. What this
  // answers is "is a mirror byte-correct?" after the fact, which nothing could
  // answer before.
  //
  // ⛔ Its own file on purpose. 2.1 MB gzip has no business in metadata.json,
  // which a picker fetches on cold open. And it covers every published file
  // except itself — a file cannot contain its own digest.
  const digests = {}
  const digestWalk = async (dir, rel = '') => {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const abs = join(dir, entry.name)
      const path = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) await digestWalk(abs, path)
      else if (path !== 'digests.json') digests[path] = sha256(await readFile(abs))
    }
  }
  await digestWalk(CDN_DIR)
  await writeFile(
    join(CDN_DIR, 'digests.json'),
    JSON.stringify({ generatedAt: metadata.generatedAt, algorithm: 'sha256', files: digests })
  )
  console.log(`Digests: ${Object.keys(digests).length} files`)

  console.log(`\nDone! Built ${totalSuccess} icons to cdn/`)
  if (totalFailed > 0) {
    console.log(`${totalFailed} icons failed.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
