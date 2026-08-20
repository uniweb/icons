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

## CDN Families

The CDN publishes **every family this package knows how to build except Typicons**
— 30 families. The npm package still ships only the four above; the rest resolve
over the CDN.

Family lists go stale, so ask the corpus rather than this file:

```bash
curl -s https://uniweb.github.io/icons/metadata.json \
  | python3 -c "import json,sys; d=json.load(sys.stdin); f=d['families']; \
      print(d['generatedAt'], d.get('corpus', {}).get('reactIcons', '?'), len(f), sorted(f))"
```

**Typicons (`ti`) is excluded deliberately.** It is the only CC BY-SA family here
— share-alike, not merely attribution — and that obligation has not been
answered. It is 336 icons, so excluding it costs little. Adding it back is a
licensing decision, not a coverage one. See [ATTRIBUTION.md](ATTRIBUTION.md).

## CDN

Icons are served from GitHub Pages:

```
https://uniweb.github.io/icons/{family}/{family}-{name}.svg
```

Example: `lucide:home` → `https://uniweb.github.io/icons/lu/lu-home.svg`

### Search index

Alongside the SVGs the CDN publishes an index for building an icon picker —
a root listing families and which of them contain a given term, plus one file
per family:

```
https://uniweb.github.io/icons/index.json      families, licences, term → families
https://uniweb.github.io/icons/{family}.json   { name: { react, file, terms } }
```

`file` is the corpus-relative path, so a consumer builds a URL as
`{base}/{file}` without knowing the layout. Terms are **generated from the
canonical names every build** — never hand-maintained — so the index cannot
name an icon the corpus does not have.

### Attribution

`ATTRIBUTION.md` and `licenses/` are published with the corpus, at
`/ATTRIBUTION.md` and `/licenses/`. Several families require attribution when
redistributed; the table in `ATTRIBUTION.md` says which.

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

### The `react-icons` pin

`react-icons` is pinned to an **exact** version, not a range. The corpus is
rebuilt whole on every publish, so the upstream version is part of what the
corpus *is*: a name upstream retires disappears here on the next build, and
every document referencing it breaks. A pin does not prevent that — it makes it
a reviewed diff in a commit instead of an invisible change. Bump it deliberately
and read the family counts in the build output.

The version that produced a corpus is published with it, as
`metadata.json`'s `corpus.reactIcons` and the search index root's.

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
rebuilds `cdn/` and publishes it. That is the only thing that updates the CDN —
merging to `main` does not, so an icon family added without a release stays
unpublished until one is cut.

> The `github-pages` environment must permit deployments from `v*` **tags**, not
> only from `main`. Without that rule a tag run builds the artifact and is then
> rejected at the deploy step (`Tag "vX.Y.Z" is not allowed to deploy to
> github-pages due to environment protection rules`), which fails quietly enough
> to go unnoticed — the build is green and only the deploy job is red.

> **CI resolves `@uniweb/core` from npm, on purpose.** That dependency is declared
> `workspace:^`, which resolves only inside the pnpm workspace this package is
> authored in; CI checks this repo out on its own, where pnpm refuses the spec
> with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` before the build runs. The workflow
> therefore rewrites it to the published package (`npm pkg set
> 'dependencies.@uniweb/core=latest'`) ahead of `pnpm install`. `package.json`
> keeps `workspace:^` — the release tooling substitutes a real range at publish
> time, so the tarball on npm carries an ordinary caret range.
>
> **Add another `@uniweb/*` dependency here and you must extend that step.** The
> failure cannot be reproduced from a workspace checkout, where the same install
> succeeds — it appears only in the runner, and only as a red deploy job.

## License

This package's code is MIT licensed. Icon assets retain their original licenses (see above).
