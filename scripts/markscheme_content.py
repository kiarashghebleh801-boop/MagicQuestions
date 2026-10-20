"""Text-first PDF content extraction. Images require physical evidence, never keywords."""
import re
import statistics
import fitz

SYMBOLS = {'\uf0b4':'×','\uf02d':'−','\uf0b7':'•','\uf0b8':'÷','\uf0ae':'→','\uf0b0':'°',
           '\uf0e5':'Σ','\uf0ad':'↑','\uf044':'Δ','\uf0fc':'✓','\uf050':'✓','\uf0e0':'→','\uf8e7':'│'}
SUP = str.maketrans('0123456789+-−=()n','⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁼⁽⁾ⁿ')
SUB = str.maketrans('0123456789+-−=()','₀₁₂₃₄₅₆₇₈₉₊₋₋₌₍₎')


# These four source bitmaps contain ordinary, fully typeable notation. Verified
# against the uploaded originals; do not keep them as screenshots just because
# the publisher embedded the equation as a raster image.
IMAGE_TEXT = {
    ('IGCSE_PHYSICS_2026_June_P1R_MS_1789834925881.pdf', 17, 232): '¹₀n → ¹₁p + ⁰₋₁β',
    ('P1R_MS_1777741119967.pdf', 10, 429): '²²⁶₈₈Ra → ²²²₈₆Rn + ⁴₂α',
    ('P2R_MS_1777741158837.pdf', 5, 514): '²³⁹₉₃Np',
    ('IGCSE_PHYSICS_2026_June_P2_MS_1789834927427.pdf', 9, 155): 'efficiency = (useful energy output)/(total energy output) × 100%',
}

def image_text(page, rect):
    from pathlib import Path
    return IMAGE_TEXT.get((Path(page.parent.name).name,page.number+1,round(rect.y0)))


def glyph_text(text):
    return ''.join(SYMBOLS.get(c,c) for c in text).replace('\x00','')


def in_rect(rect, box):
    return rect.contains(fitz.Point((box[0]+box[2])/2, (box[1]+box[3])/2))


def fractions(page, rect, words):
    found=[]
    for d in page.get_drawings():
        for item in d['items']:
            if item[0]=='l':
                a,b=item[1:3]; r=fitz.Rect(min(a.x,b.x),min(a.y,b.y),max(a.x,b.x),max(a.y,b.y))
            elif item[0]=='re': r=item[1]
            else: continue
            if r.width<5 or r.height>1.5 or r.x0<rect.x0+2 or r.x1>rect.x1-2 or not in_rect(rect,r): continue
            # A fraction rule separates text above and below, inside its width.
            above=[w for w in words if r.x0-2<=w[0] and w[2]<=r.x1+2 and -3<=r.y0-w[3]<12]
            below=[w for w in words if r.x0-2<=w[0] and w[2]<=r.x1+2 and -3<=w[1]-r.y1<12]
            if not above or not below: continue
            a=max(w[3] for w in above); b=min(w[1] for w in below)
            above=[w for w in above if abs(w[3]-a)<4];below=[w for w in below if abs(w[1]-b)<4]
            box=fitz.Rect(r.x0-1,min(w[1] for w in above),r.x1+1,max(w[3] for w in below))
            # Table rules are much wider than both contents; do not flatten tables.
            content_width=max(max(w[2] for w in group)-min(w[0] for w in group) for group in (above,below))
            if r.width>content_width*1.6+8:continue
            text=lambda ws:' '.join(glyph_text(w[4]) for w in sorted(ws,key=lambda w:w[0]))
            math_words={'useful','total','input','output','mass','time','distance','speed','force','energy','power','area','volume','density','pressure','charge','current','voltage','resistance','wavelength','frequency','temperature','length','work','moles','change','in','momentum','number','of','particles'}
            def is_math(value):
                letters=re.findall(r'[a-zA-Z]+',value)
                return value.strip() not in ('/','x','×','=','−','-') and all(len(word)==1 or word.lower() in math_words for word in letters)
            if not is_math(text(above)) or not is_math(text(below)):continue
            if not any(box.intersects(old[0]) for old in found): found.append((box,f'({text(above)})/({text(below)})',r))
    return found


def visual_regions(page, rect):
    words=[w for w in page.get_text('words') if in_rect(rect,w)]
    frac=fractions(page,rect,words)
    pieces=[]
    for info in page.get_image_info():
        r=fitz.Rect(info['bbox'])
        if image_text(page,r):continue
        if in_rect(rect,r) and r.width>3 and r.height>3:
            pieces.append((fitz.Rect(r),'image'))
    for d in page.get_drawings():
        # Filled rectangles around Word text are invisible layout containers.
        if d['type']=='f' and all(i[0]=='re' for i in d['items']):
            candidates=[i[1] for i in d['items'] if min(i[1].width,i[1].height)<1.6]
        else:candidates=[d['rect']]
        for r in candidates:
            r=fitz.Rect(r)
            if not rect.intersects(r):continue
            # Ignore the parent marking table's borders, including page continuations.
            if r.x0<rect.x0+2 or r.x1>rect.x1-2:continue
            if r.y0<rect.y0-1 or r.y1>rect.y1+1:continue
            if r.width<3 and r.height<3:continue # isolated bullet/dot: editable glyph
            if any((r & f[2]).width >= r.width-1 and abs(r.y0-f[2].y0)<2 for f in frac):continue
            if r.height<1.6:
                underlined=[w for w in words if min(w[2],r.x1)-max(w[0],r.x0)>2
                            and w[1]<r.y0 and -3<r.y0-w[3]<2]
                if underlined:continue # typographic underline, not drawn artwork
            pieces.append((r,'diagram'))
    # Chemical structures can be drawn with positioned bond glyphs rather than paths.
    for b in page.get_text('dict')['blocks']:
        for line in b.get('lines',[]):
            for s in line['spans']:
                if '\uf8e7' in s['text'] and in_rect(rect,s['bbox']):pieces.append((fitz.Rect(s['bbox']),'diagram'))
    groups=[]
    for r,kind in pieces:
        touching=[g for g in groups if (g[0]+(-10,-10,10,10)).intersects(r)]
        if touching:
            target=touching[0];target[0]|=r
            for g in touching[1:]: target[0]|=g[0];groups.remove(g)
        else:groups.append([fitz.Rect(r),kind])
    # A second pass joins components whose union now connects to another component.
    changed=True
    while changed:
        changed=False
        for i,g in enumerate(groups):
            for other in groups[i+1:]:
                if (g[0]+(-12,-12,12,12)).intersects(other[0]):g[0]|=other[0];groups.remove(other);changed=True;break
            if changed:break
    regions=[]
    for r,kind in groups:
        if r.width<8 and r.height<8:continue
        if r.height<2 and r.width>rect.width*.88:continue # isolated marking-table row rule
        if r.width<2 and r.height>30:continue # isolated parent-table column rule
        # Include axis labels, atom letters and table-cell text around the artwork.
        if kind == 'image':
            r=(r+(-1,-1,1,1)) & page.rect
        else:
            expanded=(r+(-13,-11,13,11)) & rect
            nearby=[fitz.Rect(w[:4]) for w in words if expanded.intersects(fitz.Rect(w[:4]))]
            for word_rect in nearby:r|=word_rect
            r=(r+(-1,-1,1,1)) & rect
        if r.width>5 and r.height>5:regions.append({'rect':[round(v,3) for v in r],'kind':kind})
    # Expanded labels may connect two crops; never print overlapping screenshots.
    merged=[]
    for region in sorted(regions,key=lambda v:v['rect'][1]):
        r=fitz.Rect(region['rect'])
        if merged and fitz.Rect(merged[-1]['rect']).y1 >= r.y0:merged[-1]['rect']=list(fitz.Rect(merged[-1]['rect'])|r)
        else:merged.append(region)
    return merged,frac


def typed_text(page, rect, exclude=(), frac=()):
    words=page.get_text('words')
    tokens=[]
    for info in page.get_image_info():
        r=fitz.Rect(info['bbox']);text=image_text(page,r)
        if text and in_rect(rect,r) and not any(in_rect(fitz.Rect(e),r) for e in exclude):
            tokens.append({'text':text,'x':r.x0,'end':r.x1,'y':(r.y0+r.y1)/2})
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            spans=[s for s in line['spans'] if s['text'].strip() and in_rect(rect,s['bbox'])
                   and not any(in_rect(fitz.Rect(r),s['bbox']) for r in exclude)
                   and not any(in_rect(f[0],s['bbox']) for f in frac)]
            if not spans:continue
            base=max(s['size'] for s in spans)
            baseline=statistics.median(s['origin'][1] for s in spans if s['size']>=base*.9)
            for s in spans:
                text=glyph_text(s['text'])
                if s['size']<base*.85 and s['origin'][1]<baseline-.7:text=text.translate(SUP)
                elif s['size']<base*.85 and s['origin'][1]>baseline+.5:text=text.translate(SUB)
                tokens.append({'text':text,'x':s['bbox'][0],'end':s['bbox'][2],'y':baseline})
    for box,text,_ in frac:
        if not any(in_rect(fitz.Rect(r),box) for r in exclude):tokens.append({'text':text,'x':box.x0,'end':box.x1,'y':(box.y0+box.y1)/2})
    groups=[]
    for token in sorted(tokens,key=lambda t:(t['y'],t['x'])):
        group=next((g for g in groups if abs(g[0]-token['y'])<3.5),None)
        if group:group[1].append(token)
        else:groups.append([token['y'],[token]])
    lines=[]
    for y,group in sorted(groups):
        value='';end=None
        for token in sorted(group,key=lambda t:t['x']):
            if end is not None and token['x']-end>1.8 and value and not value[-1].isspace() and not token['text'].startswith(' '):value+=' '
            value+=token['text'];end=token['end']
        value=re.sub(r' +',' ',value).strip()
        if value:lines.append(value)
    return '\n'.join(lines)


def answer_content(page, rect, text_left=None):
    regions,frac=visual_regions(page,rect)
    rect=fitz.Rect(text_left if text_left is not None else rect.x0,rect.y0,rect.x1,rect.y1)
    blocks=[];top=rect.y0
    for region in regions:
        r=fitz.Rect(region['rect'])
        before=typed_text(page,fitz.Rect(rect.x0,top,rect.x1,max(top,r.y0)),frac=frac)
        if before:blocks.append({'text':before})
        # Retain any readable side annotations as text, outside the cropped visual.
        alongside=typed_text(page,fitz.Rect(rect.x0,max(top,r.y0),rect.x1,max(top,r.y1)),exclude=[r],frac=frac)
        if alongside:blocks.append({'text':alongside})
        blocks.append({'crop':{'page':page.number+1,**region}})
        top=r.y1
    after=typed_text(page,fitz.Rect(rect.x0,top,rect.x1,rect.y1),frac=frac)
    if after:blocks.append({'text':after})
    return blocks
