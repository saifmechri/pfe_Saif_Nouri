from pathlib import Path
root=Path('.')
exts={'.js','.jsx','.ts','.tsx','.json','.md','.html','.css','.py','.env','.txt','.jsx','.jsx'}
found={}
for p in root.rglob('*'):
    if p.is_file() and p.suffix.lower() in exts:
        try:
            t=p.read_text(encoding='utf-8')
        except Exception:
            continue
        if 'Ã' in t or 'Â' in t or 'â' in t:
            found[str(p)]=sum(t.count(x) for x in ['Ã','Â','â'])
for k in sorted(found.keys()):
    print(f"{k}: {found[k]}")
print('Total files:', len(found))
