import { describe, it, expect } from 'vitest';
import { escapeHtml, renderInline } from './markdown';

describe('inline markdown renderer', () => {
  it('escapes HTML before doing anything else', () => {
    const out = renderInline('<script>alert("x")</script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('escapes attributes that could break out of a tag', () => {
    expect(escapeHtml(`" onerror="alert(1)`)).toBe('&quot; onerror=&quot;alert(1)');
  });

  it('renders bold, italic and code', () => {
    expect(renderInline('**bold**')).toContain('<strong>bold</strong>');
    expect(renderInline('*soft*')).toContain('<em>soft</em>');
    expect(renderInline('`=SUM(A1:A5)`')).toContain('<code>=SUM(A1:A5)</code>');
  });

  it('does not treat asterisks inside code as emphasis', () => {
    const out = renderInline('`a ** b`');
    expect(out).toContain('<code>a ** b</code>');
    expect(out).not.toContain('<strong>');
  });

  it('keeps multiplication in spreadsheet formulas intact', () => {
    // =B2*$C$1 must not become italics.
    const out = renderInline('`=B2*$C$1`');
    expect(out).toContain('=B2*$C$1');
    expect(out).not.toContain('<em>');
  });

  it('never lets an italic run start inside one code span and end in another', () => {
    // Two multiplications on one line used to italicise everything between them.
    const out = renderInline('`= (B2 * G$1/100) + (C2 * G$2/100)`');
    expect(out).toBe('<p><code>= (B2 * G$1/100) + (C2 * G$2/100)</code></p>');
    const split = renderInline('`A2*A3` first, then `=(A1-A2)*A3`');
    expect(split).not.toContain('<em>');
  });

  it('still lets bold wrap a code span', () => {
    expect(renderInline('The **`<body>`** holds the page')).toContain(
      '<strong><code>&lt;body&gt;</code></strong>',
    );
  });

  it('turns blank lines into paragraphs and single newlines into breaks', () => {
    const out = renderInline('One\n\nTwo\nThree');
    expect(out).toBe('<p>One</p><p>Two<br />Three</p>');
  });

  it('preserves subscripted number-system notation', () => {
    expect(renderInline('Convert 216₁₀ to octal')).toContain('216₁₀');
  });

  it('never emits a raw angle bracket from user content', () => {
    const nasty = '<img src=x onerror=alert(1)> **and** <b>bold</b>';
    const out = renderInline(nasty);
    expect(out).not.toMatch(/<(img|b)\b/);
    expect(out).toContain('<strong>and</strong>');
  });
});
