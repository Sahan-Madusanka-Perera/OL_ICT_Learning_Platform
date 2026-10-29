"""Keyword topic classification, shared by the OCR and text-layer extractors.

This used to live inside export.py, which could only be imported by running the
whole OCR pipeline first — it reads `.extract/parsed.json` at module scope. The
born-digital extractor needs the same classifier and has no OCR stage, so the
table moved here and both import it. The ordering and the patterns are
unchanged.

WHAT THIS IS WORTH
------------------
Not much on its own, and the repository should keep saying so. Checking the
2025 assignments by hand found 22 of 40 wrong, 11 of them sitting in the `1.2`
fallback bucket at the bottom of the table. A keyword match is triage: it puts
a question in front of a reviewer who knows the syllabus, and it is explicitly
recorded as machine-assigned so nobody mistakes it for a decision. See
`topicSource` in past-paper-borndigital.json.
"""
import re

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

#: The bucket a question lands in when nothing matched. Worth naming, because
#: "how many ended up here" is the honest measure of how far to trust the rest.
FALLBACK = '1.2'


def topic_of(text):
    t = text or ''
    for code, pat in TOPIC:
        if re.search(pat, t, re.I):
            return code
    return FALLBACK
