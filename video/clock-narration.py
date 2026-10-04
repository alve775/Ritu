"""Run bundled Whisper alignment entirely locally; network only downloads public model."""
import json, os, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'research/pitch'
bin_dir = next((out / 'toolchain').glob('*/bin'), None)
if bin_dir:
    os.environ['PATH'] = str(bin_dir) + os.pathsep + os.environ['PATH']
os.environ['PYTHONPATH'] = str(out / 'python-libs')
os.environ['HF_HOME'] = str(out / 'model-cache')
os.environ.pop('OPENAI_API_KEY', None)
os.environ.pop('VOICE_TOOLS_OPENAI_KEY', None)
duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(out / 'narration.wav')]))
assert duration < 239, duration
print('Natural offline narration:', duration, flush=True)
model = next((out / 'model-cache/models--Systran--faster-whisper-small/snapshots').iterdir())
subprocess.run([sys.executable, str(root / 'video/tools/local_caption_clock.py'), str(out / 'narration.wav'), '--srt', str(out / 'caps.srt'), '--json', str(out / 'word-clock.json'), '--script', str(out / 'script_manifest.json'), '--language', 'en', '--model', str(model), '--minimum-similarity', '0.90'], check=True)
(out / 'voice-receipt.json').write_text(json.dumps({'provider': 'Windows offline speech', 'voice': 'Microsoft Mark', 'duration': duration, 'rate': 0, 'transcription': 'local faster-whisper', 'contentExported': False}, indent=2))
