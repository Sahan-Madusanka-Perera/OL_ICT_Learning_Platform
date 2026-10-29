"""Step 1 - render every past paper to images and OCR them.

Writes one text file per paper into $WORKDIR/txt. Page images are large;
delete $WORKDIR/png when the run finishes.

TWO PASSES, NOT ONE
-------------------
Every page is read twice, at two page-segmentation modes, and both results are
kept:

    {tag}.txt       --psm 6, one uniform block. The primary pass, and what
                    parse.py reads. Good at ordinary prose lines.
    {tag}.psm4.txt  --psm 4, a single column of variable-sized text. Keeps the
                    column structure that psm 6 flattens.

They fail differently, which is the point. The nine scanned years lose 57 of
their 360 questions to the primary pass alone, and the losses cluster where an
option row is set in two or four columns — psm 6 reads the row as one line and
the question numbers inside it stop looking like question numbers. `repair.py`
uses the second pass to recover those, bounded by the questions the first pass
already anchored, so a disagreement between the two can only ever fill a gap
and never overwrite something already read.

Running both costs roughly twice the tesseract time and no extra rendering,
because the page image is rendered once and read twice.
"""
import pymupdf, subprocess, os, sys, glob, re
BASE = os.environ.get('REPO', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
OUT  = os.environ.get('WORKDIR', os.path.join(BASE, '.extract'))
os.makedirs(f'{OUT}/txt',exist_ok=True); os.makedirs(f'{OUT}/png',exist_ok=True)

PASSES = {'': '6', '.psm4': '4'}

def ocr_pdf(path,tag):
    d=pymupdf.open(path)
    parts={suffix: [] for suffix in PASSES}
    for i in range(d.page_count):
        p=d[i]
        native=p.get_text().strip()
        png=f'{OUT}/png/{tag}_p{i+1:02d}.png'
        if not os.path.exists(png):
            p.get_pixmap(dpi=300).save(png)
        for suffix,psm in PASSES.items():
            r=subprocess.run(['tesseract',png,'-','--psm',psm,'-l','eng'],
                             capture_output=True,text=True)
            parts[suffix].append(f'\n<<<PAGE {i+1}>>>\nNATIVE_CHARS={len(native)}\n{r.stdout}')
        print(f'{tag} p{i+1}/{d.page_count}',flush=True)
    for suffix in PASSES:
        open(f'{OUT}/txt/{tag}{suffix}.txt','w').write(''.join(parts[suffix]))

targets=[]
for f in sorted(glob.glob(f'{BASE}/pastpapers/*.pdf')):
    b=os.path.basename(f)
    m=re.search(r'(20\d\d)',b)
    if '2013' in b: continue          # byte-identical duplicate of 2012
    targets.append((f,f'paper{m.group(1)}'))
for f in sorted(glob.glob(f'{BASE}/pastpapers/Marking Scheme/*')):
    b=os.path.basename(f)
    if not b.lower().endswith('.pdf'): continue
    m=re.search(r'(20\d\d)',b)
    targets.append((f,f'ms{m.group(1)}'))

for f,tag in targets:
    if os.path.exists(f'{OUT}/txt/{tag}.txt'):
        print('skip',tag,flush=True); continue
    ocr_pdf(f,tag)
print('DONE')
