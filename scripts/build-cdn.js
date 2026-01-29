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

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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
  vsc: { package: 'react-icons/vsc', prefix: 'Vsc', displayName: 'VS Code', license: 'MIT' },
  wi: { package: 'react-icons/wi', prefix: 'Wi', displayName: 'Weather', license: 'MIT' }
}

// Default families for CDN (migration-friendly set)
// Excludes very large families (pi, tb, gi) to keep CDN size reasonable
const DEFAULT_FAMILIES = ['lu', 'hi', 'hi2', 'fi', 'fa6', 'bs', 'md', 'ai', 'ri', 'si', 'io5', 'bi']

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
      // CDN naming: {family}-{name}.svg
      const fileName = `${familyCode}-${iconName}.svg`
      const filePath = join(outputDir, fileName)
      await writeFile(filePath, svg)

      iconList.push(iconName)
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

  const metadata = {
    generatedAt: new Date().toISOString(),
    families: {}
  }

  let totalSuccess = 0
  let totalFailed = 0

  for (const family of familiesToBuild) {
    const { success, failed, icons } = await buildFamily(family)
    totalSuccess += success
    totalFailed += failed

    if (FAMILIES[family]) {
      metadata.families[family] = {
        displayName: FAMILIES[family].displayName,
        license: FAMILIES[family].license,
        count: icons.length,
        icons
      }
    }
  }

  // Write metadata
  await writeFile(
    join(CDN_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  )

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
