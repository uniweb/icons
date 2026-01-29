#!/usr/bin/env node
/**
 * Convert react-icons to individual ES modules
 *
 * Usage:
 *   node scripts/convert.js              # Convert default families
 *   node scripts/convert.js --all        # Convert all families
 *   node scripts/convert.js lu hi        # Convert specific families
 *
 * Each icon becomes a module:
 *   src/families/lu/home.js → export default '<svg>...</svg>'
 */

import { writeFile, mkdir, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FAMILIES_DIR = join(__dirname, '../src/families')

/**
 * react-icons family configurations
 * Key: family code
 * Value: { package, prefix, displayName }
 */
const FAMILIES = {
  lu: { package: 'react-icons/lu', prefix: 'Lu', displayName: 'Lucide' },
  hi: { package: 'react-icons/hi', prefix: 'Hi', displayName: 'Heroicons' },
  hi2: { package: 'react-icons/hi2', prefix: 'Hi', displayName: 'Heroicons 2' },
  pi: { package: 'react-icons/pi', prefix: 'Pi', displayName: 'Phosphor' },
  tb: { package: 'react-icons/tb', prefix: 'Tb', displayName: 'Tabler' },
  fi: { package: 'react-icons/fi', prefix: 'Fi', displayName: 'Feather' },
  fa: { package: 'react-icons/fa', prefix: 'Fa', displayName: 'Font Awesome 5' },
  fa6: { package: 'react-icons/fa6', prefix: 'Fa', displayName: 'Font Awesome 6' },
  bs: { package: 'react-icons/bs', prefix: 'Bs', displayName: 'Bootstrap' },
  md: { package: 'react-icons/md', prefix: 'Md', displayName: 'Material Design' },
  ai: { package: 'react-icons/ai', prefix: 'Ai', displayName: 'Ant Design' },
  ri: { package: 'react-icons/ri', prefix: 'Ri', displayName: 'Remix' },
  si: { package: 'react-icons/si', prefix: 'Si', displayName: 'Simple Icons' },
  io5: { package: 'react-icons/io5', prefix: 'Io', displayName: 'Ionicons 5' },
  bi: { package: 'react-icons/bi', prefix: 'Bi', displayName: 'Boxicons' },
  vsc: { package: 'react-icons/vsc', prefix: 'Vsc', displayName: 'VS Code' },
  wi: { package: 'react-icons/wi', prefix: 'Wi', displayName: 'Weather' },
  gi: { package: 'react-icons/gi', prefix: 'Gi', displayName: 'Game' }
}

// Default families to convert (most commonly used)
const DEFAULT_FAMILIES = ['lu', 'hi', 'hi2', 'pi', 'tb', 'fi']

/**
 * Convert PascalCase icon name to kebab-case
 * LuHome → home
 * LuArrowRight → arrow-right
 * HiOutlineHome → outline-home
 */
function toKebabCase(name, prefix) {
  // Remove prefix
  const withoutPrefix = name.startsWith(prefix) ? name.slice(prefix.length) : name

  // Convert PascalCase to kebab-case
  return withoutPrefix
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '') // Remove leading dash
}

/**
 * SVG attributes that should remain camelCase
 * (React uses camelCase, but these are the native SVG camelCase attributes)
 */
const CAMEL_CASE_ATTRS = new Set([
  'viewBox',
  'preserveAspectRatio',
  'baseFrequency',
  'gradientTransform',
  'gradientUnits',
  'patternTransform',
  'patternUnits',
  'clipPathUnits',
  'maskContentUnits',
  'maskUnits',
  'filterUnits',
  'primitiveUnits',
  'spreadMethod',
  'textLength',
  'lengthAdjust',
  'startOffset',
  'attributeName',
  'attributeType',
  'repeatCount',
  'repeatDur',
  'keyPoints',
  'keySplines',
  'keyTimes',
  'calcMode',
  'stdDeviation',
  'baseProfile',
  'glyphRef',
  'xChannelSelector',
  'yChannelSelector',
  'tableValues',
  'surfaceScale',
  'specularConstant',
  'specularExponent',
  'diffuseConstant',
  'kernelMatrix',
  'kernelUnitLength',
  'targetX',
  'targetY',
  'pathLength',
  'refX',
  'refY',
  'markerWidth',
  'markerHeight',
  'markerUnits'
])

/**
 * Convert attribute name from React to SVG format
 */
function toSvgAttr(name) {
  // Keep native SVG camelCase attributes
  if (CAMEL_CASE_ATTRS.has(name)) {
    return name
  }
  // Convert React camelCase (strokeWidth) to kebab-case (stroke-width)
  return name.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/**
 * Convert a React icon component to SVG string
 *
 * react-icons components return React elements when called:
 * {
 *   type: IconBase (function),
 *   props: {
 *     attr: { viewBox, fill, stroke, ... },
 *     children: [ { type: 'path', props: { d: '...' } }, ... ]
 *   }
 * }
 */
function iconToSvg(IconComponent) {
  const icon = IconComponent({})

  if (!icon?.props) {
    return null
  }

  const { attr, children } = icon.props

  // Build SVG attributes
  const attrs = Object.entries(attr || {})
    .map(([key, value]) => `${toSvgAttr(key)}="${value}"`)
    .join(' ')

  // Build child elements
  const childrenStr = renderChildren(children)

  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${childrenStr}</svg>`
}

/**
 * Recursively render React element children to string
 */
function renderChildren(children) {
  if (!children) return ''
  if (!Array.isArray(children)) children = [children]

  return children
    .map((child) => {
      if (typeof child === 'string') return child
      if (!child?.type) return ''

      const { type, props } = child

      // Build attributes from props (excluding children, key, ref)
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

/**
 * Convert all icons from a family
 */
async function convertFamily(familyCode) {
  const config = FAMILIES[familyCode]
  if (!config) {
    console.error(`Unknown family: ${familyCode}`)
    return { success: 0, failed: 0 }
  }

  console.log(`\nConverting ${config.displayName} (${familyCode})...`)

  // Dynamic import the react-icons family
  let icons
  try {
    icons = await import(config.package)
  } catch (err) {
    console.error(`  Failed to import ${config.package}: ${err.message}`)
    console.error(`  Make sure react-icons is installed: pnpm add -D react-icons`)
    return { success: 0, failed: 0 }
  }

  // Create output directory
  const outputDir = join(FAMILIES_DIR, familyCode)
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  let success = 0
  let failed = 0

  // Process each icon
  for (const [exportName, IconComponent] of Object.entries(icons)) {
    // Skip non-icon exports (like IconContext)
    if (typeof IconComponent !== 'function') continue
    if (!exportName.startsWith(config.prefix)) continue

    try {
      const svg = iconToSvg(IconComponent)
      if (!svg) {
        failed++
        continue
      }

      // Convert name: LuHome → home
      const iconName = toKebabCase(exportName, config.prefix)

      // Write as ES module
      const modulePath = join(outputDir, `${iconName}.js`)
      const content = `export default ${JSON.stringify(svg)};\n`
      await writeFile(modulePath, content)

      success++
    } catch (err) {
      console.error(`  Failed to convert ${exportName}: ${err.message}`)
      failed++
    }
  }

  console.log(`  Converted ${success} icons${failed > 0 ? `, ${failed} failed` : ''}`)

  // Create index file for the family
  const indexPath = join(outputDir, 'index.js')
  const indexContent = `/**
 * ${config.displayName} Icons
 *
 * Import individual icons for tree-shaking:
 *   import home from '@uniweb/icons/families/${familyCode}/home.js'
 *
 * Or import all (not recommended for production):
 *   import * as ${familyCode}Icons from '@uniweb/icons/families/${familyCode}'
 */

// Re-export all icons (for development/debugging)
// In production, import individual icons directly
${success > 0 ? `export * from './*.js'` : '// No icons generated'}
`
  await writeFile(indexPath, indexContent)

  return { success, failed }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)

  let familiesToConvert

  if (args.includes('--all')) {
    familiesToConvert = Object.keys(FAMILIES)
  } else if (args.length > 0) {
    familiesToConvert = args.filter((arg) => !arg.startsWith('--'))
  } else {
    familiesToConvert = DEFAULT_FAMILIES
  }

  console.log('Converting icon families:', familiesToConvert.join(', '))

  let totalSuccess = 0
  let totalFailed = 0

  for (const family of familiesToConvert) {
    const { success, failed } = await convertFamily(family)
    totalSuccess += success
    totalFailed += failed
  }

  console.log(`\nDone! Converted ${totalSuccess} icons total.`)
  if (totalFailed > 0) {
    console.log(`${totalFailed} icons failed to convert.`)
  }
}

main().catch(console.error)
