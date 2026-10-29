"""Generate generation-specific move typing from PokéAPI CSV sources."""
import csv
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
def rows(name):
    with (root / f'{name}.csv').open(newline='') as stream:
        return list(csv.DictReader(stream))
types = {row['id']: row['identifier'] for row in rows('types')}
versions = {row['id']: int(row['generation_id']) for row in rows('version_groups')}
changes = {}
for row in rows('move_changelog'):
    if row['type_id']:
        changes.setdefault(row['move_id'], []).append((versions[row['changed_in_version_group_id']], types[row['type_id']]))
result = {}
for row in rows('moves'):
    entry = {'name': row['identifier'].replace('-', ''), 'type': types[row['type_id']], 'generation': int(row['generation_id'])}
    past = sorted(changes.get(row['id'], []))
    if past:
        entry['past'] = past
    result[row['id']] = entry
Path('src/shared/pokemon/move-types.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'Generated {len(result)} move types')
