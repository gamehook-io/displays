"""Download unchanged PokéAPI front sprites for every national species.

Usage: python3 scripts/download-shared-sprites.py
Existing valid PNG files are retained. This is a development-time download;
the overlay serves the bundled files without external requests.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen

root = Path(__file__).resolve().parents[1] / 'src/pokemon/public/assets/pokemon/shared'
root.mkdir(parents=True, exist_ok=True)
signature = b'\x89PNG\r\n\x1a\n'

def download(dex):
    target = root / f'{dex}.png'
    if target.exists() and target.read_bytes().startswith(signature):
        return
    source = f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{dex}.png'
    with urlopen(source, timeout=30) as response:
        data = response.read()
    if not data.startswith(signature):
        raise ValueError(f'Invalid PNG response for species {dex}')
    temporary = target.with_suffix('.png.part')
    temporary.write_bytes(data)
    temporary.replace(target)

with ThreadPoolExecutor(max_workers=8) as pool:
    for count, _ in enumerate(pool.map(download, range(1, 1026)), 1):
        if count % 200 == 0:
            print(f'{count} sprites ready', flush=True)
print('All 1,025 shared front sprites are ready.')
