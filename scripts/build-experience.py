#!/usr/bin/env python3
"""Build offline experience data from official PokéAPI CSV exports."""
import csv
import json
import sys
from pathlib import Path

source = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/overlay-pokeapi')
root = Path(__file__).resolve().parents[1]
rates = {}
for row in csv.DictReader((source / 'experience.csv').open()):
    rates.setdefault(row['growth_rate_id'], [0] * 101)[int(row['level'])] = int(row['experience'])
species = {row['id']: int(row['growth_rate_id']) for row in csv.DictReader((source / 'pokemon_species.csv').open())}
for values in rates.values():
    assert len(values) == 101 and all(values[level + 1] > values[level] for level in range(1, 100))
assert species and all(str(rate) in rates for rate in species.values())
(root / 'src/pokemon/experience.json').write_text(json.dumps({'species': species, 'rates': rates}, separators=(',', ':')) + '\n')
