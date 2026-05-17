#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Partial mojibake fixer: find runs of Latin-1 high-chars and try to decode each run from latin-1->utf-8.
Creates .bak files.
"""
import re
from pathlib import Path

ROOT = Path(r"c:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri")
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "uploads"}
TEXT_EXTS = {'.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.py', '.env', '.txt', '.yml', '.yaml', '.sql', '.properties', '.json5'}

pattern = re.compile(r'([\u00A0-\u00FF]{2,})')

files_scanned = 0
files_changed = 0

for path in ROOT.rglob('*'):
    if path.is_dir():
        continue
    if path.suffix.lower() not in TEXT_EXTS:
        continue
    if any(part in EXCLUDE_DIRS for part in path.parts):
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    if 'Ã' not in text and 'Â' not in text and 'â' not in text:
        continue
    files_scanned += 1
    original = text
    def repl(m):
        s = m.group(1)
        try:
            fixed = s.encode('latin-1').decode('utf-8')
        except Exception:
            return s
        # Only accept if fixed contains at least one ASCII letter or common accented char
        if re.search(r'[A-Za-zÀ-ÖØ-öø-ÿ]', fixed):
            return fixed
        return s
    new_text = pattern.sub(repl, text)
    if new_text != original:
        bak = path.with_suffix(path.suffix + '.bak')
        if not bak.exists():
            path.replace(bak)
            bak.write_text(original, encoding='utf-8')
            path.write_text(new_text, encoding='utf-8')
        else:
            path.write_text(new_text, encoding='utf-8')
        files_changed += 1
        print(f"Patched: {path}")

print('\nScanned files with mojibake candidates:', files_scanned)
print('Files changed:', files_changed)
print('Done')
