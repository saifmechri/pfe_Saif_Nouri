#!/usr/bin/env python3
import re
from pathlib import Path
ROOT = Path('.')
frontend = ROOT / 'frontend'
backend = ROOT / 'backend'
output = ROOT / 'README_DOCUMENTATION.md'

pages_dir = frontend / 'src' / 'pages'
components_dir = frontend / 'src' / 'components'
hooks_dir = frontend / 'src' / 'hooks'
services_dir = frontend / 'src' / 'services'
api_services_dir = services_dir

# helper
def list_jsx_files(d):
    if not d.exists():
        return []
    return sorted([p for p in d.rglob('*.jsx')] + [p for p in d.rglob('*.js')])

pages = list_jsx_files(pages_dir)
components = list_jsx_files(components_dir)
hooks = list_jsx_files(hooks_dir)
services = list_jsx_files(services_dir)

# read routes from frontend router if exists
app_router = frontend / 'src' / 'routes' / 'AppRouter.jsx'
routes_map = {}
if app_router.exists():
    text = app_router.read_text(encoding='utf-8', errors='ignore')
    # find <Route path="/..." element={...} or path='/..'
    for m in re.finditer(r"<Route\s+[^>]*path=\{?['\"]([^'\"]+)['\"]\}?[^>]*element=\{?([^\}/>\s]+)", text):
        path = m.group(1)
        comp = m.group(2).strip()
        routes_map[comp] = path

# backend routes
backend_routes = list(backend.glob('routes/*.js')) if backend.exists() else []
route_endpoints = {}
for r in backend_routes:
    txt = r.read_text(encoding='utf-8', errors='ignore')
    # find router.use('/auth', authRouter) or router.get('/path', ...)
    base = None
    # try require controller imports
    imports = re.findall(r"require\(['\"]\./?([^'\"]+)['\"]\)", txt)
    methods = re.findall(r"\.(get|post|put|delete|patch)\(['\"]([^'\"]+)['\"]", txt)
    route_endpoints[r.name] = {'methods': methods, 'imports': imports}

# controllers mapping
controllers = list(backend.glob('controllers/*.js')) if backend.exists() else []
controller_content = {c.name: c.read_text(encoding='utf-8', errors='ignore') for c in controllers}

# models/services/middlewares
models = list(backend.glob('models/*.js')) if backend.exists() else []
services_b = list(backend.glob('services/*.js')) if backend.exists() else []
middlewares = list(backend.glob('middlewares/*.js')) if backend.exists() else []

# prepare README
lines = []
lines.append('# Documentation des pages et APIs')
lines.append('\n')

# For each page file, extract imports
for p in pages:
    name = p.stem
    display = f'# {name}'
    lines.append(display)
    lines.append('\n## Frontend\n')
    rel = p.relative_to(frontend / 'src')
    lines.append(f'* src/{rel}')
    # extract imports
    txt = p.read_text(encoding='utf-8', errors='ignore')
    imps = re.findall(r"from\s+['\"](\.\./[^'\"]+)['\"]", txt)
    # expand relative imports to possible component paths
    linked = []
    for imp in imps:
        # find in components
        candidate = (p.parent / imp).with_suffix('.jsx')
        if candidate.exists():
            linked.append(candidate.relative_to(frontend / 'src'))
        else:
            candidate_js = (p.parent / imp).with_suffix('.js')
            if candidate_js.exists():
                linked.append(candidate_js.relative_to(frontend / 'src'))
    # add components list
    if linked:
        for l in linked:
            lines.append(f'* src/{l}')
    # services and hooks imports
    svc_imps = re.findall(r"from\s+['\"](.*services/[^'\"]+)['\"]", txt)
    hook_imps = re.findall(r"from\s+['\"](.*hooks/[^'\"]+)['\"]", txt)
    if svc_imps:
        lines.append('\n## Services/Api\n')
        for s in svc_imps:
            lines.append(f'* src/{s}')
    if hook_imps:
        lines.append('\n## Hooks/Context\n')
        for h in hook_imps:
            lines.append(f'* src/{h}')
    # backend links: look for fetch or axios calls
    apis = re.findall(r"(fetch\(|axios\.\w+\(|/api/[^'\")\s]+)", txt)
    if apis:
        lines.append('\n## APIs\n')
        for a in set(apis):
            lines.append(f'* {a}')
    lines.append('\n## Description\n')
    # short description: take first comment or header
    m = re.search(r"/\*\*([\s\S]{0,200})\*/", txt)
    if m:
        desc = m.group(1).strip().split('\n')[0].strip()
        lines.append(desc)
    else:
        # try first paragraph
        lines.append('Interface page.')
    lines.append('\n---\n')

# Backend routes summary
lines.append('# Backend routes\n')
for rname, info in route_endpoints.items():
    lines.append(f'* routes/{rname}')
    if info['methods']:
        for m in info['methods']:
            lines.append(f'  - {m[0].upper()} {m[1]}')
    if info['imports']:
        for imp in info['imports']:
            lines.append(f'  - imports: {imp}')

# DB tables guess: scan for common table names in backend
db_candidates = set()
for f in backend.rglob('*.js'):
    try:
        t=f.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        continue
    for token in ['users','appointments','garages','interventions','maintenance','recommendations','pieces','messages','chats','profiles']:
        if token in t:
            db_candidates.add(token)
lines.append('\n# Probables tables/collections\n')
for t in sorted(db_candidates):
    lines.append(f'* {t}')

# write file
output.write_text('\n'.join(lines), encoding='utf-8')
print('README_DOCUMENTATION.md generated')
