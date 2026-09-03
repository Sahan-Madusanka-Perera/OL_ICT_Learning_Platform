"""SVG primitives for model-question figures.

Everything here draws in the product's two values: black strokes on white, no
fills that are not white, no colour, no gradients. Figures are SVG rather than
PNG because they are authored rather than recovered — a logic circuit we drew
ourselves has no reason to be a raster, and vector costs a fraction of the bytes
on a phone.

Coordinates are in user units and every figure declares its own viewBox, so the
browser scales them to whatever the question card gives them.
"""

STROKE = 2
FONT = "'Source Sans 3', ui-sans-serif, system-ui, sans-serif"


def svg(width, height, body, title):
    """Wrap body in a root element.

    The `<title>` is what a screen reader reads if the alt text is somehow lost;
    the real description travels as the asset's alt text.
    """
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" role="img" '
        f'fill="none" stroke="#000" stroke-width="{STROKE}" '
        f'stroke-linecap="square" stroke-linejoin="miter">'
        f'<title>{esc(title)}</title>'
        f'<rect width="{width}" height="{height}" fill="#fff" stroke="none"/>'
        f'{body}</svg>'
    )


def esc(t):
    return (str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def text(x, y, s, size=15, anchor='middle', weight='400', mono=False):
    family = "ui-monospace, 'Courier New', monospace" if mono else FONT
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
        f'font-weight="{weight}" text-anchor="{anchor}" fill="#000" stroke="none">'
        f'{esc(s)}</text>'
    )


def line(x1, y1, x2, y2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'


def polyline(pts):
    p = ' '.join(f'{x},{y}' for x, y in pts)
    return f'<polyline points="{p}"/>'


def rect(x, y, w, h, fill='#fff'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'


def circle(cx, cy, r, fill='#fff'):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>'


def dot(cx, cy, r=4):
    """A junction dot. Filled, because a wire crossing is not a wire joining."""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#000" stroke="none"/>'


def arrow(x1, y1, x2, y2, head=8):
    """A straight arrow. Only horizontal and vertical are used in these figures."""
    body = line(x1, y1, x2, y2)
    if y1 == y2:
        d = head if x2 > x1 else -head
        tip = f'<path d="M{x2},{y2} L{x2 - d},{y2 - head / 2} L{x2 - d},{y2 + head / 2} Z" fill="#000"/>'
    else:
        d = head if y2 > y1 else -head
        tip = f'<path d="M{x2},{y2} L{x2 - head / 2},{y2 - d} L{x2 + head / 2},{y2 - d} Z" fill="#000"/>'
    return body + tip


# ---- logic gates -----------------------------------------------------------
# Every gate is drawn in a 30-unit-tall box with its inputs on the left edge at
# 1/3 and 2/3 height, and its output on the right at mid-height. `pins` returns
# those points so wiring never has to know a gate's internal shape.

# 44 rather than a tighter box because the two inputs sit at 1/3 and 2/3 height:
# at 30 they are 10 units apart, and a 2-unit stroke plus a 15px label makes the
# A and B wires read as one thick line.
GATE_H = 44
AND_W, OR_W, NOT_W = 46, 50, 38
BUBBLE_R = 5


def gate(kind, x, y, label=None):
    """Draw a gate with its top-left at (x, y). Returns SVG."""
    k = kind.upper()
    out = ''
    if k in ('AND', 'NAND'):
        out += (f'<path d="M{x},{y} L{x + 24},{y} '
                f'A{GATE_H / 2},{GATE_H / 2} 0 0 1 {x + 24},{y + GATE_H} '
                f'L{x},{y + GATE_H} Z" fill="#fff"/>')
    elif k in ('OR', 'NOR', 'XOR'):
        if k == 'XOR':
            out += (f'<path d="M{x - 9},{y} q 15,{GATE_H / 2} 0,{GATE_H}" fill="none"/>')
        out += (f'<path d="M{x},{y} q 15,{GATE_H / 2} 0,{GATE_H} '
                f'q 30,0 {OR_W},-{GATE_H / 2} '
                f'q -20,-{GATE_H / 2} -{OR_W},-{GATE_H / 2} z" fill="#fff"/>')
    elif k == 'NOT':
        out += (f'<path d="M{x},{y} L{x + NOT_W - 6},{y + GATE_H / 2} '
                f'L{x},{y + GATE_H} Z" fill="#fff"/>')
    else:
        raise ValueError(f'unknown gate {kind}')

    if k in ('NAND', 'NOR') or k == 'NOT':
        bx = pins(kind, x, y)['out'][0] - BUBBLE_R
        out += circle(bx, y + GATE_H / 2, BUBBLE_R)

    if label:
        cx = x + (AND_W if k in ('AND', 'NAND') else OR_W if k in ('OR', 'NOR', 'XOR') else NOT_W) / 2
        out += text(cx - 4, y + GATE_H / 2 + 5, label, size=13)
    return out


def pins(kind, x, y):
    """Input and output attachment points for a gate at (x, y)."""
    k = kind.upper()
    if k in ('AND', 'NAND'):
        w = AND_W
    elif k in ('OR', 'NOR', 'XOR'):
        w = OR_W
    else:
        w = NOT_W
    end = x + w + (BUBBLE_R * 2 if k in ('NAND', 'NOR', 'NOT') else 0)
    if k == 'NOT':
        return {'a': (x, y + GATE_H / 2), 'out': (end, y + GATE_H / 2)}
    return {
        'a': (x, y + GATE_H / 3),
        'b': (x, y + GATE_H * 2 / 3),
        'out': (end, y + GATE_H / 2),
    }


def wire(pts):
    """An orthogonal wire through a list of points."""
    return polyline(pts)


# ---- flowchart -------------------------------------------------------------

def terminator(cx, cy, w, h, label):
    r = h / 2
    return (f'<rect x="{cx - w / 2}" y="{cy - h / 2}" width="{w}" height="{h}" '
            f'rx="{r}" ry="{r}" fill="#fff"/>' + text(cx, cy + 5, label))


def process(cx, cy, w, h, label):
    body = rect(cx - w / 2, cy - h / 2, w, h)
    return body + _label_lines(cx, cy, label)


def io(cx, cy, w, h, label):
    s = h * 0.45
    pts = [(cx - w / 2 + s, cy - h / 2), (cx + w / 2, cy - h / 2),
           (cx + w / 2 - s, cy + h / 2), (cx - w / 2, cy + h / 2)]
    p = ' '.join(f'{a},{b}' for a, b in pts)
    return f'<polygon points="{p}" fill="#fff"/>' + text(cx, cy + 5, label)


def decision(cx, cy, w, h, label):
    pts = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
    p = ' '.join(f'{a},{b}' for a, b in pts)
    return f'<polygon points="{p}" fill="#fff"/>' + _label_lines(cx, cy, label)


def _label_lines(cx, cy, label):
    lines = label.split('\n')
    start = cy + 5 - (len(lines) - 1) * 9
    return ''.join(text(cx, start + i * 18, ln) for i, ln in enumerate(lines))


# ---- tabular ---------------------------------------------------------------

def table(x, y, cols, rows, col_w=None, row_h=26, header=True, mono=False):
    """A bordered table. `rows` is a list of lists of cell strings."""
    widths = col_w or [110] * len(cols)
    out = ''
    cy = y
    all_rows = ([cols] + rows) if header else rows
    for r, row in enumerate(all_rows):
        cx = x
        for c, cell in enumerate(row):
            w = widths[c]
            out += rect(cx, cy, w, row_h)
            weight = '600' if (header and r == 0) else '400'
            out += text(cx + w / 2, cy + row_h / 2 + 5, cell, size=14,
                        weight=weight, mono=mono)
            cx += w
        cy += row_h
    return out


def spreadsheet(x, y, headers, rows, col_w=None, row_h=26):
    """A worksheet segment: lettered columns, numbered rows, grey-free."""
    widths = col_w or [90] * len(headers)
    gut = 34
    out = rect(x, y, gut, row_h)
    cx = x + gut
    for c, h in enumerate(headers):
        out += rect(cx, y, widths[c], row_h)
        out += text(cx + widths[c] / 2, y + row_h / 2 + 5, h, size=14, weight='600')
        cx += widths[c]
    cy = y + row_h
    for i, row in enumerate(rows):
        out += rect(x, cy, gut, row_h)
        out += text(x + gut / 2, cy + row_h / 2 + 5, str(i + 1), size=14, weight='600')
        cx = x + gut
        for c, cell in enumerate(row):
            out += rect(cx, cy, widths[c], row_h)
            anchor = 'end' if _numeric(cell) else 'start'
            tx = cx + widths[c] - 8 if anchor == 'end' else cx + 8
            out += text(tx, cy + row_h / 2 + 5, cell, size=14, anchor=anchor)
            cx += widths[c]
        cy += row_h
    return out


def _numeric(s):
    try:
        float(str(s).replace(',', ''))
        return True
    except ValueError:
        return False
