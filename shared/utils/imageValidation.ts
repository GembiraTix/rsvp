/**
 * Checks if a buffer / Uint8Array contains valid image magic bytes (JPEG, PNG, GIF, WEBP).
 */
export function isValidImageBuffer(buffer: Uint8Array | ArrayBuffer): boolean {
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  if (arr.length < 4) return false

  const headerHex = Array.from(arr.subarray(0, 12))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const isJpeg = headerHex.startsWith('ffd8ff')
  const isPng = headerHex.startsWith('89504e47')
  const isGif = headerHex.startsWith('47494638') // GIF87a or GIF89a
  const isWebp =
    headerHex.startsWith('52494646') &&
    headerHex.substring(16, 24) === '57454250' // RIFF...WEBP

  return isJpeg || isPng || isGif || isWebp
}
