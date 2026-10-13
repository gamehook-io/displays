#!/usr/bin/env python3
"""Build offline species gender ratios from the official PokéAPI pokemon_species.csv.

gender_rate is eighths female: -1 genderless, 0 always male, 8 always female.
"""
import csv
import json
import sys
from pathlib import Path

source = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/overlay-pokeapi')
root = Path(__file__).resolve().parents[1]
rates = {row['id']: int(row['gender_rate']) for row in csv.DictReader((source / 'pokemon_species.csv').open()) if int(row['id']) <= 649}
assert len(rates) == 649 and all(rate in (-1, 0, 1, 2, 4, 6, 8) for rate in rates.values())
(root / 'src/pokemon/gender.json').write_text(json.dumps(rates, separators=(',', ':')) + '\n')
