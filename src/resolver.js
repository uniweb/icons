/**
 * Local Icon Resolver
 *
 * Provides fast, local icon resolution from this package.
 * Falls back to CDN if icon not found locally.
 *
 * The CDN origin and the corpus filename rule come from
 * `@uniweb/core/icon-corpus` — the same module `scripts/build-cdn.js` writes
 * those filenames with, and the same one `@uniweb/runtime` reads them with.
 * Don't respell either here; a writer and its readers with separate copies is
 * how one corpus ends up with two incompatible spellings.
 */
import { DEFAULT_ICON_BASE, iconUrl } from '@uniweb/core/icon-corpus'

/**
 * Map friendly family names to react-icons codes
 * Must match the mapping in @uniweb/runtime
 */
export const FAMILY_MAP = {
  // Friendly names
  lucide: 'lu',
  heroicons: 'hi',
  heroicons2: 'hi2',
  phosphor: 'pi',
  tabler: 'tb',
  feather: 'fi',
  // Font Awesome
  fa: 'fa',
  fa6: 'fa6',
  // Additional families
  bootstrap: 'bs',
  'material-design': 'md',
  'ant-design': 'ai',
  remix: 'ri',
  'simple-icons': 'si',
  vscode: 'vsc',
  weather: 'wi',
  game: 'gi',
  // Direct codes (pass-through)
  lu: 'lu',
  hi: 'hi',
  hi2: 'hi2',
  pi: 'pi',
  tb: 'tb',
  fi: 'fi',
  bs: 'bs',
  md: 'md',
  ai: 'ai',
  ri: 'ri',
  si: 'si',
  vsc: 'vsc',
  wi: 'wi',
  gi: 'gi'
}

/**
 * Families included in this package (local resolution)
 * Others fall back to CDN
 *
 * Note: pi (Phosphor) and tb (Tabler) are excluded due to size.
 * They work via CDN fallback.
 */
export const SUPPORTED_FAMILIES = ['lu', 'hi', 'hi2', 'fi']

/**
 * Create a local icon resolver
 *
 * @param {Object} options
 * @param {string} [options.cdnBase] - CDN fallback origin; defaults to the
 *   framework's own published corpus (`DEFAULT_ICON_BASE`)
 * @param {boolean} [options.useCdn=true] - Whether to fall back to CDN
 * @returns {Function} Resolver: (library, name) => Promise<string|null>
 */
export function createLocalResolver(options = {}) {
  const { cdnBase = DEFAULT_ICON_BASE, useCdn = true } = options

  // Cache resolved icons
  const cache = new Map()

  return async function resolve(library, name) {
    // Map friendly name to family code
    const familyCode = FAMILY_MAP[library.toLowerCase()]
    if (!familyCode) {
      console.warn(`[icons] Unknown family "${library}"`)
      return null
    }

    // Check cache
    const key = `${familyCode}:${name}`
    if (cache.has(key)) return cache.get(key)

    // Try local import first (if family is supported)
    if (SUPPORTED_FAMILIES.includes(familyCode)) {
      try {
        // Dynamic import from families directory
        // Icon files export default SVG string
        const module = await import(`./families/${familyCode}/${name}.js`)
        const svg = module.default
        if (svg) {
          cache.set(key, svg)
          return svg
        }
      } catch {
        // Icon not found locally, fall through to CDN
      }
    }

    // Fall back to CDN
    if (!useCdn) {
      cache.set(key, null)
      return null
    }

    try {
      const url = iconUrl(familyCode, name, cdnBase)
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const svg = await response.text()
      cache.set(key, svg)
      return svg
    } catch (err) {
      console.warn(`[icons] Failed to load ${library}:${name}`, err.message)
      cache.set(key, null)
      return null
    }
  }
}
