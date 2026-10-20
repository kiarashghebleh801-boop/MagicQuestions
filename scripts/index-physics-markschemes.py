"""Build the Physics text/visual index once, sharing the strict Chemistry extractor."""
import argparse
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('chemistry_index', Path(__file__).with_name('index-chemistry-markschemes.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source_dir', type=Path)
args = parser.parse_args()
result = {}
for path in sorted(args.source_dir.glob('*.pdf')):
    if not ('PHYSICS' in path.name and '_MS' in path.name or path.name.startswith(('P1R_MS','P2R_MS'))):
        continue
    result[path.name] = module.index_pdf(path)
    data=result[path.name]
    print(path.name, len(data['questions']), 'questions;', sum('crop' in b for rows in data['questions'].values() for r in rows for b in r['content']), 'visual crops')
output = Path(__file__).resolve().parents[1] / 'src/lib/physicsMarkSchemeIndex.json'
output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print('Wrote',len(result),'indexed Physics papers')
