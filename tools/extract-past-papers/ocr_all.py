"""Step 1 - render every past paper to images and OCR them.

Writes one text file per paper into $WORKDIR/txt. Page images are large;
delete $WORKDIR/png when the run finishes.
"""
import pymupdf, subprocess, os, sys, glob, re
BASE = os.environ.get('REPO', os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
OUT  = os.environ.get('WORKDIR', os.path.join(BASE, '.extract'))
os.makedirs(f'{OUT}/txt',exist_ok=True); os.makedirs(f'{OUT}/png',exist_ok=True)

def ocr_pdf(path,tag):
    d=pymupdf.open(path)
    parts=[]
    for i in range(d.page_count):
        p=d[i]
        native=p.get_text().strip()
        png=f'{OUT}/png/{tag}_p{i+1:02d}.png'
        if not os.path.exists(png):
            p.get_pixmap(dpi=300).save(png)
        r=subprocess.run(['tesseract',png,'-','--psm','6','-l','eng'],
                         capture_output=True,text=True)
        parts.append(f'\n<<<PAGE {i+1}>>>\nNATIVE_CHARS={len(native)}\n{r.stdout}')
        print(f'{tag} p{i+1}/{d.page_count}',flush=True)
    open(f'{OUT}/txt/{tag}.txt','w').write(''.join(parts))

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
