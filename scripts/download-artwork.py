"""Download official Pokémon artwork (Ken Sugimori style) for every national species.

Usage: python3 scripts/download-artwork.py
Source order per species: PokéAPI official-artwork, then the Pokémon HOME render.
Images are resized to 256×256 WebP with ImageMagick (`convert`) so the bundle stays small.
Species with neither source keep using the bundled game sprites. Existing files are kept.
This is a development-time download; the overlay serves the bundled files without external requests.
"""
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen

root = Path(__file__).resolve().parents[1] / 'src/pokemon/public/assets/pokemon/art'
root.mkdir(parents=True, exist_ok=True)
base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other'
sources = ['official-artwork', 'home']
signature = b'\x89PNG\r\n\x1a\n'

def download(dex):
    target = root / f'{dex}.webp'
    if target.exists() and target.stat().st_size > 0:
        return 'kept'
    for source in sources:
        try:
            with urlopen(f'{base}/{source}/{dex}.png', timeout=30) as response:
                data = response.read()
        except HTTPError as error:
            if error.code == 404:
                continue
            raise
        if not data.startswith(signature):
            continue
        temporary = target.with_suffix('.webp.part')
        subprocess.run(['convert', 'png:-', '-trim', '+repage', '-resize', '256x256', '-background', 'none', '-gravity', 'center', '-extent', '256x256', '-quality', '86', f'webp:{temporary}'], input=data, check=True)
        temporary.replace(target)
        return source
    return 'missing'

with ThreadPoolExecutor(max_workers=12) as pool:
    results = list(pool.map(download, range(1, 1026)))
for kind in ('official-artwork', 'home', 'kept', 'missing'):
    print(kind, results.count(kind))
print('missing species:', [dex for dex, kind in enumerate(results, 1) if kind == 'missing'])
