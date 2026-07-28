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

Each family also ships a manifest listing the icon ids it contains — enough to build
a picker or validate a name without loading any SVG payloads:

```js
import { family, names } from '@uniweb/icons/families/lu'
// family = 'lu', names = ['a-arrow-down', 'a-arrow-up', …]
```

The manifest is names only, not a barrel of re-exports: most ids (`a-arrow-down`)
aren't valid JS identifiers, and every icon module is a default export. Load icons
through the per-icon path above or through the resolver.

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

### Building the CDN

```bash
node scripts/build-cdn.js    # Build SVG files into cdn/
```

### Releasing

**One version number covers both artifacts.** The npm package and the CDN release
from the same tag, so `package.json`, the git tag, and the published package always
agree. Don't tag the CDN independently — a tag that doesn't match `package.json`
looks like a package version and isn't one.

```bash
# 1. bump the version in package.json, commit
# 2. tag that commit and push both
git tag v0.1.1 && git push && git push --tags
# 3. publish to npm
npm publish --access public
```

Pushing a `v*` tag runs the **Deploy Icons to GitHub Pages** workflow, which
rebuilds `cdn/` and uploads it.

> **The tag-triggered deploy does not currently complete.** The `github-pages`
> environment allows deployments only from `main`, so a tag run builds the artifact
> and is then rejected at the deploy step (`Tag "vX.Y.Z" is not allowed to deploy to
> github-pages due to environment protection rules`). Until that policy accepts `v*`
> tags, publish the CDN by running the same workflow manually from the Actions tab
> (`workflow_dispatch`, on `main`) after pushing the tag.

## License

This package's code is MIT licensed. Icon assets retain their original licenses (see above).
