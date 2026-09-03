"""Emit the past-paper MCQ dataset: text, quality flags, official answer keys."""
import json, re, os
OUT = os.environ.get('WORKDIR', os.path.join(
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), '.extract'))

parsed = json.load(open(f'{OUT}/parsed.json'))
# Read from the tool directory, not the work directory: these were read by eye
# from the scanned grids and are the source the TypeScript keys were typed from.
keys   = json.load(open(os.path.join(os.path.dirname(__file__), 'answer-keys.json')))

# ---- topic classification -------------------------------------------------
# Ordered: the first pattern that matches wins, so put specific before general.
TOPIC = [
 ('3.3', r'\b(convert|equivalent of|octal|hexadecimal)\b'),
 ('3.4', r'\b(terabyte|gigabyte|megabyte|kilobyte|\d\s*(TB|GB|MB|KB)\b|storage capacity)'),
 ('3.5', r'\b(ASCII|Unicode|EBCDIC|coding system|character.{0,12}code)\b'),
 ('3.1', r'\b(binary number|binary form|bits? per|place value)\b'),
 ('3.2', r'\b(number system|base \d)\b'),
 ('4.1', r'\b(logic (gate|circuit)|truth table|AND gate|OR gate|NOT gate|NAND|NOR|XOR|boolean)\b'),
 ('4.2', r'\b(logical operation|logic.{0,10}scenario)\b'),
    ('2.5', r'\b(networks?|topolog(y|ies)|LAN|WAN|MAN|routers?|switch(es)?|hubs?|UTP|fib(re|er) optic|transmission media|NIC|modems?|duplex|bandwidth)\b'),
    ('2.3', r'\b(ports?|HDMI|VGA|RJ45|USB|peripherals?)\b'),
 ('2.4', r'\b(CPU|ALU|control unit|register|cache|RAM|ROM|primary memory|block diagram|motherboard)\b'),
 ('2.2', r'\b(input device|output device|scanner|OCR|OMR|MICR|barcode|joystick|touch screen|webcam|printer|plotter)\b'),
 ('2.1', r'\b(super ?computer|mainframe|mini ?computer|laptop|tablet|desktop|classif)\b'),
 ('5.1', r'\b(operating system|process management|memory management)\b'),
    ('5.2', r'\b(files?|folders?|director(y|ies)|defragment|compress|partition|format)\b'),
 ('6.6', r'\bmail merge\b'),
 ('6.4', r'\b(table)\b.{0,30}\b(word process|document)\b'),
 ('6.3', r'\b(format painter|font|bold|italic|alignment|orientation|portrait|landscape|indent|line spac)\b'),
 ('6.1', r'\b(word process)\b'),
 ('7.7', r'\$[A-Z]?\$?\d|\babsolute (cell )?reference|relative reference\b'),
 ('7.4', r'\b(SUM|AVERAGE|COUNT|MAX|MIN|IF)\s*\(|built-?in function'),
    ('7.8', r'\b(charts?|graphs?)\b.{0,25}\bspread ?sheet\b|\b(pie|bar|line|column) charts?\b'),
 ('7.5', r'\b(sort|filter|conditional format)\b'),
 ('7.1', r'\b(spread ?sheet|worksheet|cell address|range of cells|row and.{0,6}column)\b'),
 ('8.2', r'\b(animation|slide transition)\b'),
    ('8.1', r'\b(presentations?|slides?)\b'),
 ('9.4', r'\b(foreign key|relational|normali|relationship between.{0,12}table)\b'),
 ('9.7', r'\bquer(y|ies)\b'),
 ('9.6', r'\bform\b.{0,20}\bdatabase\b'),
 ('9.8', r'\breport\b.{0,20}\bdatabase\b'),
    ('9.1', r'\b(databases?|primary keys?|records?|fields?|DBMS|tables?)\b'),
 ('10.3', r'\b(flow ?chart|pseudo ?-?code|algorithm)\b'),
 ('10.4', r'\b(Pascal|variable|reserved word|BEGIN|END|REPEAT|WHILE|IF.{0,4}THEN)\b'),
 ('10.5', r'\b(high-?level|low-?level|machine language|assembly|compiler|interpreter|assembler|generation of programming)\b'),
 ('10.2', r'\b(problem solving|control structure|sequence|selection|repetition|iteration)\b'),
 ('10.1', r'\b(input.{0,6}process.{0,6}output|analysing a problem)\b'),
 ('11.2', r'\b(SDLC|system development|feasibility|unit testing|integration testing|acceptance testing|deployment|prototyp|waterfall|agile)\b'),
    ('11.1', r'\b(information systems?)\b'),
 ('12.2', r'\b(e-?mail|SMTP|POP|IMAP|attachment|reply|cc|bcc)\b'),
 ('12.3', r'\b(cloud comput|SaaS|PaaS|IaaS)\b'),
 ('12.1', r'\b(internet|URL|HTTP|FTP|TCP/IP|IP address|domain|browser|WWW|protocol|search engine|ISP)\b'),
    ('13.1', r'\b(pixels?|resolution|bitmap|raster|vector|bpp|colou?r depth|image (file )?format|JPEG|PNG|GIF)\b'),
 ('13.2', r'\b(2D animation|frame|tween|onion skin)\b'),
 ('13.3', r'\b(audio|sound|MP3|WAV|Audacity)\b'),
 ('13.4', r'\b(video|movie maker|clip)\b'),
 ('14.2', r'\b(HTML|tag|hyperlink|web ?page|CSS)\b'),
 ('14.3', r'\b(host|publish|domain name|upload.{0,10}site)\b'),
 ('14.1', r'\b(web ?site structure|site ?map|navigation)\b'),
 ('15.2', r'\b(plagiaris|piracy|cyber|phishing|virus|malware|firewall|password|privacy|RSI|CVS|ergonom|e-?waste|digital divide|copyright)\b'),
 ('15.1', r'\b(e-?learning|e-?commerce|social network|entertainment|smart phone|telemedicine)\b'),
 ('1.1', r'\b(G2C|G2B|G2G|e-?government|national development|ICT in (agri|health|educat))\b'),
 ('1.3', r'\b(generation|vacuum tube|transistor|integrated circuit|VLSI|microprocessor)\b'),
 ('1.2', r'\b(data|information|processing)\b'),
]
def topic_of(text):
    t = text or ''
    for code, pat in TOPIC:
        if re.search(pat, t, re.I): return code
    return '1.2'

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
         'extraction': r['extraction'], 'stem': r['stem'], 'options': r['options']}
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
