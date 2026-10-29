/**
 * A deliberately tiny inline markdown renderer.
 *
 * Question content is authored by staff and passes review, but it is still
 * *content* — so it is escaped first and only then given a fixed, closed set
 * of inline formats. There is no path here for arbitrary HTML, which is why
 * a full markdown library (and its plugin surface) is not worth the risk or
 * the bytes on a slow connection.
 *
 * Supported: **bold**, *italic*, `code`, and paragraph breaks.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

export function renderInline(input: string): string {
  const escaped = escapeHtml(input);

  // Code spans are lifted out before emphasis and put back after it, so an
  // asterisk inside one — `=(B2 * G$1/100) + (C2 * G$2/100)` — is never read
  // as the start of an italic run. Bold can still wrap a span: **`<a>`**.
  const code: string[] = [];
  const formatted = escaped
    .replace(/`([^`]+)`/g, (_, span: string) => `\u0000${code.push(span) - 1}\u0000`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, i: string) => `<code>${code[Number(i)]}</code>`);

  // Blank line = paragraph, single newline = line break.
  return formatted
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('');
}
