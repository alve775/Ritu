"""Verify final exported evidence against retained source/audit checkpoints, offline."""
from pathlib import Path
import csv
import hashlib
import json
from datetime import datetime, timezone
from PIL import Image
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
folder = root / 'research/global-audit-2026-11-01'

def read(file):
    return json.loads(Path(file).read_text(encoding='utf-8-sig'))

summary = read(root / 'output/audit/RITU_Audit_Summary.json')
assert summary['matrixComplete'] and summary['setupEvaluations'] == 263160
assert summary['unitApi']['success'] and summary['unitApi']['passed'] == 495
assert summary['browser']['finished'] and summary['browser']['passed'] == 720
assert summary['photoAudit']['complete'], 'Do not publish an incomplete image pass as completed.'
assert sum(summary['screeningGaps'].values()) == 714
catalogue = {p['id']: p for p in read(root / 'src/data/global/plant-catalogue.json')}
assert len(catalogue) == 2562
photos = read(folder / 'api-coverage-full.json')
assert photos['finishedAt']
latest = {p['id']: p for p in photos['results']}
for name in ['image-delivery-refresh.json', 'image-subject-review.json']:
    for row in read(folder / name)['results']:
        if row['checkedAt'] > latest[row['id']]['checkedAt']:
            latest[row['id']] = {**latest[row['id']], **row}
assert latest.keys() == catalogue.keys()
checked_images = 0
for plant_id, row in latest.items():
    assert row['status'] in ['available', 'unavailable'], (plant_id, row['status'])
    if row['status'] != 'available':
        continue
    photo = row['photo']
    assert photo['scientific'] == catalogue[plant_id]['scientific']
    assert len(photo['matchedScientific'].split()) >= 2
    assert photo['source'].startswith('https://commons.wikimedia.org/wiki/File:')
    assert photo['entity'].startswith('https://www.wikidata.org/wiki/Q')
    assert all(photo[key] for key in ['license', 'licenseUrl', 'author'])
    asset = row['asset']
    file = root / asset['file']
    assert hashlib.sha256(file.read_bytes()).hexdigest() == asset['sha256'], plant_id
    with Image.open(file) as image:
        assert image.width == asset['width'] and image.height == asset['height']
        image.verify()
    with Image.open(file) as image:
        image.load()  # Force complete pixel decoding, beyond headers/container validation.
    checked_images += 1
with (root / 'output/audit/RITU_Plant_Audit.csv').open(encoding='utf-8-sig', newline='') as stream:
    exported = list(csv.DictReader(stream))
assert len(exported) == 2562
assert {r['id'] for r in exported} == catalogue.keys()
for row in exported:
    assert row['scientific'] == catalogue[row['id']]['scientific']
    assert row['photoStatus'] == latest[row['id']]['status']
pdf = root / 'output/pdf/RITU_Worldwide_Verification_and_Farm_Walkthrough.pdf'
document = PdfReader(pdf)
assert len(document.pages) == 10
assert '495' in document.pages[0].extract_text()
assert summary['photoAudit']['currentEvidenceCounts']['available'] == checked_images
assert summary['liveProduction']['checks'] == 8
report = {
    'checkedAt': datetime.now(timezone.utc).isoformat(),
    'passed': True,
    'catalogueRows': len(catalogue),
    'exportedRows': len(exported),
    'availablePhotosRehashedAndDecoded': checked_images,
    'unavailablePhotos': len(latest) - checked_images,
    'pdfPages': len(document.pages),
    'pdfSha256': hashlib.sha256(pdf.read_bytes()).hexdigest(),
    'csvSha256': hashlib.sha256((root / 'output/audit/RITU_Plant_Audit.csv').read_bytes()).hexdigest(),
    'scope': 'Evidence consistency and file integrity; not agronomic or botanical certification',
}
(folder / 'final-artifact-verification.json').write_text(json.dumps(report, indent=2))
(root / 'output/audit/RITU_Artifact_Verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
