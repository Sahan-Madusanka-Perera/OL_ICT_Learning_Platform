"""Draw the figures the model questions refer to.

These are authored, not recovered. That difference matters more than it looks:
because we drew the circuit, we know what it shows, so every one of these ships
with real alt text rather than the "not yet described" placeholder the extracted
past-paper figures carry. A figure question is only answerable by a student
using a screen reader if the description is genuinely equivalent, so the alt
text here describes the *structure*, never the answer.

    python3 tools/model-figures/build.py

Writes SVGs to public/model-questions/ and a manifest to
src/lib/db/seed/data/model-figures.json.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from gates import (  # noqa: E402
    svg, text, line, rect, dot, arrow, gate, pins, wire,
    terminator, process, io, decision, table, spreadsheet,
    GATE_H,
)

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(REPO, 'public', 'model-questions')
MANIFEST = os.path.join(REPO, 'src', 'lib', 'db', 'seed', 'data')

FIGURES = {}


def figure(slug, alt, width, height, body, title=None):
    FIGURES[slug] = {
        'slug': slug,
        'alt': alt,
        'width': width,
        'height': height,
        'svg': svg(width, height, body, title or alt[:80]),
    }


# ---------------------------------------------------------------------------
# 4.1 — logic circuits
# ---------------------------------------------------------------------------

def _labelled_input(x, y, name):
    return text(x - 20, y + 5, name, size=15, anchor='middle', weight='600')


# A three-input circuit: (A AND B) OR (NOT C)
g1 = gate('AND', 120, 40)
p1 = pins('AND', 120, 40)
g2 = gate('NOT', 120, 130)
p2 = pins('NOT', 120, 130)
g3 = gate('OR', 250, 85)
p3 = pins('OR', 250, 85)
body = (
    g1 + g2 + g3
    + _labelled_input(60, p1['a'][1], 'A') + line(60, p1['a'][1], *p1['a'])
    + _labelled_input(60, p1['b'][1], 'B') + line(60, p1['b'][1], *p1['b'])
    + _labelled_input(60, p2['a'][1], 'C') + line(60, p2['a'][1], *p2['a'])
    + wire([p1['out'], (215, p1['out'][1]), (215, p3['a'][1]), p3['a']])
    + wire([p2['out'], (215, p2['out'][1]), (215, p3['b'][1]), p3['b']])
    + line(*p3['out'], 355, p3['out'][1])
    + text(372, p3['out'][1] + 5, 'Q', size=15, weight='600')
)
figure(
    'logic-and-or-not',
    'A logic circuit with three inputs A, B and C, and one output Q. '
    'A and B go into a two-input AND gate. C goes into a NOT gate. '
    'The output of the AND gate and the output of the NOT gate are the two '
    'inputs of a two-input OR gate, whose output is Q.',
    400, 190, body,
)

# A NAND fed by two inputs, output inverted again — used for "equivalent to"
g1 = gate('NAND', 130, 60)
p1 = pins('NAND', 130, 60)
g2 = gate('NOT', 250, 60)
p2 = pins('NOT', 250, 60)
body = (
    g1 + g2
    + _labelled_input(70, p1['a'][1], 'A') + line(70, p1['a'][1], *p1['a'])
    + _labelled_input(70, p1['b'][1], 'B') + line(70, p1['b'][1], *p1['b'])
    + line(*p1['out'], *p2['a'])
    + line(*p2['out'], 355, p2['out'][1])
    + text(372, p2['out'][1] + 5, 'Q', size=15, weight='600')
)
figure(
    'logic-nand-not',
    'A logic circuit with two inputs A and B and one output Q. A and B are the '
    'inputs of a NAND gate. The output of that NAND gate is the single input of '
    'a NOT gate, and the output of the NOT gate is Q.',
    400, 150, body,
)

# Two-gate circuit for a truth-table reading question: (A OR B) AND NOT B
g1 = gate('OR', 130, 40)
p1 = pins('OR', 130, 40)
g2 = gate('NOT', 130, 130)
p2 = pins('NOT', 130, 130)
g3 = gate('AND', 260, 85)
p3 = pins('AND', 260, 85)
body = (
    g1 + g2 + g3
    + _labelled_input(60, p1['a'][1], 'A') + line(60, p1['a'][1], *p1['a'])
    + _labelled_input(60, p1['b'][1], 'B') + line(60, p1['b'][1], *p1['b'])
    + line(78, p1['b'][1], 78, p2['a'][1]) + line(78, p2['a'][1], *p2['a'])
    + dot(78, p1['b'][1])
    + wire([p1['out'], (228, p1['out'][1]), (228, p3['a'][1]), p3['a']])
    + wire([p2['out'], (228, p2['out'][1]), (228, p3['b'][1]), p3['b']])
    + line(*p3['out'], 360, p3['out'][1])
    + text(377, p3['out'][1] + 5, 'Q', size=15, weight='600')
)
figure(
    'logic-or-and-notb',
    'A logic circuit with two inputs A and B and one output Q. A and B are the '
    'inputs of an OR gate. B also branches to the input of a NOT gate. The OR '
    'gate output and the NOT gate output are the two inputs of an AND gate, '
    'whose output is Q.',
    410, 190, body,
)

# ---------------------------------------------------------------------------
# 10.3 — flowcharts
# ---------------------------------------------------------------------------

CX = 190
body = (
    terminator(CX, 30, 110, 40, 'Start')
    + arrow(CX, 50, CX, 78)
    + io(CX, 102, 160, 44, 'Input N')
    + arrow(CX, 124, CX, 152)
    + process(CX, 178, 160, 52, 'S = 0\nI = 1')
    + arrow(CX, 204, CX, 240)
    + decision(CX, 282, 190, 80, 'Is I > N ?')
    + text(CX + 14, 340, 'Yes', size=14, anchor='start')
    + arrow(CX, 322, CX, 356)
    + io(CX, 382, 160, 44, 'Output S')
    + arrow(CX, 404, CX, 430)
    + terminator(CX, 452, 110, 40, 'End')
    + line(CX + 95, 282, 350, 282) + text(320, 272, 'No', size=14)
    + line(350, 282, 350, 205)
    + process(350, 178, 130, 52, 'S = S + I\nI = I + 1')
    + line(350, 152, 350, 120)
    + arrow(350, 120, CX, 120)
)
figure(
    'flowchart-sum-to-n',
    'A flowchart. Start, then Input N, then a process box setting S to 0 and I '
    'to 1. A decision box asks "Is I > N?". On No, a process box sets S to S + I '
    'and I to I + 1, and the flow returns to just below Input N. On Yes, the '
    'flow goes to Output S and then End.',
    470, 490, body,
)

# ---------------------------------------------------------------------------
# 2.5 — network topologies
# ---------------------------------------------------------------------------

def node(cx, cy, label):
    return rect(cx - 32, cy - 16, 64, 32) + text(cx, cy + 5, label, size=13)


# Star
hub = (200, 150)
pcs = [(60, 60), (340, 60), (60, 240), (340, 240), (200, 275)]
body = ''.join(line(*hub, *p) for p in pcs)
body += ''.join(node(*p, f'PC{i + 1}') for i, p in enumerate(pcs))
body += rect(hub[0] - 40, hub[1] - 20, 80, 40) + text(*[hub[0], hub[1] + 5], 'Switch', size=13)
figure(
    'topology-star',
    'A network diagram. Five computers labelled PC1 to PC5 each connect by a '
    'single separate cable to one central switch. No computer connects directly '
    'to another.',
    400, 300, body,
)

# Bus
y = 150
body = line(40, y, 460, y)
for i, x in enumerate([90, 190, 290, 390]):
    body += line(x, y, x, y - 55) + node(x, y - 72, f'PC{i + 1}')
body += text(250, y + 30, 'backbone cable', size=14)
figure(
    'topology-bus',
    'A network diagram. One long horizontal cable runs across the diagram, '
    'labelled backbone cable. Four computers labelled PC1 to PC4 each drop a '
    'short vertical cable down onto that single shared cable.',
    500, 200, body,
)

# Ring
pts = [(250, 45), (400, 150), (340, 265), (160, 265), (100, 150)]
body = ''
for i in range(len(pts)):
    body += line(*pts[i], *pts[(i + 1) % len(pts)])
body += ''.join(node(*p, f'PC{i + 1}') for i, p in enumerate(pts))
figure(
    'topology-ring',
    'A network diagram. Five computers labelled PC1 to PC5 are arranged in a '
    'closed loop, each one cabled to exactly two neighbours, so the cabling '
    'forms a single unbroken ring with no central device.',
    500, 310, body,
)

# ---------------------------------------------------------------------------
# 7.x — spreadsheets
# ---------------------------------------------------------------------------

body = spreadsheet(20, 20, ['A', 'B', 'C', 'D'], [
    ['Item', 'Qty', 'Price', 'Total'],
    ['Pen', '12', '25', ''],
    ['Book', '5', '120', ''],
    ['Bag', '2', '850', ''],
], col_w=[120, 80, 90, 90])
figure(
    'sheet-qty-price',
    'A spreadsheet segment. Row 1 holds the headings Item, Qty, Price and Total '
    'in columns A to D. Row 2 is Pen, 12, 25. Row 3 is Book, 5, 120. Row 4 is '
    'Bag, 2, 850. Column D is empty in rows 2 to 4.',
    420, 156, body,
)

body = spreadsheet(20, 20, ['A', 'B', 'C'], [
    ['Rate', '15', ''],
    ['Hours', 'Pay', ''],
    ['8', '', ''],
    ['6', '', ''],
], col_w=[100, 100, 100])
figure(
    'sheet-absolute-rate',
    'A spreadsheet segment. Cell A1 contains Rate and cell B1 contains 15. '
    'Row 2 holds the headings Hours in A2 and Pay in B2. Cell A3 contains 8 and '
    'cell A4 contains 6. Column B is empty in rows 3 and 4.',
    340, 156, body,
)

# ---------------------------------------------------------------------------
# 9.4 — relational tables
# ---------------------------------------------------------------------------

body = (
    text(20, 30, 'STUDENT', size=15, anchor='start', weight='600')
    + table(20, 42, ['Student_ID', 'Name', 'Grade'],
            [['S001', 'Amali', '11'], ['S002', 'Kasun', '10'], ['S003', 'Nimal', '11']],
            col_w=[120, 110, 80])
    + text(20, 200, 'SUBJECT', size=15, anchor='start', weight='600')
    + table(20, 212, ['Subject_ID', 'Subject_name'],
            [['SU01', 'ICT'], ['SU02', 'Maths']], col_w=[120, 150])
    + text(400, 200, 'ENROLMENT', size=15, anchor='start', weight='600')
    + table(400, 212, ['Student_ID', 'Subject_ID', 'Marks'],
            [['S001', 'SU01', '78'], ['S002', 'SU02', '65'], ['S001', 'SU02', '81']],
            col_w=[120, 110, 80])
)
figure(
    'db-student-subject',
    'Three database tables. STUDENT has the fields Student_ID, Name and Grade, '
    'with rows S001 Amali 11, S002 Kasun 10, and S003 Nimal 11. SUBJECT has the '
    'fields Subject_ID and Subject_name, with rows SU01 ICT and SU02 Maths. '
    'ENROLMENT has the fields Student_ID, Subject_ID and Marks, with rows '
    'S001 SU01 78, S002 SU02 65, and S001 SU02 81.',
    720, 320, body,
)

# ---------------------------------------------------------------------------
# 4.1 — a truth table to be matched to a gate
# ---------------------------------------------------------------------------

body = table(20, 20, ['A', 'B', 'Q'],
             [['0', '0', '1'], ['0', '1', '1'], ['1', '0', '1'], ['1', '1', '0']],
             col_w=[70, 70, 70], row_h=30, mono=True)
figure(
    'truth-table-nand',
    'A truth table with columns A, B and Q. The rows are: A 0, B 0, Q 1; '
    'A 0, B 1, Q 1; A 1, B 0, Q 1; A 1, B 1, Q 0.',
    250, 180, body,
)

# ---------------------------------------------------------------------------
# 2.4 — block diagram of a computer
# ---------------------------------------------------------------------------

body = (
    rect(30, 120, 110, 60) + text(85, 155, 'Input', size=14)
    + rect(400, 120, 110, 60) + text(455, 155, 'Output', size=14)
    + rect(180, 40, 180, 90) + text(270, 62, 'CPU', size=14, weight='600')
    + rect(196, 74, 68, 44) + text(230, 100, 'A', size=14, weight='600')
    + rect(276, 74, 68, 44) + text(310, 100, 'B', size=14, weight='600')
    + rect(180, 190, 180, 56) + text(270, 222, 'C', size=14, weight='600')
    + arrow(140, 150, 178, 150)
    + arrow(362, 150, 398, 150)
    + arrow(270, 132, 270, 188)
)
figure(
    'block-diagram-cpu',
    'A block diagram of a computer. An Input block on the left has an arrow to '
    'a large CPU block in the middle. The CPU block contains two smaller boxes '
    'labelled A and B. An arrow runs from the CPU down to a block labelled C, '
    'and another arrow runs from the CPU right to an Output block.',
    540, 270, body,
)

# ---------------------------------------------------------------------------
# 3.3 — a place-value frame
# ---------------------------------------------------------------------------

body = (
    table(20, 20, ['2⁷', '2⁶', '2⁵', '2⁴', '2³', '2²', '2¹', '2⁰'],
          [['1', '0', '1', '1', '0', '1', '0', '1']],
          col_w=[62] * 8, row_h=32, mono=False)
)
figure(
    'place-value-8bit',
    'An eight-column place-value frame. The headings are the powers of two from '
    '2 to the 7 down to 2 to the 0. The single row of digits beneath them reads, '
    'from left to right, 1 0 1 1 0 1 0 1.',
    540, 110, body,
)


# ---------------------------------------------------------------------------

def run():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(MANIFEST, exist_ok=True)
    rows = []
    for slug, f in sorted(FIGURES.items()):
        path = os.path.join(OUT, f'{slug}.svg')
        with open(path, 'w') as fh:
            fh.write(f['svg'])
        rows.append({
            'slug': slug,
            'path': f'/model-questions/{slug}.svg',
            'alt': f['alt'],
            'width': f['width'],
            'height': f['height'],
            'byteSize': os.path.getsize(path),
        })
    with open(os.path.join(MANIFEST, 'model-figures.json'), 'w') as fh:
        json.dump(rows, fh, indent=1, ensure_ascii=False)
        fh.write('\n')
    total = sum(r['byteSize'] for r in rows)
    print(f'{len(rows)} figures, {total / 1024:.1f} KB total')
    for r in rows:
        print(f"  {r['slug']:24} {r['width']:4}x{r['height']:<4} {r['byteSize'] / 1024:5.1f} KB")


if __name__ == '__main__':
    run()
