#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Re-encodes project text files to UTF-8.
Creates a .bak copy for each modified file.
"""
import sys
import os
from pathlib import Path

ROOT = Path(r"c:\Users\saif\OneDrive\Bureau\projet pfe\pfe_Saif_Nouri")
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "uploads"}
TEXT_EXTS = {'.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.py', '.env', '.txt', '.yml', '.yaml', '.sql', '.properties', '.json5'}

ENCODINGS_TO_TRY = ['utf-8', 'utf-8-sig', 'cp1252', 'iso-8859-1', 'latin-1', 'cp850']

files_processed = 0
files_converted = 0
errors = []

for path in ROOT.rglob('*'):
    try:
        if path.is_dir():
            # skip excluded dirs
            parts = set(p.lower() for p in path.parts)
            if parts & EXCLUDE_DIRS:
                continue
            else:
                continue
        if path.suffix.lower() not in TEXT_EXTS:
            continue
        # skip files inside excluded dirs
        if any(part in EXCLUDE_DIRS for part in path.parts):
            continue

        files_processed += 1
        original_bytes = path.read_bytes()
        decoded = None
        used_enc = None
        for enc in ENCODINGS_TO_TRY:
            try:
                decoded = original_bytes.decode(enc)
                used_enc = enc
                break
            except Exception:
                decoded = None
                continue
        if decoded is None:
            errors.append((str(path), 'encoding detection failed'))
            continue
        # If already utf-8, skip
        if used_enc in ('utf-8', 'utf-8-sig'):
            continue
        # create backup
        bak_path = path.with_suffix(path.suffix + '.bak')
        if not bak_path.exists():
            path.rename(bak_path)
            bak_path.write_bytes(original_bytes)
            # write decoded content as utf-8
            bak_decoded = decoded
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(bak_decoded)
            files_converted += 1
            print(f"Converted: {path} (from {used_enc})")
        else:
            # if .bak exists, just overwrite original with utf-8
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(decoded)
            files_converted += 1
            print(f"Overwrote: {path} (from {used_enc})")
    except Exception as e:
        errors.append((str(path), str(e)))

print('\nSummary:')
print(f'Files scanned: {files_processed}')
print(f'Files converted: {files_converted}')
print(f'Errors: {len(errors)}')
if errors:
    for p, err in errors[:20]:
        print(f'- {p}: {err}')

print('\nDone')
