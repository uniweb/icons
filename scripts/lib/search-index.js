/**
 * The search index — what a picker needs, derived from the corpus it ships with.
 *
 * Specified by frontend in `collab/context/icon-search-index-shape.md` (channel
 * `frontend-framework-f072`); this module is the producer half. The split is
 * deliberate: they own what a query must answer, we own how terms are derived,
 * and the artifact ships from here because this is where the names are minted.
 *
 * ## Two rules that are not style preferences
 *
 * 1. **Generated with the corpus, in the same pass, from the same names.** The
 *    corpus is rebuilt whole every publish, so an index generated at a different
 *    moment can name icons that no longer exist. It is emitted from the same
 *    in-memory list `build-cdn.js` just wrote the SVGs from.
 * 2. **`file` is the corpus-relative path from `iconPath()`, never rebuilt from
 *    the key.** A consumer does `{base} + '/' + file` and knows no layout. Two
 *    producers spelling one corpus is what created two icon namespaces; a
 *    consumer re-deriving a filename would be a third speller.
 *
 * ⛔ **Never hand-maintained per icon.** The synonym groups below are RULES
 * applied mechanically to every name — not a per-icon tag list. That distinction
 * is the whole difference from the retired tag corpus, which had 47k curated
 * instances and no surviving producer.
 */
import { iconPath } from '@uniweb/core/icon-corpus'

/**
 * Variant markers. Dropped only from MULTI-token names: `lu-bold` is a real
 * icon (text styling) and must keep its only token, while `heart-filled` should
 * not advertise "filled" — frontend measured that 8 of the 12 most common tags
 * in the legacy corpus were family codes or variant words, matching nothing an
 * author types.
 */
const VARIANT_TOKENS = new Set([
  'fill', 'filled', 'outline', 'outlined', 'solid', 'duotone', 'twotone',
  'thin', 'light', 'regular', 'alt'
])

/**
 * Synonym groups: any member present adds the others.
 *
 * Author vocabulary, not icon vocabulary — the gap this closes is that authors
 * type "delete" and the corpus says "trash". Matching is on WHOLE TOKENS, which
 * is what keeps `lock` out of `alarm-clock` (tokens `alarm`,`clock`) and `tick`
 * out of `drumstick` (one token, `drumstick`). Substring expansion here would be
 * actively worse than no expansion at all.
 */
const SYNONYM_GROUPS = [
  ['trash', 'delete', 'remove', 'bin', 'erase'],
  ['mail', 'email', 'envelope'],
  ['warning', 'alert', 'caution', 'danger', 'exclamation'],
  ['cart', 'basket', 'shopping'],
  ['users', 'people', 'team', 'group', 'contacts'],
  ['user', 'person', 'profile', 'account', 'avatar'],
  ['login', 'signin', 'logout', 'signout', 'session'],
  ['lock', 'secure', 'security', 'password', 'private'],
  ['shield', 'protect', 'protection', 'secure'],
  ['check', 'tick', 'done', 'complete', 'confirm', 'success'],
  ['settings', 'gear', 'cog', 'preferences', 'config'],
  ['search', 'find', 'magnifier', 'magnifying'],
  ['edit', 'pencil', 'pen', 'write', 'compose'],
  ['image', 'photo', 'picture'],
  ['file', 'document', 'doc'],
  ['folder', 'directory'],
  ['link', 'chain', 'url'],
  ['star', 'favorite', 'favourite', 'bookmark'],
  ['heart', 'like', 'love'],
  ['close', 'cancel', 'dismiss', 'times'],
  ['plus', 'add', 'new', 'create'],
  ['menu', 'hamburger', 'bars'],
  ['info', 'information', 'about'],
  ['help', 'question', 'support'],
  ['calendar', 'date', 'schedule', 'event'],
  ['clock', 'time', 'timer'],
  ['home', 'house'],
  ['bell', 'notification', 'notify'],
  ['chat', 'message', 'comment', 'conversation'],
  ['download', 'save'],
  ['upload', 'publish'],
  ['print', 'printer'],
  ['refresh', 'reload', 'sync', 'update'],
  ['play', 'start'],
  ['pause', 'stop'],
  ['money', 'currency', 'payment', 'cash'],
  ['chart', 'graph', 'analytics', 'statistics'],
  ['location', 'map', 'pin', 'marker', 'place'],
  ['phone', 'call', 'telephone'],
  ['cloud', 'server', 'hosting'],
  ['code', 'terminal', 'console', 'developer']
]

/** token → the terms it also implies. Built once from the groups above. */
const SYNONYMS = (() => {
  const m = new Map()
  for (const group of SYNONYM_GROUPS) {
    for (const token of group) {
      const acc = m.get(token) || new Set()
      group.forEach((other) => other !== token && acc.add(other))
      m.set(token, acc)
    }
  }
  return m
})()

/**
 * Derive the search terms for one icon.
 *
 * @param {string} name - canonical kebab name (`a-arrow-down`)
 * @param {string} family - short family code, excluded from the output
 * @returns {string[]} sorted, deduped terms
 */
export function deriveTerms(name, family) {
  const raw = String(name).split('-').filter(Boolean)
  const multi = raw.length > 1

  const tokens = raw.filter(
    (t) =>
      t.length > 1 &&            // `a` in `a-arrow-down` is noise
      t !== family &&            // never the family code — 100% of the legacy corpus did this
      !(multi && VARIANT_TOKENS.has(t))
  )

  const terms = new Set(tokens)
  for (const t of tokens) {
    const implied = SYNONYMS.get(t)
    if (implied) implied.forEach((s) => terms.add(s))
  }
  return [...terms].sort()
}

/**
 * Build the index artifacts from the corpus that was just written.
 *
 * @param {Object} args
 * @param {Object} args.families - { [code]: { displayName, license, icons: [{name, react}] } }
 * @param {string} args.generatedAt
 * @param {string} args.reactIcons - resolved react-icons version
 * @returns {{root: Object, perFamily: Map<string, Object>}}
 */
export function buildSearchIndex({ families, generatedAt, reactIcons }) {
  const perFamily = new Map()
  const termFamilies = new Map()

  for (const [code, info] of Object.entries(families)) {
    const icons = {}
    for (const { name, react } of info.icons) {
      const terms = deriveTerms(name, code)
      icons[name] = { react, file: iconPath(code, name), terms }
      for (const t of terms) {
        const fams = termFamilies.get(t) || new Set()
        fams.add(code)
        termFamilies.set(t, fams)
      }
    }
    perFamily.set(code, { family: code, icons })
  }

  const root = {
    generatedAt,
    corpus: { reactIcons },
    families: Object.entries(families).map(([id, info]) => ({
      id,
      displayName: info.displayName,
      license: info.license,
      count: info.icons.length,
      index: `${id}.json`
    })),
    // term → the FAMILIES that contain it, never to icon ids: frontend measured
    // full postings at 719 KB against 63 KB for this, and a median term selects
    // exactly one family.
    terms: Object.fromEntries(
      [...termFamilies].sort(([a], [b]) => a.localeCompare(b)).map(([t, f]) => [t, [...f].sort()])
    )
  }

  return { root, perFamily }
}
