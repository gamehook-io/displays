"""Generate offline move types from a local pret/pokecrystal checkout.

Usage: python3 scripts/build-crystal-moves.py /path/to/pokecrystal
A flat directory containing moves.asm is also accepted.
"""
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
source = root / 'data/moves/moves.asm'
if not source.exists():
    source = root / 'moves.asm'
rows = re.findall(r'^\s*move\s+(\w+),\s*\w+,\s*\d+,\s*(\w+),', source.read_text(), re.M)
if len(rows) != 251:
    raise ValueError(f'Expected 251 Crystal moves, found {len(rows)}')
result = [{'name': name.replace('_', '').lower(), 'type': move_type.removesuffix('_TYPE').lower()} for name, move_type in rows]
Path('src/shared/pokemon/crystal-moves.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'Generated {len(result)} Crystal move types')
