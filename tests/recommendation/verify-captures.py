from pathlib import Path
import json,hashlib,calendar,math
root=Path(__file__).resolve().parents[2]
folder=root/'research/recommendation-audit-2026-11-03'
contexts=json.loads((folder/'contexts.json').read_text(encoding='utf8'))
keys=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
results=[]
for row in contexts:
    evidence=row['evidence'];raw_bytes=(folder/evidence['sourceFile']).read_bytes();raw=json.loads(raw_bytes)
    assert hashlib.sha256(raw_bytes).hexdigest()==evidence['sha256']
    normal=row['context']['normal'];coordinates=raw['geometry']['coordinates']
    assert abs(coordinates[0]-normal['longitude'])<=0.006 and abs(coordinates[1]-normal['latitude'])<=0.006
    assert raw['parameters']['T2M']['units']=='C' and raw['parameters']['PRECTOTCORR']['units']=='mm/day'
    for i,key in enumerate(keys):
        month=normal['months'][i];days=sum(calendar.monthrange(y,i+1)[1] for y in range(1991,2021))/30
        assert math.isclose(month['temperature'],raw['properties']['parameter']['T2M'][key],abs_tol=1e-10)
        assert math.isclose(month['rain'],raw['properties']['parameter']['PRECTOTCORR'][key]*days,abs_tol=1e-8)
    assert math.isclose(normal['annualRain'],sum(m['rain'] for m in normal['months']),abs_tol=1e-8)
    results.append({'country':row['country'],'original_point_matches':True,'raw_sha256_matches':True,'all_month_values_match':True,'annual_precipitation_conversion_matches':True})
(folder/'capture-verification.json').write_text(json.dumps({'passed':True,'locations':results},indent=2),encoding='utf8')
print('PASS: six original NASA points, raw hashes and all monthly/annual conversions independently verified.')
