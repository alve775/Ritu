"""Compare every packed cell and all seven fields against the original NetCDFs."""
import base64,gzip,hashlib,io,json
from pathlib import Path
import numpy as np
from scipy.io import netcdf_file
root=Path(__file__).resolve().parents[1]
packed=json.loads((root/'src/data/global/calendar-grid.json').read_text())
result={'sourceGrids':len(packed['grids']),'gridCellsCompared':0,'populatedCells':0,'fieldComparisons':0,'recoveredFractionalCells':0,'errors':[],'grids':[]}
for grid in packed['grids']:
    file=root/'research/global-season-2026-10-31'/grid['url'].split('/')[-1]
    raw=file.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==grid['sha256']
    with netcdf_file(io.BytesIO(gzip.decompress(raw)),mmap=False) as nc:
        arrays=np.array([nc.variables[k][:].copy().astype(float).ravel() for k in packed['fields']]).T
    cells=np.frombuffer(gzip.decompress(base64.b64decode(grid['cells'])),dtype='<u2')
    mask=(arrays[:,0]>=0)&(arrays[:,0]<=366)&(arrays[:,4]>0)&(arrays[:,4]<=365)
    assert np.array_equal(cells>0,mask),grid['season']+' presence mask'
    expected=arrays[mask]
    records=np.array([[np.nan if v is None else v for v in record] for record in grid['records'][1:]])
    actual=records[cells[mask]-1]
    # The compact source format explicitly rounds to two decimal places.
    expected=np.where(np.abs(expected)<1e10,np.round(expected,2),np.nan)
    assert np.allclose(actual,expected,rtol=0,atol=1e-9,equal_nan=True),grid['season']+' source values'
    recovered=int(np.count_nonzero(mask&(arrays[:,0]<1)))
    result['gridCellsCompared']+=int(cells.size)
    result['populatedCells']+=int(mask.sum())
    result['fieldComparisons']+=int(mask.sum())*7
    result['recoveredFractionalCells']+=recovered
    result['grids'].append({'season':grid['season'],'populated':int(mask.sum()),'fractionalCells':recovered,'sha256':grid['sha256']})
result['passed']=True
out=root/'research/global-audit-2026-11-01/packed-calendar-audit.json'
out.write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k!='grids'}))
