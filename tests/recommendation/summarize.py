"""Publish a per-record audit ledger; never call a screen pass field validation."""
from pathlib import Path
import csv,json,re
root=Path(__file__).resolve().parents[2]
folder=root/'research/recommendation-audit-2026-11-03'
data=json.loads((root/'src/data/global/crop-requirements.json').read_text(encoding='utf8'))
source=json.loads((folder/'source-audit.json').read_text())
grids=json.loads((folder/'packed-calendar-audit.json').read_text())
matrix=[json.loads(p.read_text()) for p in sorted(folder.glob('matrix-??.json'))]
assert len(matrix)==6 and all(m['passed'] and m['setups']==21960 for m in matrix)
source_rows={r['source_id']:r for r in csv.DictReader((folder/'all-source-records.csv').open(encoding='utf-8-sig'))}
def gap(c):
    if c['name']['en'].lower()==c['scientific'].lower() and c['id']!='ecocrop-10308':return 'Common-name evidence missing; reference only'
    if c['planKind']=='unknown':return 'Planting life cycle unrecorded'
    bounds=[c[k] for k in ['TMIN','TOPMN','TOPMX','TMAX']]
    if any(v is None for v in bounds) or not(c['TMIN']<c['TMAX'] and c['TMIN']<=c['TOPMN']<=c['TOPMX']<=c['TMAX']):return 'Temperature requirements missing or inconsistent'
    if not c['GMIN'] or not c['GMAX'] or not(1<=c['GMIN']<=c['GMAX']<=365):return 'Source growing period missing or unsupported'
    return 'Eligible for preliminary screening; field suitability unverified'
rows=[]
for c in data['crops']:
    r={'plant_id':c['id'],'source_id':c['ecocropId'],'scientific_identity':c['scientific'],'source_common_names':source_rows[c['ecocropId']]['original_common_names'],'source_fields_match':source_rows[c['ecocropId']]['fields_match'],'record_status':gap(c),'special_name_provenance':'FAO Edible nuts: Oyster nut' if c['id']=='ecocrop-10308' else '', 'field_suitability':'NOT VALIDATED','seasonal_water_adequacy':'NOT ESTABLISHED'}
    for m in matrix:r['returned_in_'+m['country']]=m['perPlant'].get(c['id'],0)
    r['total_returned_evaluations']=sum(m['perPlant'].get(c['id'],0) for m in matrix)
    rows.append(r)
output=root/'output/audit';output.mkdir(parents=True,exist_ok=True)
with (output/'RITU_Recommendation_Audit_2026-11-03.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
summary={'date':'2026-11-03','source_records':len(rows),'source_field_comparisons':source['fieldComparisons'],'source_fidelity_failures':source['failures'],'calendar_cells_checked':grids['gridCellsCompared'],'calendar_fields_checked':grids['fieldComparisons'],'locations':len(matrix),'dates_per_location':366,'profiles_per_date':60,'unique_location_date_soil_drainage_combinations':6*366*12,'water_label_variants':5,'setup_evaluations':sum(m['setups'] for m in matrix),'returned_options_checked':sum(m['returnedOptions'] for m in matrix),'saved_record_checks':sum(m['storedRecords'] for m in matrix),'all_matrix_passed':True,'entries_returned_at_least_once':sum(r['total_returned_evaluations']>0 for r in rows),'scope':'Source fidelity, declared screening-rule correctness and software behavior. Not validation of agronomic recommendation accuracy.','unresolved':['Crop-season water budget','Daily temperature extremes and cultivar winter survival','Soil chemistry, salinity, depth and nutrients','Local seed/cultivar availability, legal restrictions and pest pressure','Independent expert review and field outcome validation']}
(output/'RITU_Recommendation_Audit_2026-11-03.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
(folder/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
print(json.dumps(summary))
