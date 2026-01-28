/**
 * @uniweb/icons
 *
 * Icon library for Uniweb - lazily loaded SVG icons from popular icon sets.
 *
 * This package provides:
 * 1. A local resolver for faster icon loading (vs CDN)
 * 2. Individual icon modules for tree-shaking
 * 3. Conversion scripts to generate icons from react-icons
 *
 * Usage with Uniweb runtime:
 * ```js
 * import { createLocalResolver } from '@uniweb/icons/resolver'
 *
 * // In runtime initialization
 * uniweb.iconResolver = createLocalResolver()
 * ```
 *
 * Direct icon imports (tree-shakeable):
 * ```js
 * import home from '@uniweb/icons/families/lu/home.js'
 * // home is the SVG string
 * ```
 */

export { createLocalResolver, SUPPORTED_FAMILIES } from './resolver.js'
