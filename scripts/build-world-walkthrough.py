"""Illustrated, evidence-labelled walkthrough of the current one-plant workflow."""
from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape,A4
from reportlab.lib.colors import HexColor,white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from PIL import Image
from pypdf import PdfReader
root=Path(__file__).resolve().parents[1]
audit=root/'research/global-audit-2026-11-01'
shots=audit/'walkthrough'
result=json.loads((shots/'result.json').read_text(encoding='utf-8'))
summary=json.loads((audit/'summary.json').read_text())
unit=json.loads((audit/'unit-api-results.json').read_text())
assert summary['matrixComplete'],'Do not publish an unfinished country matrix as completed.'
assert summary['browser']['finished'],'Wait for the browser checkpoint before publishing.'
out=root/'output/pdf/RITU_Worldwide_Verification_and_Farm_Walkthrough.pdf'
out.parent.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Body','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Bold','C:/Windows/Fonts/arialbd.ttf'))
W,H=landscape(A4)
ink=HexColor('#20343c');muted=HexColor('#50636a');green=HexColor('#204d3d');line=HexColor('#d7e1dd')
c=canvas.Canvas(str(out),pagesize=(W,H),pageCompression=1)
c.setTitle('RITU | Worldwide verification and farm walkthrough')
c.setAuthor('Code_Geass | RITU project audit')
styles={
 'body':ParagraphStyle('body',fontName='Body',fontSize=11,leading=16,textColor=ink,spaceAfter=8),
 'small':ParagraphStyle('small',fontName='Body',fontSize=9,leading=13,textColor=muted),
 'large':ParagraphStyle('large',fontName='Bold',fontSize=26,leading=31,textColor=ink),
 'sub':ParagraphStyle('sub',fontName='Bold',fontSize=14,leading=19,textColor=green),
}
page=0
def para(text,x,y,width,style='body'):
    p=Paragraph(text,styles[style]);_,height=p.wrap(width,H);p.drawOn(c,x,y-height);return y-height-8
def begin(kicker,title,description=''):
    global page
    page+=1;c.setFillColor(white);c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(green);c.rect(0,H-9,W,9,fill=1,stroke=0)
    c.setFont('Bold',10);c.setFillColor(green);c.drawString(40,H-35,'RITU  /  '+kicker.upper())
    y=para(title,40,H-53,W-80,'large')
    if description:y=para(description,40,y,W-80,'small')
    c.setStrokeColor(line);c.line(40,35,W-40,35)
    c.setFont('Body',8);c.setFillColor(muted);c.drawString(40,22,'Code_Geass | Evidence captured '+result['capturedAt'][:16].replace('T',' ')+' UTC')
    c.drawRightString(W-40,22,str(page));return y-4
def end():c.showPage()
def picture(name,x,bottom,maxwidth,maxheight):
    path=shots/(name+'.png')
    with Image.open(path) as im:w,h=im.size
    scale=min(maxwidth/w,maxheight/h);dw,dh=w*scale,h*scale
    c.drawImage(str(path),x,bottom+(maxheight-dh)/2,width=dw,height=dh,preserveAspectRatio=True,mask='auto')
    return dw,dh
def link(label,url):return '<link href="'+escape(url,{'"':'&quot;'})+'" color="#155c85"><u>'+escape(label)+'</u></link>'
def listcopy(items,x,y,width):
    for number,text in enumerate(items,1):y=para(f'<b>{number}.</b> '+text,x,y,width)
    return y

y=begin('Verification overview','Worldwide source checks. One clear farm workflow.','Current application, not the superseded annual-rotation prototype. Read the boundaries as carefully as the passing counts.')
y=para(f"<b>{summary['catalogueEntries']:,} plant records</b> checked against the pinned source; <b>{summary['setupEvaluations']:,} screening calls</b> across six real locations and every supported land profile over 731 start dates.",40,y,W-80)
metrics=[('Source fields','43,554','Zero import mismatches'),('Calendar cells','3,628,800','All 14 original grids'),('Unit / API',str(unit['numPassedTests']),'Passing checks in final suite')]
boxw=(W-100)/3
for i,(label,value,note) in enumerate(metrics):
    x=40+i*(boxw+10);c.setFillColor(HexColor('#f2f6f4'));c.roundRect(x,y-95,boxw,89,9,fill=1,stroke=0)
    para(label,x+14,y-15,boxw-28,'small');para(value,x+14,y-34,boxw-28,'large');para(note,x+14,y-72,boxw-28,'small')
y-=119
y=para('What the numbers establish',40,y,W-80,'sub')
y=listcopy(['Source values and the implemented screen were checked independently. Missing source facts remain missing; no invented harvest dates fill the gaps.','Six points cover Bangladesh, the United States, Russia, Brazil, Australia and Kenya. Soil, water and area in the test matrix are declared QA assumptions.','Browser tests cover desktop and phone. Recorded real responses are replayed for bulk QA; the walkthrough pages below use actual online API responses.'],40,y,W-80)
para('<b>Release boundary:</b> this is preliminary decision support and farm recordkeeping. These checks do not certify every species or cultivar as suitable for every farm.',40,y,W-80)
end()

y=begin('01 / Location','Pin the field first.','Example coordinates: 23.86186 N, 90.00273 E, Manikganj, Bangladesh. This point is used for QA, not a surveyed farm boundary.')
picture('01-location',40,58,W-80,y-65)
end()

y=begin('02 / Field facts','Tell RITU what satellites cannot know.','QA assumptions: one hectare; clay texture; drainage unknown; rain only. These inputs demonstrate the workflow and are not measured local soil or water facts.')
available=y-58
heights=[]
for name in ['02a-field','02b-soil','02c-water']:
    with Image.open(shots/(name+'.png')) as im:heights.append(im.height/im.width)
scale=min((W-80),available/(sum(heights)+.045))
top=y
for name,ratio in zip(['02a-field','02b-soil','02c-water'],heights):
    height=scale*ratio;picture(name,40,top-height,scale,height);top-=height+5
end()

selection=result['selection']
y=begin('03 / Crop choice','Choose one supported candidate.','Search narrows the full catalogue. The scientific name and source record identify the plant; source categories are not an edibility guarantee.')
picture('03-wheat',40,55,360,y-60)
right=430;rw=W-right-40
y=para('Example: wheat',right,y,rw,'sub')
y=para('<b>Triticum aestivum</b><br/>Selected from the suggestions for the entered point and field assumptions.',right,y,rw)
y=para(f"Planned start: <b>{selection['start']}</b><br/>Indicative duration: <b>{selection['durationMin']} to {selection['durationMax']} days</b><br/>Earliest / latest reference end: <b>{selection['endEarly']} / {selection['endLate']}</b>.",right,y,rw)
y=para('Why it appears',right,y,rw,'sub')
for reason in selection['reasons']:y=para(escape(reason),right,y,rw,'small')
para('A source-backed candidate is not a guarantee of yield, profit, variety suitability or successful rainfed establishment. Open the cautions before deciding.',right,y,rw)
end()

y=begin('04 / Saved plan','A farm gets its own workspace.','The illustration represents a planned field. It is not a satellite observation, growth forecast or measured crop condition.')
picture('05a-hero',40,210,W-80,y-218)
y=para('Planned does not mean planted',40,190,W-80,'sub')
y=para('The actual planting date remains blank in this example. RITU must not start an actual crop-age counter or claim a task was completed until the farmer records it.',40,y,W-80)
para('The selected crop, source context, field conditions, notes and activities are stored together as an independent farm record. Each separate field or planting can have its own record.',40,y,W-80)
end()

y=begin('05 / Calendar','Read dates as references, then record reality.','The current one-crop calendar replaces the old requirement to choose an entire year of crops.')
picture('06-calendar',40,55,480,y-60)
y=listcopy(['The selected day controls the daily checklist.','A planned planting marker records the reference date chosen from source evidence.','Actual planting is recorded separately. Crop age starts from that event.','Rain figures appear only where a fresh available forecast covers the date. A future month does not acquire an invented weather forecast.','Growing-period ranges are not cultivar-specific harvest guarantees.'],545,y,W-585)
end()

y=begin('06 / Daily checks','Advice follows recorded status and available evidence.','This example has not been recorded as planted. The checklist therefore asks for preparation and a real planting record.')
picture('07-daily',40,55,470,y-60)
listcopy(['Check actual soil and drainage before an irrigation decision.','Mark a task complete only after doing it.','Record an observed stage instead of inferring flowering or maturity from age alone.','A forecast can prompt an inspection. It cannot establish a measured irrigation dose.','Stale weather and another farm\'s weather must not generate weather-specific instructions.'],535,y,W-575)
end()

y=begin('07 / Weather','Read the source, timestamp and forecast horizon.','Actual online model weather for the selected coordinates. It is not a sensor reading from this field and is not a full-season weather prediction.')
picture('08-weather',40,55,530,y-60)
yr=para('What the numbers mean',600,y,W-640,'sub')
for text in ['Temperature is a model estimate; humidity is relative humidity.',
             'Current rain covers the stated interval. Forecast-table rain is a daily amount; rain chance is a probability, not a guarantee.',
             'Wind is estimated at 10 metres. These values do not measure root-zone water or establish an irrigation dose.',
             'This is a dated capture. Recheck updated conditions before field work.']:
    yr=para(text,600,yr,W-640)
end()

y=begin('08 / Multiple farms','Keep separate plantings separate.','The example record was saved and opened through the farm list. No real planting or harvest was fabricated.')
picture('09a-farm-tile',40,55,350,y-60)
listcopy(['Use Add a farm for another field, crop or independent planting.','Switch farms before editing notes or recording activities. Each record retains its own location and environmental context.','Export all farm records to keep a backup. Farms currently stay in this browser; they do not automatically sync across devices.','Deleting one farm must preserve the others. The browser regression suite checks that separation.'],425,y,W-465)
end()

y=begin('Evidence and limits','Use the system within what its sources establish.','The detailed per-entry CSV and reproducible results are retained with the project audit.')
left=40;col=(W-105)/2;right=left+col+25
yl=para('Data used',left,y,col,'sub')
yl=para(link('NASA POWER climatology','https://power.larc.nasa.gov/docs/services/api/temporal/climatology/')+'<br/>1991-2020 monthly climate, requested independently for each point. This is historical context, not live weather.',left,yl,col)
yl=para(link('FAO ECOCROP','https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en')+'<br/>Broad published species descriptors. FAO says the database was discontinued around 2015 and is accessible through GAEZ.',left,yl,col)
yl=para(link('Sacks calendar source documentation','https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/crop-readme.txt')+'<br/>Historical regional observations at 0.5-degree resolution; not field-scale optimum dates.',left,yl,col)
yl=para(link('Open-Meteo forecast documentation','https://open-meteo.com/en/docs')+'<br/>Dated model weather and forecasts, with missing/stale states handled explicitly.',left,yl,col)
para(link('Wikimedia media policy','https://www.mediawiki.org/wiki/Common_thumbnail_sizes')+'<br/>API-delivered source photographs with identity links, attribution and licenses. Botanical visual certainty is not established by metadata alone.',left,yl,col)
yr=para('Not established by passing tests',right,y,col,'sub')
yr=listcopy(['A best crop, yield or profit for every field.','Local cultivar suitability, pests, soil pH/salinity, legal or invasive status.','Frost safety, photoperiod response, perennial winter survival or first-fruit date.','Automatic fertilizer, pesticide or irrigation doses without validated crop protocols and field measurements.','Real-world farmer usability and field effectiveness before trials.'],right,yr,col)
para('No mock weather or invented harvest is used in this walkthrough. Its field conditions are explicitly declared assumptions; its API sources and captured results remain inspectable.',right,yr,col)
end()
c.save()
reader=PdfReader(str(out))
assert len(reader.pages)==page
text='\n'.join(p.extract_text() or '' for p in reader.pages)
for required in ['Manikganj','Triticum aestivum','263,160','QA assumptions','1991-2020']:
    assert required in text,required
print(json.dumps({'file':str(out),'pages':page,'bytes':out.stat().st_size,'textCharacters':len(text)}))
