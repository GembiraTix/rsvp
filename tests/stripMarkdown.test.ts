import { describe, expect, it } from 'vitest'
import { stripMarkdown } from '../shared/utils/stripMarkdown'

describe('stripMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(stripMarkdown('')).toBe('')
  })

  it('keeps plain text untouched', () => {
    expect(stripMarkdown('Acara komunitas tahunan')).toBe(
      'Acara komunitas tahunan',
    )
  })

  it('strips emphasis markers', () => {
    expect(stripMarkdown('**tebal** dan *miring* dan ~~dicoret~~')).toBe(
      'tebal dan miring dan dicoret',
    )
  })

  it('strips paired underscore emphasis but keeps word underscores', () => {
    expect(stripMarkdown('_miring_ dan snake_case_word')).toBe(
      'miring dan snake_case_word',
    )
  })

  it('keeps link labels and image alt text', () => {
    expect(stripMarkdown('Daftar di [sini](https://example.com) ya')).toBe(
      'Daftar di sini ya',
    )
    expect(stripMarkdown('![](https://example.com/a.png)')).toBe('')
    expect(stripMarkdown('![logo](https://example.com/a.png)')).toBe('logo')
  })

  it('strips heading markers', () => {
    expect(stripMarkdown('## Tentang Acara\n\nIsi deskripsi')).toBe(
      'Tentang Acara\nIsi deskripsi',
    )
  })

  it('strips list markers', () => {
    expect(stripMarkdown('- poin satu\n- poin dua\n1. nomor satu')).toBe(
      'poin satu\npoin dua\nnomor satu',
    )
  })

  it('strips blockquote markers and horizontal rules', () => {
    expect(stripMarkdown('> kutipan\n\n---\n\nlanjutan')).toBe(
      'kutipan\nlanjutan',
    )
  })

  it('keeps fenced code content but drops markers and backticks', () => {
    expect(stripMarkdown('```js\nconsole.log(`hi`)\n```')).toBe(
      'console.log(hi)',
    )
  })

  it('strips raw html tags', () => {
    expect(stripMarkdown('halo <script>alert(1)</script> dunia')).toBe(
      'halo alert(1) dunia',
    )
  })

  it('collapses consecutive blank lines', () => {
    expect(stripMarkdown('a\n\n\n\nb')).toBe('a\nb')
  })
})
