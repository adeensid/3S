import sanitizeHtmlImport from 'sanitize-html';

type SanitizeFn = typeof import('sanitize-html');

function resolveSanitizeHtml(): SanitizeFn {
  if (typeof sanitizeHtmlImport === 'function') {
    return sanitizeHtmlImport as SanitizeFn;
  }
  const nested = sanitizeHtmlImport as { default?: SanitizeFn };
  if (typeof nested.default === 'function') {
    return nested.default;
  }
  throw new TypeError('sanitize-html export is not a function');
}

const allowedTags = [
  'p',
  'br',
  'strong',
  'em',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'a',
  'h1',
  'h2',
  'h3',
  'blockquote',
];

export function sanitizeMarkdownInput(input: string): string {
  const sanitizeHtml = resolveSanitizeHtml();
  const anchorTagTransform =
    typeof sanitizeHtml.simpleTransform === 'function'
      ? sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
      : undefined;

  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
    },
    ...(anchorTagTransform ? { transformTags: { a: anchorTagTransform } } : {}),
  });
}
