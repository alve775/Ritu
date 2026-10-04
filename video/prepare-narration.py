"""Optional online voice alternative, NOT used in the delivered pitch.

Needs separate approval to send narration text to the Edge speech destination.
Use offline-narration.ps1 for the completed local production.
"""
import asyncio
import json
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'research/pitch'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(OUT / 'python-libs'))
import edge_tts

data = json.loads((ROOT / 'video/narration.json').read_text(encoding='utf-8'))
speech = '\n\n'.join(c['text'] for c in data['chunks'])
captions = speech.replace('Ritu', 'RITU')
(OUT / 'speech.txt').write_text(speech, encoding='utf-8')
(OUT / 'script_manifest.json').write_text(json.dumps({'blocks': [{'vo_line': captions}]}), encoding='utf-8')

async def main():
    await edge_tts.Communicate(speech, 'en-US-AndrewNeural').save(str(OUT / 'narration.mp3'))
asyncio.run(main())
subprocess.run(['ffmpeg', '-y', '-v', 'warning', '-i', str(OUT / 'narration.mp3'), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '1', str(OUT / 'narration.wav')], check=True)
duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(OUT / 'narration.wav')]))
assert duration < 239, f'Natural narration exceeds brief: {duration}'
print('Natural narration seconds:', duration, flush=True)
os.environ['HF_HOME'] = str(OUT / 'model-cache')
os.environ['PYTHONPATH'] = str(OUT / 'python-libs')
# Force local STT; never send recorded audio to an API.
os.environ.pop('OPENAI_API_KEY', None)
os.environ.pop('VOICE_TOOLS_OPENAI_KEY', None)
subprocess.run([sys.executable, str(ROOT / 'video/tools/audio_to_captions.py'), str(OUT / 'narration.wav'), '--srt', str(OUT / 'caps.srt'), '--json', str(OUT / 'word-clock.json'), '--script', str(OUT / 'script_manifest.json'), '--language', 'en'], check=True)
(OUT / 'voice-receipt.json').write_text(json.dumps({'provider': 'Edge-TTS', 'voice': 'en-US-AndrewNeural', 'duration': duration, 'rate': 'natural default', 'transcription': 'local faster-whisper', 'scriptUpload': 'narration text to speech service only; no repository or production archive uploaded'}, indent=2), encoding='utf-8')
