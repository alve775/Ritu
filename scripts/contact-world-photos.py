"""Readable QA contact sheets of actual API/CDN evidence; never production assets."""
from pathlib import Path
import json,math,sys
from PIL import Image,ImageOps,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1];folder=root/'research/global-audit-2026-11-01'
report=json.loads((folder/'api-coverage-full.json').read_text())
delivery=json.loads((folder/'image-delivery-refresh.json').read_text()) if (folder/'image-delivery-refresh.json').exists() else {'results':[]}
subject=json.loads((folder/'image-subject-review.json').read_text()) if (folder/'image-subject-review.json').exists() else {'results':[]}
fresh={}
for r in delivery['results']+subject['results']:
    if r['id'] not in fresh or r['checkedAt']>fresh[r['id']]['checkedAt']:
        fresh[r['id']]=r
rows=[]
for row in report['results']:
    refreshed=fresh.get(row['id'])
    r=refreshed if refreshed and refreshed['checkedAt']>row['checkedAt'] else row
    if r['status']=='available' and r.get('asset'):
        rows.append({**row,**r})
new_only='--new-only' in sys.argv
if new_only:
    previous_hashes={r['asset']['sha256'] for r in delivery['results']+subject['results'] if r.get('asset')}
    rows=[r for r in rows if r['asset']['sha256'] not in previous_hashes]
out=folder/('photo-contact-sheets-replacements' if new_only else 'photo-contact-sheets-final');out.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',10)
columns=9;per_page=54;tw=176;th=148
for start in range(0,len(rows),per_page):
    group=rows[start:start+per_page]
    sheet=Image.new('RGB',(columns*tw,math.ceil(len(group)/columns)*th+38),'white');draw=ImageDraw.Draw(sheet)
    draw.text((10,8),f'RITU API image evidence | {start+1}-{start+len(group)} of {len(rows)} | metadata / gross-relevance QA, not botanical certification',font=font,fill='#20343c')
    for i,r in enumerate(group):
        x=(i%columns)*tw;y=(i//columns)*th+35
        file=root/r['asset']['file']
        with Image.open(file) as im:
            thumb=ImageOps.contain(ImageOps.exif_transpose(im).convert('RGB'),(tw-8,108))
            sheet.paste(thumb,(x+(tw-thumb.width)//2,y+(108-thumb.height)//2))
        draw.text((x+4,y+110),r['id'],font=font,fill='#20343c')
        draw.text((x+4,y+126),r['scientific'][:31],font=small,fill='#50636a')
    sheet.save(out/f'plants-{start//per_page+1:02}.jpg',quality=90)
print(json.dumps({'availableImages':len(rows),'sheets':math.ceil(len(rows)/per_page),'directory':str(out)}))
