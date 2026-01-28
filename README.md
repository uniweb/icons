# @uniweb/icons

Icon library for Uniweb sites. Provides lazily loaded SVG icons from popular icon sets.

## Features

- **Local resolution**: Faster than CDN for included icon families
- **Tree-shakeable**: Import only the icons you use
- **CDN fallback**: Automatically falls back to CDN for non-local icons
- **16+ icon families**: Lucide, Heroicons, Phosphor, Tabler, Feather, and more

## Installation

```bash
pnpm add @uniweb/icons
```

## Usage

### With Uniweb Runtime

The icons are automatically available when using `![](lucide:home)` syntax in markdown. For local resolution (faster than CDN), configure the runtime to use the local resolver:

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

## Supported Families

| Friendly Name | Code | Package |
|--------------|------|---------|
| `lucide` | `lu` | Lucide Icons |
| `heroicons` | `hi` | Heroicons v1 |
| `heroicons2` | `hi2` | Heroicons v2 |
| `phosphor` | `pi` | Phosphor Icons |
| `tabler` | `tb` | Tabler Icons |
| `feather` | `fi` | Feather Icons |
| `fa` | `fa` | Font Awesome 5 |
| `fa6` | `fa6` | Font Awesome 6 |
| `bootstrap` | `bs` | Bootstrap Icons |
| `material-design` | `md` | Material Design |
| `ant-design` | `ai` | Ant Design Icons |
| `remix` | `ri` | Remix Icons |
| `simple-icons` | `si` | Simple Icons |
| `vscode` | `vsc` | VS Code Icons |
| `weather` | `wi` | Weather Icons |
| `game` | `gi` | Game Icons |

## Development

### Converting Icons

Icons are converted from `react-icons` to individual ES modules:

```bash
# Install dependencies
pnpm install

# Convert default families (lu, hi, hi2, pi, tb, fi)
pnpm convert

# Convert all families
pnpm convert:all

# Convert specific families
node scripts/convert.js lu hi
```

### Output Structure

```
src/families/
├── lu/
│   ├── home.js          # export default '<svg>...</svg>'
│   ├── arrow-right.js
│   └── ...
├── hi/
│   └── ...
└── ...
```

## CDN Fallback

When an icon isn't available locally, the resolver falls back to the Uniweb icons CDN:

```
https://icons.uniweb.app/{familyCode}/{familyCode}-{iconName}.svg
```

Example: `lucide:home` → `https://icons.uniweb.app/lu/lu-home.svg`

## License

MIT
