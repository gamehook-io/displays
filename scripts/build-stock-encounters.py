"""Bundle ordinary route encounters for games whose mappers lack live tables.

Uses PokéAPI CSV data. Paired ROM versions remain separate. Nondefault special
conditions are excluded; time variants are selected at runtime.
"""
import csv
import json
import sys
from pathlib import Path
root = Path(sys.argv[1])
def rows(name):
    with (root / f'{name}.csv').open(newline='') as stream:
        return list(csv.DictReader(stream))
allowed = {'gold', 'silver', 'ruby', 'sapphire', 'emerald', 'firered', 'leafgreen'}
versions = {row['id']: row['identifier'] for row in rows('versions') if row['identifier'] in allowed}
names = {row['location_id']: row['name'] for row in rows('location_names') if row['local_language_id'] == '9'}
areas = {row['id']: names.get(row['location_id'], '') for row in rows('location_areas') if not row['identifier']}
methods = {row['id']: row['identifier'] for row in rows('encounter_methods')}
labels = {'walk': 'Grass', 'surf': 'Surf', 'old-rod': 'Old Rod', 'good-rod': 'Good Rod', 'super-rod': 'Super Rod'}
slots = {row['id']: (labels.get(methods[row['encounter_method_id']]), int(row['rarity'])) for row in rows('encounter_slots')}
conditions = {row['id']: row for row in rows('encounter_condition_values')}
constraints = {}
for row in rows('encounter_condition_value_map'):
    constraints.setdefault(row['encounter_id'], []).append(conditions[row['encounter_condition_value_id']])
result = {}
for row in rows('encounters'):
    version, location = versions.get(row['version_id']), areas.get(row['location_area_id'], '')
    method, chance = slots[row['encounter_slot_id']]
    if not version or not method or 'Route ' not in location:
        continue
    required = constraints.get(row['id'], [])
    if any(item['is_default'] != '1' and not item['identifier'].startswith('time-') for item in required):
        continue
    period = next((item['identifier'][5:].title() for item in required if item['identifier'].startswith('time-')), 'Any')
    route = location[location.index('Route '):].lower().replace(' ', '')
    entry = [int(row['pokemon_id']), int(row['min_level']), int(row['max_level']), method, chance, period]
    result.setdefault(version, {}).setdefault(route, []).append(entry)
Path('src/pokemon/games/stock-encounters.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print('Generated route tables:', {version: len(routes) for version, routes in result.items()})
