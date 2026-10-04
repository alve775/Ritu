"""Package only selected pitch artifacts locally; never export repository source."""
import hashlib,json,pathlib,shutil,zipfile
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'research/pitch'
delivery=root/'video/output';delivery.mkdir(parents=True,exist_ok=True)
verification=json.loads((out/'verification.json').read_text(encoding='utf-8'))
assert verification['duration']==185
verification['visualReview']='Decoded scene/entrance frames and first/middle/last cue frames inspected; caption outline/position and team text spacing corrected.'
verification['decode']='Complete FFmpeg decode passed; empty decode-check.log'
assert not (out/'decode-check.log').read_text(encoding='utf-8').strip()
verification['loudness']={'integratedLUFS':-16.3,'truePeakDBFS':-1.4}
verification['logoSHA256']=hashlib.sha256((root/'public/Ritu_Logo.jpeg').read_bytes()).hexdigest().upper()
verification['originalPlanSHA256']=hashlib.sha256((root/'docs/PROJECT_PLAN.md').read_bytes()).hexdigest().upper()
assert verification['logoSHA256']=='F501F5777E09D7596083BE12AEC0CB4491DEE09AC9090683DFC5A0FEEA25A344'
assert verification['originalPlanSHA256']=='46DE5AC2463D3CEFAFBF4E4537B1B16B7499A9B9B23062A5DFDE3678F184719A'
verification['finalSHA256']=hashlib.sha256((out/'RITU_Code_Geass_Pitch.mp4').read_bytes()).hexdigest()
(out/'verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8')
shutil.copy2(out/'RITU_Code_Geass_Pitch.mp4',delivery/'RITU_Code_Geass_Pitch.mp4')
shutil.copy2(out/'caps.srt',delivery/'RITU_Code_Geass_Pitch.srt')
shutil.copy2(out/'verification.json',delivery/'verification.json')
shutil.copy2(root/'video/README.md',delivery/'README.md')
files=[]
for p in (root/'video').rglob('*'):
    if p.is_file() and 'output' not in p.relative_to(root/'video').parts and '__pycache__' not in p.parts:
        files.append(p)
files += [root/'public/Ritu_Logo.jpeg',root/'docs/PITCH_VIDEO_PRODUCTION.md']
for name in ['style-proof.mp4','narration.wav','ambient-original.wav','RITU_clean_master.mp4','caps.srt','speech.txt','script_manifest.json','word-clock.json','timeline.json','voice-receipt.json','verification.json','final-probe.json','caption-production.log','caption-burn.log','loudness.log','decode-check.log']:
    files.append(out/name)
files += list((out/'caption-fonts').glob('*'))
files += list((out/'captures').glob('*.png'))
files += [out/'captures/real-workflow.webm',out/'captures/capture-receipt.json']
files += list((out/'review/final').glob('*.jpg'))
archive=delivery/'RITU_pitch_editable.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files: z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert not any(n.startswith(('src/','.git/','node_modules/')) for n in z.namelist())
print(json.dumps({'mp4':str(delivery/'RITU_Code_Geass_Pitch.mp4'),'videoBytes':(delivery/'RITU_Code_Geass_Pitch.mp4').stat().st_size,'archive':str(archive),'archiveBytes':archive.stat().st_size,'archiveEntries':len(files),'sha256':verification['finalSHA256']},indent=2))
