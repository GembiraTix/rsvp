/**
 * Reduces markdown to plain text, for contexts that can't render HTML
 * (card teasers, meta/og descriptions). Keeps content, drops syntax.
 * */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return ''

  return markdown
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
    .replace(/^[ \t]{0,3}([-*_])[ \t]*\1[ \t]*\1[-*_ \t]*$/gm, '')
    .replace(/^[ \t]{0,3}[-*+][ \t]+/gm, '')
    .replace(/^[ \t]{0,3}\d+[.)][ \t]+/gm, '')
    .replace(/\*{1,3}/g, '')
    .replace(/~~/g, '')
    .replace(/(?<![\w\\])_{1,3}(?=\S)([^_]*\S)_{1,3}(?![\w])/g, '$1')
    .replace(/`+/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
