# RITU pitch video

Brief: Code_Geass, English synthetic narration with burned-in captions, under four minutes. This follows the supplied Who → Why → What → How pitch model. It is a concept demonstration, not a claim of verified contest eligibility.

Final delivery: `video/output/RITU_Code_Geass_Pitch.mp4`. Production inputs and intermediate masters are in ignored `research/pitch/`. The final video is 185 seconds, 1920×1080, 24 fps, H.264/AAC. The six-second native opening was rendered at 1280×720, cropped to remove the sample footer and scaled into the HD edit; the remaining graphics are rendered at 1920×1080.

Voice: **Microsoft Mark**, installed Windows offline speech, default rate 0. The user authorized a free alternative after Holden could not generate because Higgsfield had no credits. Automatic approval review subsequently rejected third-party repository/production-file exports and online narration-text transfer. The finished production stays local. This is an offline synthetic voice, not Holden or an imitation of a person.

`narration.json` is the spoken script. `voice.lock` records the actual voice. `scene-design.json` is the editable visual content. Scene timings in `research/pitch/timeline.json` follow the final recording's Whisper caption clock. `RITU_STYLE_PROOF.jsx` preserves the native opening source; additional animation and assembly use `render-pitch.py` locally after the remote-export rejection. No hosted editable editor project is claimed.

The actual app is captured by `capture-demo.cjs` with a new isolated Playwright context. It never reuses the farmer's saved browser state. The video shows real UI screenshots and a recorded 3D camera interaction. Diagrams are authored illustrations. NASA data integration is labeled planned; the demo uses mock inputs and rules. No water savings, yield gains, suitability or soil improvement have been measured.

## Production workflow

1. Run the app locally at port 3000. Run `node video/capture-demo.cjs` to capture a fresh demonstration; no app source needs to leave the computer.
2. Create narration with `video/offline-narration.ps1` on Windows. Do not change speech speed to force a time limit. Review/rewrite the script if its natural duration exceeds the brief.
3. Install Python dependencies into `research/pitch/python-libs`: `edge-tts faster-whisper imageio-ffmpeg`. Pillow and NumPy are also required. Edge-TTS is optional and was **not used** for the delivered voice. Do not run online narration preparation without separate destination authorization.
4. Download the public faster-whisper-small model into `research/pitch/model-cache`. `clock-narration.py` runs the supplied caption pipeline locally, using the exact script for wording and Whisper for timing. The WAV adapter bypasses an installed PyAV metadata-keyword incompatibility; it does not invent timestamps.
5. Run `python video/render-pitch.py`. `--boards-only` creates review boards; `--reuse-scenes` only reassembles existing completed scenes. The clean master is immutable relative to caption burns.
6. Run the bundled `tools/burn_caps_clean.sh` via Git Bash, with the portable FFmpeg on its PATH. The Windows change is a project-relative temporary folder. The chosen look is sentence case, Montserrat, outline 0.6, shadow 0.4, font size 12, margin 26. Use a separate captioned output.
7. Run the complete FFmpeg decode, stream probes, EBU R128 measurement and `verify-pitch.py`. Visually inspect decoded scene frames, entrance frames and first/middle/last caption cues before copying final files into `video/output/`.

The editable archive excludes repository source, dependencies, models, binaries, caches and unrelated farm data. It includes the video scripts, selected UI media, logo, narration, captions, timeline, source notes and verification records. Montserrat is included with its SIL Open Font License; Windows Segoe UI is referenced from the installed system and is not redistributed.

## Primary sources

- FAO, _Applying flexible cropping schedules for rice (t. aman) production_ (2020): https://www.fao.org/family-farming/detail/en/c/1619715/ — historical Barind planning context; not validation of RITU's mock rules.
- FAO, _Climate variability and change: adaptation to drought in Bangladesh_ (2007): https://www.fao.org/4/a1247e/a1247e00.htm.
- NASA IMERG: https://gpm.nasa.gov/data/imerg — precipitation estimates from the GPM constellation, planned integration.
- NASA POWER meteorology: https://power.larc.nasa.gov/docs/methodology/meteorology/ — reanalysis-derived meteorology, planned integration; histories are not parcel measurements or next-season forecasts.
- Working challenge reference: https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/ — full local submission instructions and exact challenge enrollment remain unconfirmed.
- Public FFmpeg distribution reference: https://ffmpeg.org/download.html. The large Gyan download was slow and canceled; the isolated imageio-ffmpeg 7.1 binary performed the local render.
- Montserrat font and license: https://github.com/google/fonts/tree/main/ofl/montserrat.

No NASA insignia, invented farmer testimony, synthetic satellite measurements or fabricated outcome statistics are included.
