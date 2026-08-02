import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(str: string): string {
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}