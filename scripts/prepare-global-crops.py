"""Build the complete attributed plant catalogue and unextrapolated Sacks grids.

Requires Python, numpy and scipy. Downloads public source data; never invents
missing calendar cells. Run from repository root. Original files and hashes
are retained in research/global-season-2026-10-31 (ignored local evidence).
"""
from pathlib import Path
import base64, csv, gzip, hashlib, io, json, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from scipy.io import netcdf_file

OUT=Path('src/data/global'); OUT.mkdir(parents=True,exist_ok=True)
RAW=Path('research/global-season-2026-10-31'); RAW.mkdir(parents=True,exist_ok=True)
COMMIT='f13577f4237604b15d85d8e43741714a2d1eb2d4'
ECO=f'https://raw.githubusercontent.com/OpenCLIM/ecocrop/{COMMIT}/EcoCrop_DB.csv'
BASE='https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/netcdf0.5deg/'
def download(url,name):
    path=RAW/name
    if not path.exists():path.write_bytes(urllib.request.urlopen(url,timeout=45).read())
    return path.read_bytes()

rows=list(csv.DictReader(io.StringIO(download(ECO,'ecocrop-db.csv').decode('cp1252'))))
# id, source scientific name, visible English/Bangla, existing photo identity
species=[
 ('rice','Oryza sativa','Rice','ধান','aman'),
 ('wheat','Triticum aestivum','Wheat','গম','wheat'),
 ('maize','Zea mays','Maize','ভুট্টা','maize'),
 ('barley','Hordeum vulgare','Barley','যব','barley'),
 ('potato','Solanum tuberosum','Potato','আলু','potato'),
 ('soybean','Glycine max','Soybean','সয়াবিন','soybean'),
 ('sunflower','Helianthus annuus','Sunflower','সূর্যমুখী','sunflower'),
 ('groundnut','Arachis hypogaea','Groundnut','চিনাবাদাম','groundnut'),
 ('cotton','Gossypium hirsutum','Cotton','তুলা','cotton'),
 ('mung','Vigna radiata','Mung bean','মুগ','mung'),
 ('lentil','Lens culinaris','Lentil','মসুর','lentil'),
 ('chickpea','Cicer arietinum','Chickpea','ছোলা','chickpea'),
 ('mustard','Brassica juncea','Indian mustard','সরিষা','mustard'),
 ('sweetpotato','Ipomoea batatas','Sweet potato','মিষ্টি আলু','sweetpotato'),
 ('onion','Allium cepa','Onion','পেঁয়াজ','onion'),
 ('tomato','Lycopersicon esculentum','Tomato','টমেটো','tomato'),
 ('cabbage','Brassica oleracea var. capitata','Cabbage','বাঁধাকপি','cabbage'),
 ('radish','Raphanus sativus','Radish','মূলা','radish'),
 ('cucumber','Cucumis sativus','Cucumber','শসা','cucumber'),
 ('okra','Abelmoschus esculentus','Okra','ঢেঁড়স','okra'),
 ('sesame','Sesamum indicum','Sesame','তিল','sesame'),
 ('cowpea','Vigna unguiculata','Cowpea','বরবটি','cowpea'),
 ('pumpkin','Cucurbita maxima','Pumpkin','মিষ্টি কুমড়া','pumpkin'),
]
numeric=['TMIN','TOPMN','TOPMX','TMAX','RMIN','ROPMN','ROPMX','RMAX','PHMIN','PHMAX','GMIN','GMAX']
curated={sci:(id,en,bn,photo) for id,sci,en,bn,photo in species}
display_names={
 'Capsicum annuum':('Pepper (Capsicum annuum)','মরিচ (Capsicum annuum)'),
 'Anacardium occidentale':('Cashew','কাজুবাদাম'),
 'Musa acuminata':('Banana (Musa acuminata)','কলা (Musa acuminata)'),
 'Cucumis melo':('Melon','খরমুজ'),
 'Daucus carota':('Carrot (species reference)','গাজর (প্রজাতির তথ্য)'),
 'Beta vulgaris':('Beet / chard (species reference)','বিট / চার্ড (প্রজাতির তথ্য)'),
}
crops=[]
retired=[]
for r in rows:
    sci=r['ScientificName']
    # User explicitly retired sorghum. A full import must not restore it.
    if sci.lower().startswith('sorghum '):
        retired.append(dict(ecocropId=r['EcoPortCode'],scientific=sci));continue
    common=[v.strip() for v in r['COMNAME'].split(',') if v.strip() and v.strip().upper()!='NA']
    id,en,bn,photo=curated.get(sci,(f"ecocrop-{r['EcoPortCode']}",common[0].capitalize() if common else sci,common[0].capitalize() if common else sci,None))
    if sci in display_names:en,bn=display_names[sci]
    def number(k):
        try:return float(r[k])
        except (ValueError,TypeError):return None
    values={k:number(k) for k in numeric}
    # Do not turn missing/zero durations into invented harvest dates. Generic
    # perennial growing periods are never interpreted as time to first fruit.
    seasonal=(('annual' in r['LISPA'] or 'biennial' in r['LISPA'] or sci in curated)
              and 'tree' not in r['LIFO'])
    crops.append(dict(id=id,scientific=sci,name=dict(en=en,bn=bn),photo=photo,ecocropId=r['EcoPortCode'],
      aliases='' if r['COMNAME'].strip().upper()=='NA' else r['COMNAME'],categories=[c.strip() for c in r['CAT'].split(',') if c.strip() and c.strip()!='NA'],
      lifespan='' if r['LISPA'].strip().upper()=='NA' else r['LISPA'],lifeform='' if r['LIFO'].strip().upper()=='NA' else r['LIFO'],planKind='seasonal' if seasonal else 'perennial-review' if 'perennial' in r['LISPA'] else 'unknown',
      **values,texture=r['TEXT'],toleratedTexture=r['TEXTR'],drainage=r['DRA'],toleratedDrainage=r['DRAR']))
(OUT/'crop-requirements.json').write_text(json.dumps(dict(
    source='FAO ECOCROP, distributed by OpenCLIM',sourceUrl=ECO,portal='https://gaez.fao.org/pages/ecocrop',
    distribution='https://zenodo.org/records/10843625',license='OGL-UK-3.0 distribution; original FAO data attribution retained',
    sha256=hashlib.sha256((RAW/'ecocrop-db.csv').read_bytes()).hexdigest(),sourceCount=len(rows),retired=retired,crops=crops),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
identity=['id','scientific','name','photo','ecocropId','categories','lifespan','lifeform','planKind']
(OUT/'plant-catalogue.json').write_text(json.dumps([{k:c[k] for k in identity} for c in crops],ensure_ascii=False,separators=(',',':')),encoding='utf-8')

grids=[('rice','Rice'),('rice','Rice.2'),('wheat','Wheat'),('wheat','Wheat.Winter'),
 ('maize','Maize'),('maize','Maize.2'),('barley','Barley'),('barley','Barley.Winter'),
 ('potato','Potatoes'),('soybean','Soybeans'),('sunflower','Sunflower'),('groundnut','Groundnuts'),
 ('cotton','Cotton'),('sweetpotato','Sweet.Potatoes')]
def make_grid(item):
    crop,stem=item;filename=stem+'.crop.calendar.nc.gz';b=download(BASE+filename,filename)
    with netcdf_file(io.BytesIO(gzip.decompress(b)),mmap=False) as f:
        fields=['plant','plant.start','plant.end','harvest','tot.days','index','political.level']
        arrays=[f.variables[k][:].copy().astype(float).ravel() for k in fields]
        assert f.variables['plant'].shape==(360,720)
        records=[None];lookup={};cells=np.zeros(259200,dtype='<u2')
        # Circular means can be 0.5 near New Year (e.g. a Dec–Jan window).
        # These are valid observations, not missing values.
        for i in np.where((arrays[0]>=0)&(arrays[0]<=366)&(arrays[4]>0)&(arrays[4]<=365))[0]:
            rec=tuple(round(float(a[i]),2) if abs(a[i])<1e10 else None for a in arrays)
            if rec not in lookup:lookup[rec]=len(records);records.append(rec)
            cells[i]=lookup[rec]
        return dict(crop=crop,season=stem,url=BASE+filename,sha256=hashlib.sha256(b).hexdigest(),
            records=records,cells=base64.b64encode(gzip.compress(cells.tobytes(),mtime=0)).decode())
with ThreadPoolExecutor(max_workers=4) as pool:packed=list(pool.map(make_grid,grids))
(OUT/'calendar-grid.json').write_text(json.dumps(dict(
 source='Sacks et al. (2010), University of Wisconsin-Madison SAGE',
 citation='doi:10.1111/j.1466-8238.2010.00551.x',
 sourceUrl='https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/',
 readme='https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/crop-readme.txt',
 resolution=0.5,rows=360,columns=720,extrapolated=False,
 fields=['plant','plant.start','plant.end','harvest','tot.days','index','political.level'],grids=packed),separators=(',',':')),encoding='utf-8')
print(json.dumps({'requirements':len(crops),'grids':len(packed),'gridBytes':(OUT/'calendar-grid.json').stat().st_size}))
