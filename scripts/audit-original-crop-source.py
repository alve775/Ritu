"""Reproducible field comparison against the pinned original CSV, including NA metadata semantics."""
from pathlib import Path
import csv,hashlib,json
root=Path(__file__).resolve().parents[1]
raw=root/'research/global-season-2026-10-31/ecocrop-db.csv'
rows=list(csv.DictReader(raw.read_text(encoding='cp1252').splitlines()))
data=json.loads((root/'src/data/global/crop-requirements.json').read_text(encoding='utf-8'))
by_code={r['EcoPortCode']:r for r in rows}
numeric=['TMIN','TOPMN','TOPMX','TMAX','RMIN','ROPMN','ROPMX','RMAX','PHMIN','PHMAX','GMIN','GMAX']
strings={'scientific':'ScientificName','texture':'TEXT','toleratedTexture':'TEXTR','drainage':'DRA','toleratedDrainage':'DRAR'}
errors=[];comparisons=0;normalized=0
for plant in data['crops']:
    source=by_code[plant['ecocropId']]
    for key in numeric:
        try:expected=float(source[key])
        except (ValueError,TypeError):expected=None
        comparisons+=1
        if plant[key]!=expected:errors.append({'id':plant['id'],'field':key})
    for key,original in strings.items():
        comparisons+=1
        if plant[key]!=source[original]:errors.append({'id':plant['id'],'field':key})
    for key,original in {'lifespan':'LISPA','lifeform':'LIFO','aliases':'COMNAME'}.items():
        expected='' if source[original].strip().upper()=='NA' else source[original]
        normalized+=1
        if plant[key]!=expected:errors.append({'id':plant['id'],'field':key})
    if source['COMNAME'].strip().upper()=='NA':
        assert plant['name']['en']==plant['scientific']
assert len(data['crops'])==len(set(c['id'] for c in data['crops']))==2562
sha=hashlib.sha256(raw.read_bytes()).hexdigest()
assert sha==data['sha256']
report={'sourceRows':len(rows),'retained':len(data['crops']),'sha256':sha,'hashMatches':True,'uniqueIdentities':len(data['crops']),
 'rawFieldComparisons':comparisons,'normalizedMissingLabelComparisons':normalized,'errors':errors,
 'missingTemperature':sum(any(c[k] is None for k in ['TMIN','TOPMN','TOPMX','TMAX']) for c in data['crops']),
 'missingOrZeroPeriod':sum(not c['GMIN'] or not c['GMAX'] for c in data['crops'])}
(root/'research/global-audit-2026-11-01/raw-source-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
assert not errors
