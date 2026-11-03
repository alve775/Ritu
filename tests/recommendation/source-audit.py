"""Source fidelity, not proof that historical ECOCROP thresholds fit every farm."""
import csv,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[2]
out=root/'research/recommendation-audit-2026-11-03'
raw=(out/'ecocrop-source.csv').read_bytes()
rows=list(csv.DictReader(raw.decode('cp1252').splitlines()))
data=json.loads((root/'src/data/global/crop-requirements.json').read_text(encoding='utf8'))
index={r['EcoPortCode']:r for r in rows}
numeric=['TMIN','TOPMN','TOPMX','TMAX','RMIN','ROPMN','ROPMX','RMAX','PHMIN','PHMAX','GMIN','GMAX']
text={'scientific':'ScientificName','texture':'TEXT','toleratedTexture':'TEXTR','drainage':'DRA','toleratedDrainage':'DRAR'}
failures=[];checks=0;ledger=[]
for c in data['crops']:
    original=index[c['ecocropId']];errors=[]
    for key in numeric:
        try:expected=float(original[key])
        except (TypeError,ValueError):expected=None
        checks+=1
        if c[key]!=expected:errors.append(key)
    for key,source in text.items():
        checks+=1
        if c[key]!=original[source]:errors.append(key)
    for key,source in {'aliases':'COMNAME','lifespan':'LISPA','lifeform':'LIFO'}.items():
        expected='' if original[source].strip().upper()=='NA' else original[source]
        checks+=1
        if c[key]!=expected:errors.append(key)
    categories=[s.strip() for s in original['CAT'].split(',') if s.strip() and s.strip()!='NA']
    checks+=1
    if c['categories']!=categories:errors.append('categories')
    ledger.append({'id':c['id'],'source_id':c['ecocropId'],'scientific':c['scientific'],'original_common_names':original['COMNAME'],'fields_match':not errors,'differences':';'.join(errors)})
    if errors:failures.append({'id':c['id'],'fields':errors})
with (out/'all-source-records.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=ledger[0].keys());writer.writeheader();writer.writerows(ledger)
report={'sourceRows':len(rows),'retainedRows':len(ledger),'retiredRows':len(data['retired']),'hashMatches':hashlib.sha256(raw).hexdigest()==data['sha256'],'fieldComparisons':checks,'failures':failures,'scope':'Exact source fidelity, not agronomic field validation.'}
(out/'source-audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report));assert report['hashMatches'] and not failures and len(rows)==2568 and len(ledger)==2562
