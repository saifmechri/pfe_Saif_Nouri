from pathlib import Path

ROOT = Path(__file__).resolve().parent
ROOTS = [ROOT / 'frontend' / 'src', ROOT / 'backend']
EXCLUDE_PARTS = {'node_modules', 'dist', 'build', 'uploads'}
INCLUDE_EXTS = {'.js', '.jsx', '.ts', '.tsx', '.json', '.md'}

REPL = {
    'âœ“': '✅',
    'âœ•': '❌',
    'â³': '⏳',
    'â€”': '—',
    'Â·': '·',
    'â€¹': '‹',
        'âœ…': '✅',
        'â¸ï¸': '⏸️',
    'â€º': '›',
    'â†’': '→',
    'ðŸª': '🏪',
    'ðŸ’¸': '💸',
    'ðŸŸ§': '🟧',
    'ðŸ’¬': '💬',
    'ðŸ”': '🔍',
        'ðŸ‘¤': '👤',
        'ðŸ¢': '🏢',
        'ðŸ“‹': '📋',
        'ðŸ”„': '🔄',
        'ðŸ””': '🔔',
        'ðŸ—‘ï¸': '🗑️',
    'ðŸ”§': '🔧',
    'ðŸ“¦': '📦',
    'ðŸ“ž': '📞',
        'â†': '←',
    'ðŸ“…': '📅',
    'ðŸš—': '🚗',
    'ðŸš˜': '🚘',
        'Ã”': 'Ô',
    'ðŸš™': '🚙',
    'ðŸš©': '🚩',
    'ðŸ› ': '🛠',
    'ðŸ›‘': '🛑',
        'RÃ”LE': 'RÔLE',
        'BIENTÃ”T': 'BIENTÔT',
        'Ã—': '×',
        'ï¸': '️',
    'ðŸª‘': '🪑',
    'ðŸ§©': '🧩',
    'ðŸ§°': '🧰',
    'ðŸ§´': '🧴',
    'ðŸ”‹': '🔋',
    'âš™': '⚙',
    'âš ': '⚠',
    'â„': '❄',
    'â­': '⭐',
    'â­•': '⭕',
    'â“˜': 'ⓘ',
    'ðŸ·': '🏷',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ã¤': 'ä',
    'Ã§': 'ç',
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã«': 'ë',
    'Ã®': 'î',
    'Ã¯': 'ï',
    'Ã´': 'ô',
    'Ã¶': 'ö',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã¼': 'ü',
    'Ã±': 'ñ',
    'PrÃªt': 'Prêt',
    'prÃªt': 'prêt',
    'dÃ©jÃ ': 'déjà',
    'Ãªtre': 'être',
    'Ã ': 'à ',
}


def should_skip(path: Path) -> bool:
    if any(part in EXCLUDE_PARTS for part in path.parts):
        return True
    if path.name.endswith('.bak'):
        return True
    if path.suffix.lower() not in INCLUDE_EXTS:
        return True
    return False


def main():
    changed = 0
    scanned = 0
    for root in ROOTS:
        if not root.exists():
            continue
        for p in root.rglob('*'):
            if not p.is_file() or should_skip(p):
                continue
            scanned += 1
            try:
                text = p.read_text(encoding='utf-8')
            except Exception:
                continue
            new_text = text
            for old, new in REPL.items():
                new_text = new_text.replace(old, new)
            if new_text != text:
                p.write_text(new_text, encoding='utf-8')
                changed += 1
                print(f'Fixed: {p.relative_to(ROOT)}')

    print(f'\nScanned: {scanned}')
    print(f'Changed: {changed}')


if __name__ == '__main__':
    main()
