# Icon Attribution

This package includes icons from multiple open-source icon libraries. Each family has its own license.

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
