"""Mechanical and visual review artifacts for the delivered edit."""
import json, pathlib, re, subprocess, sys
from PIL import Image, ImageDraw
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'research/pitch'
ff=out/'toolchain/portable/ffmpeg.exe'
probe=json.loads((out/'final-probe.json').read_text(encoding='utf-8'))
streams=probe['streams']
v=next(s for s in streams if s['codec_type']=='video')
a=next(s for s in streams if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1920,1080)
assert v['codec_name']=='h264' and a['codec_name']=='aac'
assert abs(float(v['duration'])-185)<.05
assert abs(float(v['duration'])-float(a['duration']))<=.2
assert float(probe['format']['duration'])<240
clock=json.loads((out/'word-clock.json').read_text(encoding='utf-8'))
assert clock['caption_words']==clock['timed_words']==443
assert clock['similarity']>=.90
caps=clock['captions']
assert all(0<=c['start']<c['end']<=185 for c in caps)
assert all(len(c['text'].split())<=5 for c in caps)
manifest=json.loads((out/'script_manifest.json').read_text(encoding='utf-8'))
normalize=lambda x:re.findall(r"[^\W_]+(?:[-'’][^\W_]+)*",x.casefold())
assert normalize(' '.join(c['text'] for c in caps))==normalize(manifest['blocks'][0]['vo_line'])
review=out/'review/final';review.mkdir(parents=True,exist_ok=True)
times=[]
timeline=json.loads((out/'timeline.json').read_text(encoding='utf-8'))
for s in timeline['scenes']:
    if s['key']=='hook':continue
    t=min(s['end']-.8,s['start']+3.2)
    times.append((s['key'],t))
times += [('opening',2.1),('transition-in',11.1),('3d-late',120.3),('credits-tail',184.1)]
for label,t in times:
    subprocess.run([str(ff),'-y','-v','error','-ss',str(t),'-i',str(out/'RITU_Code_Geass_Pitch.mp4'),'-frames:v','1',str(review/f'{label}.jpg')],check=True)
sheet=Image.new('RGB',(1280,202*((len(times)+3)//4)), '#edf0f2')
d=ImageDraw.Draw(sheet)
for i,(label,t) in enumerate(times):
    im=Image.open(review/f'{label}.jpg');im.thumbnail((310,175))
    x=(i%4)*320;y=(i//4)*202
    sheet.paste(im,(x,y));d.text((x+5,y+184),f'{label} {t:.2f}s',fill='black')
sheet.save(review/'contact-sheet.jpg',quality=91)
# Cue midpoints let visual inspection compare actual burned wording with its clock.
selected=[caps[0],caps[len(caps)//2],caps[-1]]
for i,c in enumerate(selected):
    t=(c['start']+c['end'])/2
    subprocess.run([str(ff),'-y','-v','error','-ss',str(t),'-i',str(out/'RITU_Code_Geass_Pitch.mp4'),'-frames:v','1',str(review/f'cue-{i+1}.jpg')],check=True)
receipt={'duration':float(v['duration']),'video':{'codec':v['codec_name'],'size':'1920x1080','fps':v['r_frame_rate']},'audio':{'codec':a['codec_name'],'duration':float(a['duration'])},'words':443,'captionSimilarity':clock['similarity'],'cueSpotChecks':selected,'frameSamples':times,'visualReview':'pending human/model inspection of extracted decoded frames','officialSubmissionRules':'not supplied or independently verified'}
(out/'verification.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print(json.dumps(receipt,indent=2))
