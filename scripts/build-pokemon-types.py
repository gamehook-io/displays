"""Generate offline typing from PokéAPI's data/v2/csv directory.

Usage: python3 scripts/build-pokemon-types.py /path/to/pokeapi/data/v2/csv
Required files: pokemon.csv, types.csv, pokemon_types.csv, pokemon_types_past.csv.
"""
import csv
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])


def rows(name):
    path = root / f'{name}.csv'
    if not path.exists():
        path = root / f'display-{name}.csv'
    with path.open(newline='') as source:
        return list(csv.DictReader(source))


types = {int(row['id']): row['identifier'] for row in rows('types')}
current = {}
for row in rows('pokemon_types'):
    current.setdefault(int(row['pokemon_id']), {})[int(row['slot'])] = types[int(row['type_id'])]
past = {}
for row in rows('pokemon_types_past'):
    generation = int(row['generation_id'])
    past.setdefault(int(row['pokemon_id']), {}).setdefault(generation, {})[int(row['slot'])] = types[int(row['type_id'])]
result = {}
for row in rows('pokemon'):
    if row['is_default'] != '1':
        continue
    number, dex = int(row['id']), int(row['species_id'])
    entry = {'name': row['identifier'], 'types': [name for _, name in sorted(current[number].items())]}
    if number in past:
        entry['pastTypes'] = {generation: [name for _, name in sorted(slots.items())] for generation, slots in sorted(past[number].items())}
    applicable = [generation for generation in past.get(number, {}) if generation >= 2]
    if dex <= 251 and applicable:
        generation = min(applicable)
        historical = [name for _, name in sorted(past[number][generation].items())]
        if historical != entry['types']:
            entry['crystalTypes'] = historical
    result[dex] = entry
if not all(dex in result for dex in range(1, 252)):
    raise ValueError('Species typing must cover all 251 Crystal species')
Path('src/shared/pokemon/pokemon-types.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'Generated typing for {len(result)} species')
