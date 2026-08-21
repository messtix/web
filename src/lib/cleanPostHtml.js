const WORD_CHAR = /[\p{L}\p{N}]/u;
const NBSP_RE = new RegExp(' ', 'g');
const NBSP_ENTITY_RE = /&nbsp;/gi;

/**
 * Content pasted from Word (or similar) can carry two kinds of paste
 * artifacts that break normal line-wrapping:
 *
 * 1. Non-breaking spaces (&nbsp; / U+00A0) used in place of regular
 *    spaces between words. A non-breaking space blocks the browser
 *    from wrapping the line there, so a whole run of nbsp-joined
 *    words becomes one "unbreakable" token from the line-breaking
 *    algorithm's point of view — forcing the browser to cut it
 *    wherever it physically runs out of room, mid-word, regardless
 *    of word length. This is the common case and is fixed by simply
 *    turning those back into regular spaces.
 *
 * 2. Literal <br> tags at each original line-wrap position, which
 *    can also land mid-word once rendered in a narrower column.
 */
export default function cleanPostHtml(html) {
  if (!html) return html;
  if (typeof window === 'undefined' || !window.DOMParser) return html;

  const normalized = html.replace(NBSP_RE, ' ').replace(NBSP_ENTITY_RE, ' ');

  const doc = new DOMParser().parseFromString(normalized, 'text/html');
  const breaks = doc.body.querySelectorAll('br');

  breaks.forEach((br) => {
    const prevText = br.previousSibling?.textContent || '';
    const nextText = br.nextSibling?.textContent || '';
    const prevChar = prevText.slice(-1);
    const nextChar = nextText.slice(0, 1);

    if (WORD_CHAR.test(prevChar) && WORD_CHAR.test(nextChar)) {
      br.replaceWith(doc.createTextNode(' '));
    }
  });

  return doc.body.innerHTML;
}
