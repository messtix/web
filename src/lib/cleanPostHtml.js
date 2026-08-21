const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Content pasted from Word (or similar) often carries literal <br> tags
 * at each original line-wrap position. Once rendered in a narrower
 * column those breaks land in the middle of words, cutting them in
 * half. A <br> that sits directly between two word characters (no
 * space, no punctuation) is almost certainly one of these paste
 * artifacts rather than an intentional line break, so it's replaced
 * with a single space.
 */
export default function cleanPostHtml(html) {
  if (!html) return html;
  if (typeof window === 'undefined' || !window.DOMParser) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const breaks = doc.body.querySelectorAll('br');

  breaks.forEach((br) => {
    const prevChar = br.previousSibling?.nodeType === 3
      ? br.previousSibling.textContent.slice(-1)
      : '';
    const nextChar = br.nextSibling?.nodeType === 3
      ? br.nextSibling.textContent.slice(0, 1)
      : '';

    if (WORD_CHAR.test(prevChar) && WORD_CHAR.test(nextChar)) {
      br.replaceWith(doc.createTextNode(' '));
    }
  });

  return doc.body.innerHTML;
}
