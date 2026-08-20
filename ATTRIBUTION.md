# Icon Attribution

This package includes icons from multiple open-source icon libraries. Each family has its own license.

## What we changed

Attribution licences (CC BY, CC BY-SA) require indicating whether the work was modified.
**For every family here the answer is the same: format only.**

Icons are extracted from the [`react-icons`](https://github.com/react-icons/react-icons)
distribution and serialized to standalone SVG files. Path data, `viewBox` and presentation
attributes are carried through unchanged; no artwork is redrawn, recoloured or edited. The
file naming (`{family}/{family}-{name}.svg`) is ours.

## Quick Reference

| Family | Code | License | Attribution Required? |
|--------|------|---------|----------------------|
| Lucide | `lu` | ISC | No (include license) |
| Heroicons | `hi`, `hi2` | MIT | No (include license) |
| Feather | `fi` | MIT | No (include license) |
| Font Awesome | `fa`, `fa6` | CC BY 4.0 | Yes (see below) |
| Bootstrap | `bs` | MIT | No (include license) |
| Material Design | `md` | Apache 2.0 | No (appreciated) |
| Ant Design | `ai` | MIT | No (include license) |
| Remix | `ri` | Apache 2.0 | No (include license) |
| Simple Icons | `si` | CC0 | No (public domain) |
| Ionicons | `io5` | MIT | No (include license) |
| Boxicons | `bi` | MIT | No (include license) |
| Phosphor | `pi` | MIT | No (include license) |
| Tabler | `tb` | MIT | No (include license) |
| Game Icons | `gi` | CC BY 3.0 | **Yes** (see below) |
| VS Code Icons | `vsc` | CC BY 4.0 | **Yes** (see below) |
| Weather Icons | `wi` | SIL OFL 1.1 | **Yes** — font licence (see below) |
| css.gg | `cg` | MIT | No (include license) |
| Circum Icons | `ci` | **MPL 2.0** | No — but copyleft on modified files (see below) |
| Devicons | `di` | MIT | No (include license) |
| Flat Color Icons | `fc` | MIT | No (include license) |
| Github Octicons | `go` | MIT | No (include license) |
| Grommet Icons | `gr` | Apache 2.0 | No (include license) |
| IcoMoon Free | `im` | CC BY 4.0 | **Yes** (see below) |
| Ionicons 4 | `io` | MIT | No (include license) |
| Line Awesome | `lia` | MIT | No (include license) |
| Radix Icons | `rx` | MIT | No (include license) |
| Simple Line Icons | `sl` | MIT | No (include license) |
| Themify Icons | `tfi` | MIT | No (include license) |
| Typicons | `ti` | **CC BY-SA 3.0** | **Yes — and SHARE-ALIKE** (see below) |

> **Corrected 2026-07-29.** `vsc` and `wi` were previously declared MIT. Both are wrong:
> VS Code Icons are CC BY 4.0 and Weather Icons are SIL OFL 1.1, and **both require
> attribution** where MIT does not. `gi`, `pi` and `tb` were buildable but undocumented.
> Anyone who relied on an earlier version of this table to satisfy attribution for those
> families should re-check against the rows above.

## For Site Owners

**Most families (MIT, ISC, Apache 2.0):** No action needed. By using this package, the license files are included in your dependencies, which satisfies the license requirements.

**Font Awesome (CC BY 4.0):** Attribution is required but flexible. Options:

1. **Easiest:** Do nothing special - Font Awesome says their files contain "sufficient attribution" via embedded comments
2. **Better:** Add a credit to your site's footer or about page:
   ```
   Icons by Font Awesome (fontawesome.com) - CC BY 4.0
   ```
3. **Link:** Include a link to https://fontawesome.com somewhere on your site

**Game Icons (CC BY 3.0) and VS Code Icons (CC BY 4.0):** Attribution **is** required. Credit
the library and link its source (see Sources below). Each game icon also has an individual
author; game-icons.net lists them per icon, and CC BY asks for the author where known.

**Weather Icons (SIL OFL 1.1):** A font licence, so the rules differ from the CC/MIT families:
the icons may be used and redistributed freely, but the **Reserved Font Name** may not be used
for a modified version, and derivatives must stay under OFL. Include the licence text.

**IcoMoon Free (CC BY 4.0):** Attribution required, same shape as Font Awesome. Upstream offers
GPL as an alternative; this package treats it as CC BY 4.0, the option that imposes no copyleft
on your site.

**Typicons (CC BY-SA 3.0) — the only share-alike family.** Attribution **and share-alike**: if you
modify the icon artwork, that artwork must be released under CC BY-SA 3.0 too. Using an icon
unmodified in a page does **not** make your page a derivative; editing the artwork does make
that artwork share-alike.

**To remove any doubt about the conversion below: the Typicons SVG files published in this
package and on its CDN are made available under CC BY-SA 3.0**, the same licence as the
originals. Section 3 of that licence grants "the right to make such modifications as are
technically necessary to exercise the rights in other media and formats" and does not treat
them as an Adaptation, so a format conversion that leaves the artwork untouched arguably
creates nothing new to license — but stating it costs nothing and settles the question
either way. Share-alike reaches **that artwork**, never a page that displays it, never the
other families here, and never this package's own code (§4(a): a Collection is not itself
subject to the licence).

**Circum Icons (MPL 2.0) — the only copyleft licence here.** File-level, so using an icon as-is
triggers nothing, but a **modified** icon file stays MPL-2.0 and its source must be available to
recipients. Do not treat a modified Circum icon as if it were MIT.

**Material Design (Apache 2.0):** Google says attribution is "appreciated but not required."

**Simple Icons (CC0):** Public domain - no requirements at all.

## Brand Icons

Some icon families include brand/logo icons. These remain trademarks of their respective companies. Using a brand icon does not imply endorsement.

## Full License Texts

See the `licenses/` directory for complete license texts:

- [Lucide](./licenses/lucide.md) - ISC
- [Heroicons](./licenses/heroicons.md) - MIT
- [Feather](./licenses/feather.md) - MIT
- [Font Awesome](./licenses/font-awesome.md) - CC BY 4.0
- [Bootstrap](./licenses/bootstrap.md) - MIT
- [Material Design](./licenses/material-design.md) - Apache 2.0
- [Ant Design](./licenses/ant-design.md) - MIT
- [Remix](./licenses/remix.md) - Apache 2.0
- [Simple Icons](./licenses/simple-icons.md) - CC0
- [Ionicons](./licenses/ionicons.md) - MIT
- [Boxicons](./licenses/boxicons.md) - MIT
- [Phosphor](./licenses/phosphor.md) - MIT
- [Tabler](./licenses/tabler.md) - MIT
- [Game Icons](./licenses/game-icons.md) - CC BY 3.0
- [VS Code Icons](./licenses/vscode.md) - CC BY 4.0
- [Weather Icons](./licenses/weather.md) - SIL OFL 1.1
- [css.gg](./licenses/css-gg.md) - MIT
- [Circum Icons](./licenses/circum-icons.md) - MPL 2.0
- [Devicons](./licenses/devicons.md) - MIT
- [Flat Color Icons](./licenses/flat-color-icons.md) - MIT
- [Github Octicons](./licenses/octicons.md) - MIT
- [Grommet Icons](./licenses/grommet.md) - Apache 2.0
- [IcoMoon Free](./licenses/icomoon-free.md) - CC BY 4.0
- [Ionicons 4](./licenses/ionicons4.md) - MIT
- [Line Awesome](./licenses/line-awesome.md) - MIT
- [Radix Icons](./licenses/radix.md) - MIT
- [Simple Line Icons](./licenses/simple-line-icons.md) - MIT
- [Themify Icons](./licenses/themify.md) - MIT
- [Typicons](./licenses/typicons.md) - CC BY-SA 3.0

## Sources

- Lucide: https://lucide.dev
- Heroicons: https://heroicons.com
- Feather: https://feathericons.com
- Font Awesome: https://fontawesome.com
- Bootstrap Icons: https://icons.getbootstrap.com
- Material Design: https://fonts.google.com/icons
- Ant Design: https://ant.design/components/icon
- Remix Icons: https://remixicon.com
- Simple Icons: https://simpleicons.org
- Ionicons: https://ionic.io/ionicons
- Boxicons: https://boxicons.com
- Phosphor: https://phosphoricons.com
- Tabler: https://tabler.io/icons
- Game Icons: https://game-icons.net
- VS Code Icons: https://github.com/microsoft/vscode-codicons
- Weather Icons: https://erikflowers.github.io/weather-icons/
- css.gg: https://css.gg
- Circum Icons: https://circumicons.com
- Devicons: https://vorillaz.github.io/devicons/
- Flat Color Icons: https://github.com/icons8/flat-color-icons
- Github Octicons: https://primer.style/octicons/
- Grommet Icons: https://icons.grommet.io
- IcoMoon Free: https://github.com/Keyamoon/IcoMoon-Free
- Ionicons 4: https://ionic.io/ionicons
- Line Awesome: https://icons8.com/line-awesome
- Radix Icons: https://icons.radix-ui.com
- Simple Line Icons: https://thesabbir.github.io/simple-line-icons/
- Themify Icons: https://themify.me/themify-icons
- Typicons: http://s-ings.com/typicons/
