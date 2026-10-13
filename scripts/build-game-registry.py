"""Generate game adapters from the installed Gamehook mapper definitions.

Usage: python3 scripts/build-game-registry.py /workspace/mappers/dist
"""
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

versions = {
    'red_blue': ['red', 'blue'], 'yellow': ['yellow'],
    'gold_silver': ['gold', 'silver'], 'crystal': ['crystal'],
    'ruby_sapphire': ['ruby', 'sapphire'], 'emerald': ['emerald'],
    'firered_leafgreen': ['firered', 'leafgreen'],
    'diamond_pearl': ['diamond', 'pearl'], 'platinum': ['platinum'],
    'heartgold_soulsilver': ['heartgold', 'soulsilver'],
    'black': ['black'], 'white': ['white'], 'black_2': ['black-2'], 'white_2': ['white-2'],
}
regions = {1: 'Kanto', 2: 'Johto', 3: 'Hoenn', 4: 'Sinnoh', 5: 'Unova'}
result = {}
for path in sorted(Path(sys.argv[1]).glob('*/pokemon*.xml')):
    key = path.stem.removeprefix('pokemon_')
    if key not in versions:
        continue
    root = ET.parse(path).getroot()
    properties = root.find('properties')
    generation = int(next(node for node in properties.find('meta') if node.get('name') == 'generation').get('value'))
    player = properties.find('player')
    direct = any(node.tag == 'macro' and node.get('name') == 'active_pokemon' for node in player)
    badges = []
    for node in player.find('badges'):
        name = node.get('description', '').lower().removesuffix('badge').strip()
        badges.append({'index': int(node.get('name')), 'name': name.capitalize()})
    flag = 'battle.battle_flags.trainer' if key == 'ruby_sapphire' else 'battle.flags.trainer' if generation == 3 else None
    region = 'Kanto' if key == 'firered_leafgreen' else 'Johto' if key == 'heartgold_soulsilver' else regions[generation]
    result[key] = {
        'key': key, 'id': root.get('id'), 'name': root.get('name'),
        'platform': root.get('platform'), 'nativeProcessor': root.get('nativeProcessor'),
        'generation': generation, 'versions': versions[key], 'region': region,
        'activeSource': 'direct' if direct else 'party', 'trainerFlag': flag, 'badges': badges,
    }
if len(result) != len(versions):
    raise ValueError('A required Pokémon mapper is missing')
target = Path('src/pokemon/games/registry.json')
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(result, indent=2) + '\n')
print(f'Generated {len(result)} mapper families, {sum(len(game["versions"]) for game in result.values())} releases')
