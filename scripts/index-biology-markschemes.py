"""Index Biology's repeated marking tables using their physical row/cell boundaries."""
from pathlib import Path
import re,json,hashlib,sys
import fitz
from markscheme_content import answer_content,typed_text

def index_pdf(path):
 doc=fitz.open(path);questions={};last=None;debug=[]
 for page in doc:
  if page.number<3:continue
  cells={tuple(c) for table in page.find_tables().tables for c in table.cells if c}
  left=min((c[0]for c in cells),default=0)
  starts=sorted([c for c in cells if abs(c[0]-left)<1.5 and c[2]-c[0]>40 and c[3]-c[1]>22],key=lambda c:c[1])
  for c in starts:
   label=typed_text(page,fitz.Rect(c));label=re.sub(r'\s+','',label)
   if 'Question' in label or 'Number' in label:continue
   match=re.fullmatch(r'(?:Q0*)?(\d+)(?:\(([a-z])\)|([a-z]))?(?:\(([ivx]+)\))?',label,re.I)
   if match:
    q=str(int(match[1]));part=match[2]or match[3]or'';roman=match[4]or'';last=(q,part,roman)
   elif label or not last:continue
   row=sorted([r for r in cells if abs(r[1]-c[1])<1.5 and abs(r[3]-c[3])<1.5 and r[0]>=c[2]-1],key=lambda r:r[0])
   if len(row)<2:debug.append((page.number+1,label,'NO CELLS'));continue
   # The answer is the first cell after the label; last cell is the allocated mark.
   a=fitz.Rect(row[0]);a.x0+=1;a.x1-=1;a.y0+=.3;a.y1-=.3
   m=typed_text(page,fitz.Rect(row[-1]));values=re.findall(r'\b\d+\b',m);marks=' '.join(values)
   notes='\n'.join(typed_text(page,fitz.Rect(r))for r in row[1:-1]).strip()
   content=answer_content(page,a,a.x0)
   if not(content or notes or marks):continue
   q,part,roman=last;questions.setdefault(q,[]).append(dict(part=part,roman=roman,notes=notes,marks=marks,content=content));debug.append((page.number+1,label,marks))
 # The source draws a simple equation arrow; it remains editable text.
 if '_P1_MS_' in path.name:
  for row in questions.get('3',[]):
   if row['part']=='b':row['content']=[{'text':'carbon dioxide + water → glucose + oxygen'}]
 totals={q:sum(int(n)for row in rows for n in row['marks'].split())for q,rows in questions.items()}
 return dict(sha256=hashlib.sha256(path.read_bytes()).hexdigest(),questions=questions,totals=totals),debug
if __name__=='__main__':
 source=Path(sys.argv[1]);out={}
 for path in sorted(source.glob('IGCSE_BIOLOGY_*MS*.pdf')):
  out[path.name],debug=index_pdf(path);print(path.name,'totals',out[path.name]['totals']);Path('tmp/bioimport/'+path.stem+'_rows.json').write_text(json.dumps(debug,indent=2))
 Path('src/lib/biologyMarkSchemeIndex.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
