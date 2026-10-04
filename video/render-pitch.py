"""Local, reproducible RITU motion edit. Source UI is captured, never invented.

The accepted native Higgsedit opening is reused. Further composition is local
after automatic approval review rejected remote project-content export.
"""
import difflib, json, math, os, pathlib, re, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'research/pitch'
sys.path.insert(0, str(OUT / 'python-libs'))
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1920, 1080, 24
GREEN, INK, MUTED, GOLD = '#204635', '#24343d', '#536777', '#c6a349'
PAPER, LINE, BLUE = '#f3f5f7', '#dce3e8', '#427b9d'
fonts = {}
def font(n, bold=False):
    key = (n, bold)
    if key not in fonts: fonts[key] = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf', n)
    return fonts[key]

def text(d, xy, value, size=32, color=INK, bold=False, width=None, spacing=12):
    x, y = xy
    f = font(size, bold)
    for paragraph in value.split('\n'):
        words, line = paragraph.split(), ''
        for word in words:
            trial = (line + ' ' + word).strip()
            if width and d.textlength(trial, font=f) > width and line:
                d.text((x, y), line, font=f, fill=color); y += size + spacing; line = word
            else: line = trial
        d.text((x, y), line, font=f, fill=color); y += size + spacing
    return y

def rounded(d, box, fill, border=None, radius=22, stroke=2):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=border, width=stroke)

logo = Image.open(ROOT / 'public/Ritu_Logo.jpeg').convert('RGB')
logo.thumbnail((172, 88), Image.Resampling.LANCZOS)
clock = json.loads((OUT / 'word-clock.json').read_text(encoding='utf-8'))
assert clock['timed_words'] == clock['caption_words'] == 443
assert clock['similarity'] >= .90
def tokens(s): return re.findall(r"[^\W_]+(?:[-'’][^\W_]+)*", s.casefold())
all_tokens, owners = [], []
for c in clock['captions']:
    for word in tokens(c['text']): all_tokens.append(word); owners.append(c['start'])
authored = json.loads((OUT / 'script_manifest.json').read_text(encoding='utf-8'))['blocks'][0]['vo_line']
assert all_tokens == tokens(authored), 'Caption word coverage changed'
with wave.open(str(OUT/'narration.wav')) as voice:
    voice_duration = voice.getnframes()/voice.getframerate()
total = math.ceil((voice_duration + 2)*FPS)/FPS
assert total < 240
scenes = json.loads((ROOT/'video/scene-design.json').read_text(encoding='utf-8'))
for i, s in enumerate(scenes):
    phrase = tokens(s['phrase'])
    indices = [j for j in range(len(all_tokens)) if all_tokens[j:j+len(phrase)] == phrase]
    assert len(indices) == 1, (s['key'], indices)
    s['start'] = 0 if i == 0 else round(max(0, owners[indices[0]]-.18)*FPS)/FPS
for i,s in enumerate(scenes): s['end'] = scenes[i+1]['start'] if i+1 < len(scenes) else total
(OUT/'timeline.json').write_text(json.dumps({'duration':total,'fps':FPS,'scenes':scenes}, indent=2))

def base(s):
    im = Image.new('RGB', (W,H), 'white'); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,10),fill=GREEN)
    im.paste(logo,(80,30))
    text(d,(278,47),'RITU  /  Code_Geass',27,GREEN,True)
    text(d,(278,87),'Barind pilot · Rajshahi, Bangladesh',22,MUTED)
    for j,phase in enumerate(['WHO','WHY','WHAT','HOW']):
        x=1190+j*150
        active=phase==s['phase']
        rounded(d,(x,35,x+132,87),GREEN if active else PAPER)
        text(d,(x+24,45),phase,24,'white' if active else MUTED,True)
    label='PLANNED INTEGRATION' if s['kind'] in ['nasa','limits','validation'] else 'CONCEPT DEMO · MOCK DATA'
    text(d,(1190,98),label,22,MUTED,True)
    text(d,(80,147),s['title'],62,INK,True,width=1780)
    d.rectangle((80,236,164,242),fill=GOLD)
    d.rectangle((0,916,W,H),fill=GREEN)
    text(d,(80,1022),'RITU · Code_Geass',22,'#e9f0ec',True)
    text(d,(1140,1022),'Working demo · NASA integration planned',22,'#e9f0ec')
    d.rectangle((80,1062,1840,1065),fill='#52735f')
    return im

def card(width,height,title,body,accent=GREEN):
    im=Image.new('RGBA',(width,height),(0,0,0,0));d=ImageDraw.Draw(im)
    rounded(d,(1,1,width-2,height-2),PAPER,LINE)
    d.rounded_rectangle((1,1,width-2,10),radius=4,fill=accent)
    text(d,(30,34),title,36,accent,True,width=width-62)
    text(d,(30,105),body,30,MUTED,width=width-62)
    return im

def elements(s):
    result=[]
    def add(im,x,y,delay=0): result.append((im.convert('RGBA'),x,y,delay))
    kind=s['kind']
    if kind=='screen':
        lead=Image.new('RGBA',(560,600));d=ImageDraw.Draw(lead)
        y=text(d,(0,0),s['lead'],46,GREEN,True,width=540,spacing=13)
        text(d,(0,y+34),s['detail'],32,MUTED,width=530,spacing=17)
        add(lead,80,302,.1)
        ss=Image.open(OUT/'captures'/f"{s['image']}.png").convert('RGB').crop((260,88,1408,820))
        ss=ss.resize((1124,716),Image.Resampling.LANCZOS)
        # Preserve the exact UI crop; the edit adds only a neutral window frame.
        panel=Image.new('RGBA',(1140,640),'white');panel.paste(ss,(8,8))
        d=ImageDraw.Draw(panel);d.rounded_rectangle((0,0,1139,639),radius=12,outline=LINE,width=3)
        add(panel,700,260,.36)
    elif kind=='seasons':
        for j,(title,body,accent) in enumerate([
            ('Pre-monsoon','A crop choice\nwith a next step.',BLUE),
            ('Monsoon','A field shared\nacross seasons.',GREEN),
            ('Winter','A household plan\nbeyond one harvest.',GOLD)]):
            add(card(540,255,title,body,accent),80+j*600,410,.2+j*.26)
        p=Image.new('RGBA',(1780,110));text(ImageDraw.Draw(p),(0,0),s['lead'],43,GREEN,True)
        text(ImageDraw.Draw(p),(0,62),'Illustrative seasons · no farming recommendation',26,MUTED)
        add(p,80,282,.1)
        p=Image.new('RGBA',(1780,115));text(ImageDraw.Draw(p),(0,0),'What follows?     When is the field free?     What does the household need?',34,INK,True)
        add(p,80,738,1.15)
    elif kind=='team':
        p=Image.new('RGBA',(950,450));d=ImageDraw.Draw(p)
        y=text(d,(0,0),s['lead'],60,GREEN,True,width=900)
        text(d,(0,y+36),s['detail'],34,MUTED,width=910)
        add(p,80,318,.1)
        add(card(600,400,'FARM → PLAN','Farm constraints\nUnderstandable choices\nFarmer control',BLUE),1190,340,.5)
    elif kind=='constraints':
        p=Image.new('RGBA',(1770,115));text(ImageDraw.Draw(p),(0,0),s['lead'],38,GREEN,True,width=1700);add(p,80,282,.1)
        for j,(title,body) in enumerate([('Water','Irrigation and variable\nwater availability'),('Field','Soil and drainage\nconditions'),('Household','Food needs and help\nat planting and harvest')]):
            add(card(540,265,title,body,BLUE if j==0 else GREEN),80+j*600,459,.3+j*.25)
        p=Image.new('RGBA',(1770,90));text(ImageDraw.Draw(p),(0,0),s['detail'],25,MUTED,width=1760);add(p,80,785,1.2)
    elif kind=='boundary':
        p=Image.new('RGBA',(1700,300));d=ImageDraw.Draw(p)
        text(d,(0,0),s['lead'],64,GREEN,True,width=1700)
        text(d,(0,174),s['detail'],34,MUTED,width=1710,spacing=18);add(p,80,312,.1)
        for j,(title,body) in enumerate([('MOCK','Demonstrate the workflow.'),('REVIEW','Validate the crop rules.'),('EVIDENCE','Integrate NASA observations.')]):
            add(card(540,180,title,body,BLUE if j==0 else GREEN),80+j*600,662,.3+j*.2)
    elif kind=='nasa':
        for j,(title,body,accent) in enumerate([('IMERG','Precipitation estimates\nNASA GPM constellation',BLUE),('POWER','Temperature histories\nMeteorological reanalysis',GOLD),('LOCAL CONTEXT','Reviewed crop windows\nSoil, water and farmer inputs',GREEN)]):
            add(card(540,250,title,body,accent),80+j*600,324,.2+j*.3)
        p=Image.new('RGBA',(1700,220));d=ImageDraw.Draw(p)
        text(d,(0,0),'↓  Reviewed evidence and transparent planning rules',42,GREEN,True)
        text(d,(0,86),'Explainable crop-rotation choices — chosen by the farmer',36,INK,True)
        text(d,(0,148),'Planned architecture · no NASA data API is connected in this demo',27,MUTED)
        add(p,80,640,1.1)
        p=Image.new('RGBA',(1770,60));text(ImageDraw.Draw(p),(0,0),'Sources: gpm.nasa.gov/data/imerg · power.larc.nasa.gov/docs/methodology/meteorology/',23,MUTED);add(p,80,854,1.4)
    elif kind=='limits':
        p=Image.new('RGBA',(1710,420));d=ImageDraw.Draw(p)
        text(d,(0,0),s['lead'],55,GREEN,True,width=1700)
        text(d,(0,118),s['detail'],42,MUTED,width=1700,spacing=22);add(p,80,326,.1)
        add(card(1740,168,'DATA NEEDS PROVENANCE','Product · Units · Time span · Grid footprint · Quality · Local interpretation',BLUE),80,708,.6)
    elif kind=='validation':
        for j,(title,body) in enumerate([('01 / REVIEW','Validate local crop rules\nwith agricultural reviewers.'),('02 / TEST','Test the Bangla workflow\nwith intended farmers.'),('03 / EVALUATE','Assess calendars against\nlocal growing conditions.')]):
            add(card(540,300,title,body),80+j*600,344,.2+j*.3)
        p=Image.new('RGBA',(1760,160));d=ImageDraw.Draw(p)
        text(d,(0,0),'Measured benefits are still an open question.',44,INK,True)
        text(d,(0,74),'No measured water savings, yield changes or soil improvement are claimed.',30,MUTED)
        add(p,80,737,1.2)
    elif kind=='close':
        p=Image.new('RGBA',(1760,490));d=ImageDraw.Draw(p)
        text(d,(0,0),s['lead'],82,GREEN,True)
        text(d,(0,125),'Clear. Explainable. Adaptable.',49,INK,True)
        text(d,(0,220),s['detail'],35,MUTED,width=1710,spacing=17)
        text(d,(0,404),'Concept demonstration · field validation and NASA integration ahead',27,MUTED)
        add(p,80,310,.1)
    return result

def ease(v): return 1-(1-max(0,min(1,v)))**3
def frame(bg,els,t,s):
    im=bg.copy().convert('RGBA')
    for panel,x,y,delay in els:
        e=ease((t-delay)/.85)
        if not e: continue
        layer=panel if e>=1 else panel.copy()
        if e<1: layer.putalpha(layer.getchannel('A').point(lambda a:round(a*e)))
        im.alpha_composite(layer,(x,round(y+26*(1-e))))
    return im.convert('RGB')

renders=OUT/'renders';renders.mkdir(exist_ok=True)
log= open(OUT/'render.log','w',encoding='utf-8')
def run(args): subprocess.run([FF,'-hide_banner','-loglevel','warning','-y',*args],stderr=log,check=True)
preview_dir=OUT/'review';preview_dir.mkdir(exist_ok=True)
if '--boards-only' in sys.argv:
    for s in scenes:
        frame(base(s),elements(s),3,s).save(preview_dir/f"{s['key']}.jpg",quality=88)
    print('Boards saved');sys.exit()

# Native title: crop only the old sample footer, then fit without distortion.
run(['-i',str(OUT/'style-proof.mp4'),'-t','6','-vf','crop=1280:640:0:0,scale=1920:960,pad=1920:1080:0:0:color=0x204635,drawbox=x=0:y=916:w=1920:h=164:color=0x204635:t=fill','-an','-r','24','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',str(renders/'00-native.mp4')])
clips=[renders/'00-native.mp4']
for i,s in enumerate(scenes):
    start=max(6,s['start']) if i==0 else s['start']
    duration=s['end']-start
    assert duration>0
    if '--reuse-scenes' in sys.argv and f'--rerender={s["key"]}' not in sys.argv:
        previous=renders/f"{i+1:02d}-{s['key']}.mp4"
        if s['key']=='3d':previous=renders/f"{i+1:02d}-3d-recorded.mp4"
        if previous.exists():
            clips.append(previous);continue
    bg=base(s);els=elements(s)
    frame(bg,els,3,s).save(preview_dir/f"{s['key']}.jpg",quality=90)
    destination=renders/f"{i+1:02d}-{s['key']}.mp4"
    hold=max(0,duration-2.5)+.2
    command=[FF,'-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','1920x1080','-framerate','12','-i','pipe:0','-vf',f'fps=24,tpad=stop_mode=clone:stop_duration={hold:.6f},fade=t=out:st={max(0,duration-.25):.6f}:d=0.25:color=white','-t',f'{duration:.6f}','-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',str(destination)]
    process=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=log)
    try:
        for n in range(30): process.stdin.write(frame(bg,els,n/12,s).tobytes())
        process.stdin.close()
        assert process.wait()==0,s['key']
    except Exception:
        process.kill();raise
    # Show actual recorded camera interaction in the 3D scene, rather than a
    # fabricated growth animation. Screens elsewhere are exact captured UI.
    if s['key']=='3d':
        moving=renders/f"{i+1:02d}-3d-recorded.mp4"
        run(['-i',str(destination),'-ss','43.2','-i',str(OUT/'captures/real-workflow.webm'),'-filter_complex',f'[1:v]trim=duration=8,setpts=PTS-STARTPTS,crop=1148:653:260:88,scale=1124:640,fps=24,tpad=stop_mode=clone:stop_duration=20[ui];[0:v][ui]overlay=708:268:enable=gte(t\\,1.5)[v]','-map','[v]','-t',str(duration),'-an','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',str(moving)])
        destination=moving
    clips.append(destination);print('Rendered',s['key'],round(duration,3),flush=True)

concat=renders/'concat.txt'
concat.write_text('\n'.join("file '"+p.as_posix()+"'" for p in clips))
run(['-f','concat','-safe','0','-i',str(concat),'-c','copy',str(OUT/'visual-master.mp4')])

# An original quiet ambient score, generated locally. No sampled music or farm recording.
sr=48000;nt=round(total*sr);t=np.arange(nt,dtype=np.float64)/sr
score=np.zeros(nt,dtype=np.float32)
for j,freq in enumerate([220,277.1826,329.6276,415.3047]):
    phase=.08*np.sin(2*np.pi*t/17+j)
    score+=(.003*np.sin(2*np.pi*freq*t+phase)*(1+.22*np.sin(2*np.pi*t/(13+j)))).astype(np.float32)
score*=np.minimum(1,t/3)*np.minimum(1,(total-t)/3)
with wave.open(str(OUT/'ambient-original.wav'),'wb') as dst:
    dst.setnchannels(1);dst.setsampwidth(2);dst.setframerate(sr);dst.writeframes((np.clip(score,-1,1)*32767).astype('<i2').tobytes())
run(['-i',str(OUT/'visual-master.mp4'),'-i',str(OUT/'narration.wav'),'-i',str(OUT/'ambient-original.wav'),'-filter_complex','[1:a]apad[voice];[voice][2:a]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.84:level=false[a]','-map','0:v','-map','[a]','-t',str(total),'-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',str(OUT/'RITU_clean_master.mp4')])
print('CLEAN MASTER',total,flush=True)
log.close()
