/**
 * A deterministic tar writer — same bytes in, same bytes out, on any platform.
 *
 * ## Why this is not `tar czf`
 *
 * A mirror's re-stock trigger is *"has the archive's sha256 moved?"*. That only
 * works if an archive of unchanged content has an unchanged digest, and the
 * obvious implementation does not:
 *
 * - **tar embeds mtimes.** Two `tar czf` runs a second apart over identical
 *   files produce different bytes — measured 2026-08-20, which is why this file
 *   exists. A consumer would re-fetch the whole corpus on every publish, for
 *   nothing, and the archive/index split would buy them exactly zero.
 * - **gzip embeds a timestamp** of its own, so the same trap twice.
 * - ⛔ **and the flags differ by platform**: GNU tar takes `--sort=name`
 *   `--mtime` `--owner`, bsdtar does not. CI runs ubuntu, developers run macOS,
 *   so shelling out means the archive built by the machine that verifies it is
 *   not the archive built by the machine that publishes it.
 *
 * Writing the format directly removes all three. It is ~60 lines because ustar
 * is a simple format, and it takes no dependency into a published package.
 *
 * Determinism comes from: entries sorted by path, mtime 0, uid/gid 0, fixed
 * mode, and `gzip` with its own mtime zeroed.
 */
import { gzipSync, constants } from 'zlib'

const BLOCK = 512

function octal(value, width) {
  return value.toString(8).padStart(width - 1, '0') + '\0'
}

function header(path, size) {
  const buf = Buffer.alloc(BLOCK)
  // ustar's name field is 100 bytes. Long paths are representable via `prefix`,
  // but this corpus has none — so refuse loudly rather than emit a truncated
  // name that would extract to the wrong place.
  if (Buffer.byteLength(path) > 100) {
    throw new Error(`tar: path exceeds 100 bytes and prefix splitting is not implemented: ${path}`)
  }
  buf.write(path, 0, 100, 'utf8')
  buf.write(octal(0o644, 8), 100, 8)   // mode
  buf.write(octal(0, 8), 108, 8)       // uid  — zeroed for determinism
  buf.write(octal(0, 8), 116, 8)       // gid  — zeroed for determinism
  buf.write(octal(size, 12), 124, 12)
  buf.write(octal(0, 12), 136, 12)     // mtime — zeroed for determinism
  buf.write('        ', 148, 8)        // checksum field is spaces while summing
  buf.write('0', 156, 1)               // typeflag: regular file
  buf.write('ustar\0', 257, 6)
  buf.write('00', 263, 2)

  let sum = 0
  for (const byte of buf) sum += byte
  buf.write(octal(sum, 7) + ' ', 148, 8)
  return buf
}

/**
 * Build a gzipped tar from an explicit, ordered list of entries.
 *
 * @param {Array<{path: string, data: Buffer}>} entries
 * @returns {Buffer} the .tar.gz
 */
export function tarGz(entries) {
  const chunks = []
  for (const { path, data } of [...entries].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    chunks.push(header(path, data.length), data)
    const remainder = data.length % BLOCK
    if (remainder) chunks.push(Buffer.alloc(BLOCK - remainder))
  }
  chunks.push(Buffer.alloc(BLOCK * 2)) // two zero blocks terminate the archive
  // `mtime: 0` keeps gzip's own header timestamp out of the digest.
  return gzipSync(Buffer.concat(chunks), { level: constants.Z_BEST_COMPRESSION, mtime: 0 })
}
