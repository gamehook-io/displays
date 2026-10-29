"""Generate offline Crystal encounter data from pret/pokecrystal assembly tables.
Usage: python3 scripts/build-crystal-encounters.py /path/to/pokecrystal
"""
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
# Also accept a flat directory containing the downloaded source files.
def source(path):
    return (root / path if (root / path).exists() else root / Path(path).name).read_text()

species = {}
for line in source('constants/pokemon_constants.asm').splitlines():
    match = re.match(r'\s*const\s+(\w+)\s*;', line)
    if match and len(species) < 251:
        species[match[1]] = len(species) + 1
maps = {}
group = index = 0
for line in source('constants/map_constants.asm').splitlines():
    if re.match(r'\s*newgroup\s+', line):
        group += 1
        index = 0
    match = re.match(r'\s*map_const\s+(\w+),', line)
    if match:
        index += 1
        maps[match[1]] = f'{group}:{index}'
result = {}
for region in ['johto', 'kanto']:
    for method, slots, weights in [('grass', 7, [30, 30, 20, 10, 5, 4, 1]), ('water', 3, [60, 30, 10])]:
        text = source(f'data/wild/{region}_{method}.asm')
        for match in re.finditer(rf'def_{method}_wildmons\s+(\w+)(.*?)end_{method}_wildmons', text, re.S):
            rows = [(int(level), species[name]) for level, name in re.findall(r'db\s+(\d+),\s*(\w+)', match[2])]
            expected = slots * (3 if method == 'grass' else 1)
            if len(rows) != expected:
                raise ValueError(f'Unexpected slots for {match[1]}: {len(rows)}')
            entry = result.setdefault(maps[match[1]], {})
            for i, period in enumerate(['Morning', 'Day', 'Night'] if method == 'grass' else ['Surf']):
                entry[period] = [[dex, level, chance] for (level, dex), chance in zip(rows[i * slots:(i + 1) * slots], weights)]

# Fishing tables list cumulative weights. Keep levels and methods; no rounded probability claims.
fish = source('data/wild/fish.asm')
time_rows = re.findall(r'db\s+(\w+),\s*(\d+),\s*(\w+),\s*(\d+)', fish.split('TimeFishGroups:')[1])
fish_tables = {}
labels = list(re.finditer(r'^\.(\w+):', fish, re.M))
for i, match in enumerate(labels):
    label = match[1]
    body = fish[match.end():labels[i + 1].start() if i + 1 < len(labels) else fish.index('TimeFishGroups:')]
    rows = []
    for line in body.splitlines():
        match = re.search(r',\s*(\w+),\s*(\d+)', line)
        timed = re.search(r'time_group\s+(\d+)', line)
        if match and match[1] in species:
            rows.append({'dex': species[match[1]], 'level': int(match[2])})
        elif timed:
            day, day_level, night, night_level = time_rows[int(timed[1])]
            rows.append({'day': [species[day], int(day_level)], 'night': [species[night], int(night_level)]})
    fish_tables[label] = rows
for i in range(len(labels) - 2, -1, -1):
    if not fish_tables[labels[i][1]]:
        fish_tables[labels[i][1]] = fish_tables[labels[i + 1][1]]
fish_groups = {}
for old, good, super_rod in re.findall(r'fishgroup[^\n]*?,\s*\.(\w+),\s*\.(\w+),\s*\.(\w+)', fish):
    name = old[:-4].upper().replace('WHIRLISLANDS', 'WHIRL_ISLANDS')
    fish_groups[name] = {'Old Rod': fish_tables[old], 'Good Rod': fish_tables[good], 'Super Rod': fish_tables[super_rod]}
group = index = 0
for line in source('data/maps/maps.asm').splitlines():
    if re.match(r'MapGroup_\w+:', line):
        group += 1
        index = 0
    match = re.match(r'\s*map\s+[^,]+,.*FISHGROUP_(\w+)', line)
    if match:
        index += 1
        key = f'{group}:{index}'
        # Water encounter tables identify maps with usable water; don't offer indoor/default fishing groups.
        if key in result and 'Surf' in result[key] and match[1] in fish_groups:
            result[key]['Fishing'] = fish_groups[match[1]]

# Grass swarms override the normal slots when the mapper's swarm flag is set.
text = source('data/wild/swarm_grass.asm')
for match in re.finditer(r'map_id\s+(\w+)(.*?)(?=\n\s*map_id|\n\s*db -1)', text, re.S):
    rows = [(int(level), species[name]) for level, name in re.findall(r'db\s+(\d+),\s*(\w+)', match[2])]
    if len(rows) != 21:
        raise ValueError('Unexpected swarm slots')
    flag = 'yanma_swarm' if match[1] == 'ROUTE_35' else 'dunsparce_swarm'
    entry = result.setdefault(maps[match[1]], {})
    entry['Swarm'] = {'flag': flag, **{period: [[dex, level, chance] for (level, dex), chance in zip(rows[i*7:(i+1)*7], [30,30,20,10,5,4,1])] for i, period in enumerate(['Morning','Day','Night'])}}
Path('src/shared/pokemon/crystal-encounters.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'Generated {len(result)} Crystal encounter maps')
