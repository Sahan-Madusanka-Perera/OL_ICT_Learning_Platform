"""Parse OCR'd O/L ICT Paper I text into structured MCQs.

Runs over one OCR pass at a time. `ocr_all.py` writes two — a primary psm 6
pass and an alternate psm 4 pass that keeps column structure — and this is
pointed at whichever one is wanted:

    python3 parse.py              # -> .extract/parsed.json       (psm 6)
    python3 parse.py --psm4       # -> .extract/parsed.psm4.json  (psm 4)

`repair.py` then merges the second into the first, which is where the missing
questions actually come back. Nothing here knows about that merge; this file's
only job is to turn one pass into blocks as faithfully as it can.
"""
import re, json, glob, os, sys

OUT = os.environ.get('WORKDIR', os.path.join(
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), '.extract'))

# OCR confusions that matter for option markers and numbering
def clean(t):
    t=t.replace('‘',"'").replace('’',"'").replace('“','"').replace('”','"')
    t=re.sub(r'[ \t]+',' ',t)
    # (l) (I) -> (1);  (O) -> (0) is risky, skip
    t=re.sub(r'\((?:l|I|i|\||!)\)', '(1)', t)
    t=re.sub(r'\((?:O)\)', '(0)', t)
    return t

# page furniture to drop
JUNK=re.compile(
 r'^(NATIVE_CHARS|<<<PAGE|\[?see page|\[See page|80 ?- ?In|80 - Info|Department of Examinations'
 r'|All Rights Reserved|G\.C\.E\.|General Certificate|Information & Communication|Information and Communication'
 r'|Confidential|www\.|Scanned with|Downloaded From|PAST PAPERS|Past Papers|\d+\s*$)', re.I)

OPT=re.compile(r'\((\d)\)')

def strip_junk(lines):
    out=[]
    for ln in lines:
        s=ln.strip()
        if not s: continue
        if JUNK.match(s): continue
        if len(s)<=2 and not re.match(r'^\d',s): continue
        out.append(s)
    return out

QNUM=re.compile(r'^[^\w(]{0,3}(\d{1,2})\s*[\.,\):;]\s*(.*)$')

def _damaged(n, expected):
    """OCR-damaged two-digit question number: 18->8, 23->93, 30->3O."""
    se, sn = str(expected), str(n)
    if len(se) != 2: return False
    if sn == se[1]: return True                       # leading digit lost
    return len(sn) == len(se) and sum(x != y for x, y in zip(se, sn)) == 1

# Where Paper I stops and Paper II begins.
#
# These files are `E-I,II`: both papers bound into one PDF. Without a cutoff the
# fortieth question's last option runs to the end of the document — the 2011
# paper produced a 5,000-character option 4 containing the whole of Paper II,
# its flowcharts, its worksheets and the scanner operator's watermark. The
# instruction block between the two papers is the reliable seam; it is printed
# on every year and it never appears inside Paper I.
PAPER_TWO = re.compile(
    r'Answer\s+five\s+questions\s+only'
    r'|First\s+question\s+carries\s+20\s+marks'
    r'|each\s+of\s+the\s+other\s+questions\s+carries\s+10\s+marks',
    re.I,
)


def cut_paper_two(lines):
    """Drop everything from the Paper II instructions onward."""
    for i, line in enumerate(lines):
        if PAPER_TWO.search(line):
            return lines[:i]
    return lines


def parse(text):
    lines = cut_paper_two(strip_junk(clean(text).split('\n')))
    cand = [(i, int(m.group(1)), m.group(2))
            for i, ln in enumerate(lines) if (m := QNUM.match(ln))]

    # Pass 1 — strict forward scan. Only ever moves ahead, so it cannot be
    # derailed by a stray "(3)" or a number inside an option.
    starts, last, pos = {}, 0, -1
    for i, n, rest in cand:
        if i > pos and last < n <= min(last + 3, 40):
            starts[n] = (i, rest); last = n; pos = i

    # Pass 2 — fill gaps left by a mangled number, searching only the window
    # between the neighbours that pass 1 already anchored.
    for q in range(1, 41):
        if q in starts: continue
        lo = max((starts[p][0] for p in range(q - 1, 0, -1) if p in starts), default=-1)
        hi = min((starts[nx][0] for nx in range(q + 1, 41) if nx in starts), default=len(lines))
        for i, n, rest in cand:
            if lo < i < hi and _damaged(n, q):
                starts[q] = (i, rest); break

    blocks = {}
    ordered = sorted(starts.items(), key=lambda kv: kv[1][0])
    for j, (q, (i, rest)) in enumerate(ordered):
        end = ordered[j + 1][1][0] if j + 1 < len(ordered) else len(lines)
        blocks[q] = '\n'.join([rest] + lines[i + 1:end])
    return blocks

# Option markers: "(1)" normally, but scans lose the opening paren ("1)")
# or the closing one. Require a word boundary before so "D2)" is not a marker.
OPTM = re.compile(r'(?<![\w$])\(?([1-4])\)')

def split_opts(body):
    """Return (stem, [o1..o4]) or (stem, None) when 4 ordered markers are absent."""
    seq, want = [], 1
    for m in OPTM.finditer(body):
        if int(m.group(1)) == want:
            seq.append((m.start(), m.end())); want += 1
            if want > 4: break
    if len(seq) != 4: return body.strip(), None

    stem = body[:seq[0][0]]
    opts = []
    for i in range(4):
        s = seq[i][1]
        e = seq[i + 1][0] if i < 3 else len(body)
        opts.append(body[s:e])
    return _tidy(stem), [_tidy(o) for o in opts]

# Runs of scan speckle: long tokens with no vowel, stray bracket soup.
SPECKLE = re.compile(r'\s*[|\\/_~^"\'`]{2,}\s*|\s*\[[^\]]{0,3}\]\s*')

def _tidy(t):
    t = SPECKLE.sub(' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t.strip(' .,;:|_-')

DIAGRAM=re.compile(r'\b(figure|flowchart|logic circuit|circuit|diagram|shown below|given below|following table|'
                   r'spreadsheet segment|truth table|image|icon|toolbar|screenshot|the right|below\.)\b', re.I)

def run(suffix=''):
    res={}
    # An explicit pattern per pass. A bare `paper*.txt` glob also matches
    # `paper2010.psm4.txt`, which would quietly parse every paper twice and let
    # whichever sorted last win.
    pattern = f'{OUT}/txt/paper????{suffix}.txt'
    for f in sorted(glob.glob(pattern)):
        yr=re.search(r'paper(\d{4})',f).group(1)
        blocks=parse(open(f).read())
        qs={}
        for n,body in blocks.items():
            stem,opts=split_opts(body)
            qs[n]={'stem':re.sub(r'\s+',' ',stem).strip(),
                   'options':opts,
                   'needs_asset':bool(DIAGRAM.search(body)),
                   'raw':body}
        res[yr]=qs
        full=sum(1 for q in qs.values() if q['options'])
        print(f'{yr}: {len(qs)}/40 blocks, {full} with 4 clean options')
    dest = f'{OUT}/parsed{suffix}.json'
    json.dump(res,open(dest,'w'),indent=1)
    print(f'-> {dest}')

if __name__=='__main__':
    run('.psm4' if '--psm4' in sys.argv else '')
