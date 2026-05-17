#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix mojibake by reinterpreting file text as latin-1 bytes then decoding as utf-8.
Creates .bak copies before overwriting.
"""
from pathlib import Path
import sys

ROOT = Path(r"c:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri")
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "uploads"}
TEXT_EXTS = {'.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.py', '.env', '.txt', '.yml', '.yaml', '.sql', '.properties', '.json5'}

files_scanned = 0
files_fixed = 0
errors = []

for path in ROOT.rglob('*'):
    try:
        if path.is_dir():
            continue
        if path.suffix.lower() not in TEXT_EXTS:
            continue
        if any(part in EXCLUDE_DIRS for part in path.parts):
            continue
        files_scanned += 1
        text = None
        try:
            text = path.read_text(encoding='utf-8')
        except Exception:
            # skip files not utf-8
            continue
        if 'Ã' not in text and 'Â' not in text and 'â' not in text:
            continue
        # attempt latin1->utf8 fix
        try:
            fixed = text.encode('latin-1').decode('utf-8')
        except Exception as e:
            errors.append((str(path), f'convert failed: {e}'))
            continue
        # Heuristic: ensure resulting text has fewer mojibake markers
        bad_before = sum(text.count(x) for x in ['Ã', 'Â', 'â'])
        bad_after = sum(fixed.count(x) for x in ['Ã', 'Â', 'â'])
        if bad_after <= bad_before:
            # backup
            bak = path.with_suffix(path.suffix + '.bak')
            if not bak.exists():
                path.replace(bak)
                bak.write_text(text, encoding='utf-8')
                path.write_text(fixed, encoding='utf-8')
            else:
                path.write_text(fixed, encoding='utf-8')
            files_fixed += 1
            print(f"Fixed: {path} (bad before {bad_before}, after {bad_after})")
    except Exception as e:
        errors.append((str(path), str(e)))

print('\nSummary:')
print(f'Scanned: {files_scanned}')
print(f'Fixed: {files_fixed}')
print(f'Errors: {len(errors)}')
if errors:
    for p, e in errors[:20]:
        print(f'- {p}: {e}')
print('\nDone')
