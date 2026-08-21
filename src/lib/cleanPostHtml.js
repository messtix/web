const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Content pasted from Word (or similar) often carries literal <br> tags
 * at each original line-wrap position. Once rendered in a narrower
 * column those breaks land in the middle of words, cutting them in
 * half. A <br> that sits directly between two word characters (no
 * space, no punctuation) is almost certainly one of these paste
 * artifacts rather than an intentional line break, so it's replaced
 * with a single space.
 *
 * The adjacent content is frequently wrapped in an inline element
 * (e.g. a <span style="color:..."> from the rich text editor's color
 * or font-size formatting), not a bare text node, so this reads
 * textContent on whatever sibling is there rather than requiring a
 * literal Text node.
 */
export default function cleanPostHtml(html) {
  if (!html) return html;
  if (typeof window === 'undefined' || !window.DOMParser) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
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
