import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

// Must mirror the editor's markdown dialect (marked, GFM) so the stored HTML
// matches what the editor previews.
export function renderDescriptionHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false, gfm: true })

  return sanitizeHtml(html, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'strong',
      'em',
      'del',
      's',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  })
}
