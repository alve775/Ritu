"""Windows WAV adapter around the unmodified bundled caption pipeline.

Installed PyAV lacks the metadata_errors keyword used by faster-whisper.
Read our PCM WAV with Python instead. Whisper still supplies every word clock.
"""
import pathlib, runpy, sys, wave
import numpy as np
import faster_whisper.transcribe as fw

def decode_pcm(file, sampling_rate=16000, split_stereo=False):
    with wave.open(str(file), 'rb') as src:
        assert src.getsampwidth() == 2 and src.getnchannels() == 1
        rate = src.getframerate()
        data = np.frombuffer(src.readframes(src.getnframes()), dtype='<i2').astype(np.float32) / 32768
    if rate != sampling_rate:
        new_length = round(len(data) * sampling_rate / rate)
        data = np.interp(np.arange(new_length) * rate / sampling_rate, np.arange(len(data)), data).astype(np.float32)
    return data

fw.decode_audio = decode_pcm
runpy.run_path(str(pathlib.Path(__file__).with_name('audio_to_captions.py')), run_name='__main__')
