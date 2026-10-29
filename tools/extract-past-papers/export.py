"""Emit the past-paper MCQ dataset: text, quality flags, official answer keys."""
import json, re, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('WORKDIR', os.path.join(
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), '.extract'))

parsed = json.load(open(f'{OUT}/parsed.json'))
# Read from the tool directory, not the work directory: these were read by eye
# from the scanned grids and are the source the TypeScript keys were typed from.
keys   = json.load(open(os.path.join(os.path.dirname(__file__), 'answer-keys.json')))

# ---- topic classification -------------------------------------------------
# The table itself lives in ./topics.py, because the born-digital extractor
# needs the same classifier and cannot import this file (it reads
# .extract/parsed.json at module scope).
from topics import topic_of  # noqa: E402

# ---- quality flags --------------------------------------------------------
# Subscript/superscript damage. O/L ICT number-system items are written
# 1000011(2), 2B(16), 2^10 -- OCR turns the sub/superscript into a comma,
# an apostrophe or nothing at all, which silently changes the value.
SUBSUP = re.compile(r"""
      \b2\s*['"!|]+                 # 2'' MB   (2^10 / 2^11)
    | \b\d+\s*['"!|]{1,}\s*(?:MB|KB|GB|TB)\b
    | \b[01]{4,}\s*[,.']            # 1000011,  (binary subscript eaten)
    | \b[0-9A-F]{1,4}\s*,,          # 2B,,      (hex subscript eaten)
""", re.X)
NUMSYS = re.compile(r'\b(binary|octal|hexadecimal|decimal|ASCII)\b', re.I)
GARB   = re.compile(r'[^\x00-\x7F]|[|\\~^]|\b[bcdfghjklmnpqrstvwxz]{4,}\b', re.I)

# An option set that is near-identical across choices (Book / Books / Book /
# Books) only distinguishes anything when the accompanying table is present.
def _opts_need_context(opts):
    norm = [re.sub(r'[^a-z0-9]', '', o.lower()) for o in opts]
    if len(set(norm)) < 4: return True                       # duplicates
    if all(len(o) <= 12 for o in opts):
        stems = {o[:4] for o in norm if o}
        if len(stems) <= 2: return True                      # same word family
    return False

CELLREF = re.compile(r'\b[A-Z]{1,2}\$?\d{1,3}\b|\$[A-Z]')

def quality(q):
    if not q['options']:                       return 'incomplete'
    body = q['raw']
    opts = q['options']
    if q['needs_asset']:                       return 'needs_asset'
    if _opts_need_context(opts):               return 'needs_asset'
    # A formula or cell reference in the options means a worksheet is implied.
    if sum(bool(CELLREF.search(o)) for o in opts) >= 2:      return 'needs_asset'
    if SUBSUP.search(body):                    return 'needs_repair'
    if NUMSYS.search(body) and re.search(r"\d\s*['\"!|]", body):
        return 'needs_repair'
    if GARB.search(' '.join(opts)) or GARB.search(q['stem']):
        return 'needs_repair'
    if len(q['stem']) < 25 or any(len(o) < 1 for o in opts):
        return 'needs_repair'
    return 'clean'

# ---- emit -----------------------------------------------------------------
rows = []
for year in sorted(parsed):
    key = keys.get(year)
    for n in sorted(parsed[year], key=int):
        q = parsed[year][n]
        ans = key[int(n) - 1] if key else None
        rows.append({
            'year': int(year),
            'questionNumber': int(n),
            'stem': q['stem'],
            'options': q['options'],
            'topic': topic_of(f"{q['stem']} {' '.join(q['options'] or [])}"),
            'extraction': quality(q),
            # Which OCR pass this text came from. Blank for the primary pass;
            # 'psm4' for a question only the alternate segmentation could read,
            # which a reviewer should treat as the weaker of the two.
            'pass': q.get('repaired_from'),
            'answerKey': ans,
            'keySource': f'marking-scheme-{year}' if ans else None,
        })

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEST = os.path.join(REPO, 'src', 'lib', 'db', 'seed', 'data')
os.makedirs(DEST, exist_ok=True)

# The answer keys live in answer-keys.ts, which is hand-verified against the
# scanned grids. This file deliberately does NOT duplicate them -- the loader
# joins on year + question number instead, so the two cannot drift apart.
slim = [{'year': r['year'], 'q': r['questionNumber'], 'topic': r['topic'],
         'extraction': r['extraction'], 'stem': r['stem'], 'options': r['options'],
         **({'pass': r['pass']} if r['pass'] else {})}
        for r in rows]
slim.sort(key=lambda r: (r['year'], r['q']))
with open(os.path.join(DEST, 'past-paper-mcqs.json'), 'w') as f:
    json.dump(slim, f, indent=1, ensure_ascii=False)
    f.write('\n')

from collections import Counter
print('rows', len(rows))
print('quality', Counter(r['extraction'] for r in rows))
print('with official key', sum(1 for r in rows if r['answerKey']))
print('publishable now (clean + key)',
      sum(1 for r in rows if r['answerKey'] and r['extraction'] == 'clean'))
print('topics used', len({r['topic'] for r in rows}))
print('recovered by the alternate OCR pass', sum(1 for r in rows if r['pass']))
