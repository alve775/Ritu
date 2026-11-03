"""Reuse the original independent NetCDF comparison with a new evidence path.
The earlier script and frozen audit artifacts are never modified.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[2]
original=root/'scripts/audit-packed-calendars.py'
code=original.read_text(encoding='utf8').replace('research/global-audit-2026-11-01/packed-calendar-audit.json','research/recommendation-audit-2026-11-03/packed-calendar-audit.json')
exec(compile(code,str(original),'exec'),{'__file__':str(original),'__name__':'__main__'})
