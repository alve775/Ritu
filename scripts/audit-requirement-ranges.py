from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'src/data/global/crop-requirements.json').read_text(encoding='utf8'))
findings={}
for label,low,high in [('rain','RMIN','RMAX'),('pH','PHMIN','PHMAX'),('growingPeriod','GMIN','GMAX')]:
    findings[label]=[{'id':r['id'],'scientific':r['scientific'],low:r[low],high:r[high]} for r in data['crops'] if isinstance(r[low],(float,int)) and isinstance(r[high],(float,int)) and (r[low]>r[high] or r[low]<0)]
findings['implausibleTemperature']=[{'id':r['id'],'scientific':r['scientific'],'TMIN':r['TMIN'],'TMAX':r['TMAX']} for r in data['crops'] if (isinstance(r['TMIN'],(int,float)) and r['TMIN']<-100) or (isinstance(r['TMAX'],(int,float)) and r['TMAX']>70)]
(root/'research/global-audit-2026-11-01/numeric-source-anomalies.json').write_text(json.dumps(findings,indent=2),encoding='utf8')
print(json.dumps({k:len(v) for k,v in findings.items()}))
