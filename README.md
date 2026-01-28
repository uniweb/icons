# @uniweb/icons

Icon library for Uniweb sites. Provides lazily loaded SVG icons from popular icon sets.

## Features

- **Local resolution**: Faster than CDN for included icon families
- **Tree-shakeable**: Import only the icons you use
- **CDN fallback**: Automatically falls back to GitHub Pages CDN
- **Permissive licenses**: All included icons use MIT, ISC, or similar licenses

## Installation

```bash
pnpm add @uniweb/icons
```

## Usage

### With Uniweb Runtime

Icons are automatically available when using `![](lucide:home)` syntax in markdown. The runtime fetches icons from the CDN by default.

For local resolution (faster, offline-capable), configure the runtime:

```js
import { createLocalResolver } from '@uniweb/icons/resolver'

// In your site's initialization
uniweb.iconResolver = createLocalResolver()
```

### Direct Icon Imports

For maximum tree-shaking, import icons directly:

```js
import homeSvg from '@uniweb/icons/families/lu/home.js'
// homeSvg is the SVG string: '<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>'
```

## Included Families (npm package)

These families are included in the npm package for local resolution:

| Family | Code | Icons | License |
|--------|------|-------|---------|
| [Lucide](https://lucide.dev) | `lu` | 1,541 | ISC |
| [Heroicons](https://heroicons.com) v1 | `hi` | 460 | MIT |
| [Heroicons](https://heroicons.com) v2 | `hi2` | 972 | MIT |
| [Feather](https://feathericons.com) | `fi` | 287 | MIT |

## CDN-Only Families

These families are available via CDN but not included in the npm package (to reduce size):

| Family | Code | License | Notes |
|--------|------|---------|-------|
| [Phosphor](https://phosphoricons.com) | `pi` | MIT | Large set (9k+ icons) |
| [Tabler](https://tabler-icons.io) | `tb` | MIT | Large set (5k+ icons) |
| [Bootstrap](https://icons.getbootstrap.com) | `bs` | MIT | |
| [Material Design](https://fonts.google.com/icons) | `md` | Apache-2.0 | |
| [Ant Design](https://ant.design/components/icon) | `ai` | MIT | |
| [Remix](https://remixicon.com) | `ri` | Apache-2.0 | |
| [Simple Icons](https://simpleicons.org) | `si` | CC0-1.0 | Brand logos |

## CDN

Icons are served from GitHub Pages:

```
https://uniweb.github.io/icons/{family}/{family}-{name}.svg
```

Example: `lucide:home` → `https://uniweb.github.io/icons/lu/lu-home.svg`

### Custom CDN

To use a different CDN:

```yaml
# site.yml
icons:
  cdnUrl: https://your-cdn.com/icons
```

## Licensing

This package redistributes icons from upstream projects. Each icon family retains its original license:

- **ISC**: Lucide (see [licenses/lucide.md](licenses/lucide.md))
- **MIT**: Heroicons, Feather (see [licenses/](licenses/))

All included families use permissive licenses (MIT, ISC, Apache-2.0, CC0) that allow redistribution with attribution. See the `licenses/` directory for full license texts.

**Note**: Some icon families available via CDN (Font Awesome, VS Code Icons, Game Icons) use CC BY licenses that require attribution. If you use these families, ensure proper attribution in your project.

## Development

### Converting Icons (for npm package)

```bash
pnpm install
pnpm convert           # Default families
pnpm convert:all       # All families
```

### Building CDN

```bash
node scripts/build-cdn.js    # Build SVG files for CDN deployment
```

The GitHub Actions workflow automatically builds and deploys to GitHub Pages on tagged releases.

## License

This package's code is MIT licensed. Icon assets retain their original licenses (see above).
