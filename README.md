# Gamehook Displays

Gamehook Displays are browser pages hosted at https://displays.gamehook.io/. Two kinds share one Vite project, one Gamehook connection layer, and one set of components: **stream overlays** (transparent, display-only, for OBS) and **bottom screens** (interactive touch-style menus). Build transparent, display-only browser overlays with JavaScript, Vite, and SolidJS. Gamehook supplies live game data; the overlay displays it above a separate game capture in OBS or another streaming application.

Keep authoring work in `src/stream-overlays/pokemon/`. The framework handles connections, updates, loading state, and viewport scaling.

Open `/stream-overlays/dragon-warrior-1/` for live data or `/stream-overlays/dragon-warrior-1/?demo=1` for its preview. Pokémon lives at `/stream-overlays/pokemon/`. Each scene builds its own HTML file and JavaScript entry.

## Start development

Requirements: Node.js **22.12 or newer**, npm, and Gamehook with a compatible driver and mapper.

```sh
cd displays
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/stream-overlays/pokemon/** or **http://127.0.0.1:5173/stream-overlays/dragon-warrior-1/**. In Gamehook, connect the driver, load your mapper, and enable continuous read mode. Configure its HTTP origin and instance in `src/stream-overlays/pokemon/config.js`.

The default Gamehook origin is `http://127.0.0.1:61358`, instance `0`. The browser connects straight to Gamehook on the same machine (REST and WebSocket); there is no proxy. Change `gamehookUrl` in `src/shared/config.js` if Gamehook listens on another port. Widgets do not need their own network clients.

## Project structure

| Location | Responsibility |
| --- | --- |
| `src/index.html` | Static landing page listing every display. |
| `src/stream-overlays/<name>/` | One self-contained folder per stream overlay (`pokemon/`, `dragon-warrior-1/`), served at `/stream-overlays/<name>/`. |
| `src/bottom-screens/<name>/` | One folder per interactive bottom screen (`pokemon/`), served at `/bottom-screens/<name>/`. |
| `src/<kind>/<name>/main.jsx` | Mount the display with its provider, scene, connection boundary, and global indicator. |
| `src/stream-overlays/pokemon/Overlay.jsx` | Arrange the overlay using HTML-like JSX and small components. |
| `src/stream-overlays/pokemon/components/` | Pokémon display widgets and mapper bindings. |
| `src/stream-overlays/dragon-warrior-1/` | NES Dragon Warrior scene, native mapper bindings, theme, and fixtures. |
| `src/stream-overlays/pokemon/style.css` | Positioning, spacing, typography, and colors. |
| `src/stream-overlays/pokemon/config.js` | Connection, canvas dimensions, and author options. |
| `src/stream-overlays/pokemon/demo.js` | Explicit design fixtures. |
| `src/<kind>/<name>/public/` | That entry's own static files, served at `/<kind>/<name>/assets/...`. Referenced as `assets/file.png`. |
| `src/shared/assets/<group>/` | Artwork shared between entries (for example `pokemon/` sprites). An entry opts in to a group in `sharedAssets` (`scripts/display-pages.js`); its build copies only those groups. Referenced as `assets/<group>/file.png`. |
| `src/shared/pokemon/` | Pokémon data and logic used by both kinds: game registry, types, moves, encounters, experience, demo fixtures. |
| `src/shared/` | Shared transport, reactive bindings, scaling, resource bars, HP meters, stat grids, and base styles. |
| `scripts/server.js` | Serve the production build as static files. |

One Vite project builds all HTML entries. Development, `npm run preview`, and the production server map `/stream-overlays/pokemon` and `/stream-overlays/dragon-warrior-1` to `src/<kind>/<name>/index.html`; trailing slashes and explicit `/index.html` URLs also work. `/` is a static page listing the overlays; old `/?game=...` and `/?demo=1` URLs redirect to the matching overlay. Pokémon’s `game` query still selects its mapper family in previews.

A single Vite project is sufficient. Authors can edit the scene without understanding the transport. Add workspace packages only when you actually need independently maintained or published packages.

## Build your overlay

### 1. Configure the source and canvas

Use the existing configuration file as a starting point:

```js
export default {
  gamehookUrl: 'http://127.0.0.1:61358',
  instance: 0,
  mapperId: null,
  width: 1920,
  height: 1080,
};
```

`gamehookUrl` must be an HTTP or HTTPS origin, without credentials or a path. `instance` selects a Gamehook instance. Set `mapperId` to your mapper UUID when you want to restrict the overlay to that mapper; leave it `null` when no UUID restriction is needed.

Choose the canvas dimensions before arranging widgets. Update CSS positions and the OBS Browser Source dimensions together when changing the canvas.

The framework validates the connection origin, instance, optional mapper UUID, and canvas dimensions. Define and validate additional scene options in `src/stream-overlays/pokemon/`; their names and meanings belong to your overlay, not the shared framework.

### 2. Keep one connection boundary

For a single-game overlay, mount the framework without a viewmodel:

```jsx
import { render } from 'solid-js/web';
import {
  GamehookProvider, Scene, ConnectedDisplay, ConnectionStatus,
} from '@display';
import config from './overlay/config.js';
import demo from './overlay/demo.js';
import Overlay from './overlay/Overlay.jsx';
import './framework/base.css';
import './overlay/style.css';

const preview = new URLSearchParams(location.search).get('demo') === '1';

render(() => (
  <GamehookProvider config={config} demo={preview ? demo : undefined}>
    <Scene width={config.width} height={config.height}>
      <ConnectedDisplay><Overlay /></ConnectedDisplay>
      <ConnectionStatus />
    </Scene>
  </GamehookProvider>
), document.getElementById('root'));
```

Replace any example-specific mapper selection in the entry point when building your own scene. The provider above reads the selected mapper directly.

When Gamehook is unavailable, widgets unmount and only the global loading indicator remains. A healthy source and initial snapshot are required before mounting the scene. Widgets should not make their own connections, show their own waiting screens, or invent replacement values.

### 3. Read actual mapper paths

Inspect your loaded mapper and its decoded values. Choose paths that actually exist. For one supported game, bind components directly to those paths. A constants file can keep repeated path strings in one place; that alone does not require a viewmodel.

The following paths are illustrative. Replace them with your mapper's paths:

```jsx
import { Show } from 'solid-js';
import { Field, Panel, Meter, useGamehook } from '@display';

export default function PlayerStatus(props) {
  const gamehook = useGamehook();
  const health = () => gamehook.value(`${props.path}.health`, null);
  const maximum = () => gamehook.value(`${props.path}.health_max`, null);
  const ready = () => Number.isFinite(health()) &&
    Number.isFinite(maximum()) && maximum() > 0;

  return (
    <Panel title="Player">
      <h2><Field path={`${props.path}.name`} /></h2>
      <Show when={ready()}>
        <Meter value={health()} max={maximum()} label="Health" />
        <p>{health()} / {maximum()}</p>
      </Show>
    </Panel>
  );
}
```

Read values inside JSX or accessor functions so Solid tracks updates. Do not copy a live value into a plain variable once and expect it to update:

```js
const health = () => gamehook.value('player.health'); // reactive accessor
```

Use `null` or an absent value to represent unknown data. Zero is valid data, not evidence that a field is missing. Hide unavailable sections instead of displaying invented names, levels, counters, or percentages. Validate numeric values before calculations.

During transitions, a battle-specific field may exist but still be uninitialized. Use the mapper's state and readiness fields to select valid data. Keep reading a valid source until the new source is ready; do not replace valid display values with NULL transition values.

### 4. Compose small widgets

Keep each meaningful display section in its own component. Pass paths or small data objects through props, then arrange components in `Overlay.jsx`:

```jsx
import PlayerStatus from './components/PlayerStatus.jsx';
import LocationPanel from './components/LocationPanel.jsx';

export default function Overlay() {
  return (
    <div class="overlay-layout">
      <aside class="left-rail"><PlayerStatus path="player" /></aside>
      <aside class="right-rail"><LocationPanel /></aside>
    </div>
  );
}
```

This keeps rearrangement simple. Prefer existing framework bindings over extra wrapper layers. JSX uses `class`, braces around JavaScript expressions, and closed tags. Plain HTML can usually be adapted directly into JSX markup.

### 5. Preserve transparency and scaling

Do not embed emulator video. The included scene can fill the whole canvas (`fillOpening: true`, game capture above the overlay in OBS) or leave the game area transparent (`fillOpening: false`, game capture beneath). Keep the document background itself transparent.

Use a fixed design canvas and let `Scene` scale it uniformly. Define rail widths, card sizes, and gaps consistently. Avoid applying a second independent scale to individual widgets. Use grid or flexbox for alignment rather than compensating with scattered negative margins.

The framework disables pointer events and text selection. Overlay widgets should not contain buttons, inputs, hover-dependent content, or other interaction requirements. If content exceeds the available space, use deliberate automatic paging or another passive display pattern.

### 6. Bundle assets and preview data

Put artwork used by one entry in its `public/assets/` folder (for example `src/stream-overlays/pokemon/public/assets/`) and reference it with the relative URL `assets/filename.png`. Artwork several entries use goes in `src/shared/assets/<group>/`; list the group for each entry in `sharedAssets` and reference it as `assets/<group>/filename.png`. Bundle required reference data locally as well. Streaming should not depend on external image or data services. Record asset sources and any license or attribution requirements in your scene's guide.

Replace `src/stream-overlays/pokemon/demo.js` with representative data shaped like your mapper snapshot. Enable it only through explicit `?demo=1` preview mode. Never use fixtures as a fallback when a live connection fails.

Include fixtures for ordinary play, transitions, missing optional data, zero values, long names, and the largest supported content lists. Preview mode is labeled so it cannot be mistaken for live data.

## Viewmodels: only for multiple games

**Use a viewmodel only when the same overlay must support multiple games.** For a single game, read actual mapper paths directly and keep game-specific calculations in small helpers where needed.

When multiple games expose different schemas, a viewmodel translates each game's values into one shared display shape. Components read that shared shape, while adapters handle path differences, active entity selection, state transitions, and optional capabilities.

Use the provider's optional hooks for this boundary:

```jsx
<GamehookProvider
  config={config}
  acceptMapper={mapper => Boolean(selectAdapter(mapper))}
  mapperRequirement="supported game mapper"
  resolveValue={(path, rawRead, mapper) =>
    selectAdapter(mapper)?.value(path, rawRead)}
>
  {/* Scene, connection boundary, and widgets */}
</GamehookProvider>
```

`selectAdapter` is your overlay's function, not a framework export. Each adapter's `value(path, rawRead)` resolves a shared path using the actual loaded schema. The provider preserves unknown values; it does not fabricate data.

Keep adapters in the author folder, separate from transport and presentation. Identify games using reliable mapper metadata; do not assume an ID alone is unique. Preserve meaningful differences between games instead of coercing every field into a misleading common value. Hide features that the selected source cannot supply.

For previews with adapters, pass `demoMapper` alongside `demo` so the resolver knows which fixture schema it is reading. Live mapper changes trigger a fresh connection snapshot automatically. Explicit demo snapshots update reactively when preview controls change, while live transport remains stopped.

## Framework API

Import these exports from `@display`:

| Export | Purpose |
| --- | --- |
| `GamehookProvider` | Owns the connection and reactive store; accepts `config` and optional explicit `demo` data. |
| `useGamehook()` | Returns `value(path, fallback)`, `rawValue(path, fallback)`, raw `data`, `mapper()`, `status()`, and `message()`. |
| `Field` | Displays a bound `path`; supports `format(value)` and `class`. |
| `Panel` | Groups markup with optional `title` and `class`. |
| `Meter` | Displays finite numeric `value` and positive finite `max`; supports `label` and `color`. |
| `Scene` | Applies uniform viewport scaling to a fixed `width` and `height`. |
| `ConnectedDisplay` | Mounts children only while connected or explicitly previewing. |
| `ConnectionStatus` | Displays the global waiting indicator or preview label. |

Statuses are `waiting`, `connected`, and `demo`. Without a resolver, `value()` reads raw mapper paths. `rawValue()` always reads the original schema. Optional provider hooks are `acceptMapper`, `mapperRequirement`, `resolveValue`, and `demoMapper`.

The client retries every two seconds and checks health and mapper metadata every three seconds. Requests and initialization have an eight-second deadline. Disconnection, failed health checks, malformed updates, and mapper/schema changes cause resynchronization. Stale callbacks cannot overwrite a newer connection.

The supported Gamehook protocol is:

- `GET /instances/{index}/health`
- `GET /instances/{index}/mapper`
- `GET /instances/{index}/properties` returning nested decoded values
- `/instances/{index}/ws` sending arrays of property updates containing `path` and `value`

Older SignalR-based APIs require a separate integration. The display reads Gamehook directly from the browser, so Gamehook must allow cross-origin requests. The included Gamehook server change allows all CORS origins, methods, and headers.

## Bottom screens

A bottom screen is an interactive page, like the touch screen of a DS game, for a second monitor, tablet, or browser window. It reads the same live Gamehook data as a stream overlay but never writes to the game: taps change only what the page shows.

Open `/bottom-screens/pokemon/` (or `?demo=1` for fixtures). The Pokémon screen has a home menu, party with a summary page per Pokémon, bag, Pokédex, and the current area's wild Pokémon. Sections the loaded mapper cannot supply hide or are disabled.

- **Sizing.** `BottomScreen` fits a fixed 4:3 design stage (1024 × 768) to the window, letterboxed and uniformly scaled.
- **Full screen.** A faint corner button, or the `F` key. It fades out until the pointer moves.
- **Input.** Tap or click, or the keyboard: arrow keys move focus, `Z` activates, `X`/`Esc`/`Backspace` go back.
- **Screens.** `createNavigator()` keeps a stack of screens (`push`, `replace`, `back`, `home`); the page renders `nav.current()`.
- **Sharing.** Both kinds import from `@display` and `src/shared/`. The Pokémon bottom screen and stream overlay share their sprites from `src/shared/assets/pokemon/` (see `sharedAssets` in `scripts/display-pages.js`).

To add one, create `src/bottom-screens/<name>/` with `index.html`, `main.jsx`, and `config.js` (with its own GUID `id`); it is discovered automatically.

## Build and run a finished display

Stop the development server, then run:

```sh
npm run build                      # every display plus the landing page
npm run build -- stream-overlays/dragon-warrior-1  # one entry only
npm start
```

Each display builds into its own self-contained folder, `dist/<kind>/<name>/` (page, scripts, styles, fonts, and its own assets, all relative URLs). To publish one display, deploy only that folder, for example `dist/stream-overlays/dragon-warrior-1/` at any subpath; nothing from the other overlays is required. The overlay connects directly to Gamehook at `gamehookUrl` (default `http://127.0.0.1:61358`), so it needs no server-side proxy, only a browser on the machine running Gamehook.

The standalone server serves `dist/` on **http://127.0.0.1:5173/** as static files. Keep the server running while using the display. Set `DISPLAY_PORT` to use a different port. Only one server can use a given port at a time.

Rebuild after changing source files, configuration, or artwork, then refresh the Browser Source. Rebuild after changing the Gamehook origin or instance. `npm run preview` is available for build previews; use `npm start` for normal production serving.

## OBS setup

1. Add a Browser Source using the local stream overlay URL.
2. Set its width and height to your configured canvas dimensions.
3. With `fillOpening: true` (default in the included scene), place the game capture **above** the Browser Source; the themed background fills the space around the game. With `fillOpening: false`, place it below; the opening stays transparent.
4. Fit the capture into the game opening, preserving the game's aspect ratio. Crop any emulator borders.
5. Check loading behavior by stopping and restarting Gamehook or its driver.

The scene fills the Browser Source window. Its height maps to 1080 design units; the width stretches, so the two side columns stay the same size and the game opening takes the rest. At 1920 × 1080 the opening is **x=400, y=0, width=1120, height=1048**; at other sizes it is everything between the columns. Windows narrower than `width` (1200 units) scale down by width instead so the columns never overlap.

## Storybook

Preview widgets and full scenes with demo data, without Gamehook:

```sh
npm run storybook        # http://127.0.0.1:6006
npm run build-storybook  # static build in ignored storybook-static/
```

Stories live in `src/stream-overlays/pokemon/stories/`. Each story sets a `demo` arg using the same query parameters as `?demo=1` (for example `battle=wild&status=PSN`); the toolbar switches game family and lead type. Widget stories render inside a 400px rail; `Scene/Overlay` stories fill the preview window, including the filled game opening. Add a story next to any new widget.

`npm test` keeps the fast Node checks for transport, configuration, server, and bundled data. `npm run check` runs those, the production build, and the Storybook build.

Check the intended canvas size and a smaller viewport, transparent regions, long content, uninitialized transitions, live updates, disconnect/reconnect behavior, and local asset loading. Finish with a real Gamehook session and OBS composition. Browser fixtures do not prove that a driver's memory reads match the running game.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Waiting indicator stays visible | Gamehook origin, instance, driver, mapper, continuous read mode, and any configured mapper restriction. |
| A widget has no value | Actual mapper path, decoded value, and whether the current game state initializes that field. |
| Values stop changing | Read them in reactive JSX/accessors; inspect driver health and WebSocket connectivity. |
| Overlay covers the game | Move the game capture above the Browser Source, or set `fillOpening: false` in `src/stream-overlays/pokemon/config.js`. |
| Assets are missing | Place files under `src/<kind>/<name>/public/assets/` (or `src/shared/assets/<group>/` plus `sharedAssets`), use relative `assets/...` URLs, rebuild, and refresh. |
| Server cannot start | Build first, validate configuration, and check whether another process uses the port. |
| Old UI remains in OBS | Rebuild source changes and refresh the Browser Source. |

## Brief for an LLM

> Build a display-only SolidJS overlay in `src/stream-overlays/pokemon/`. Keep networking and scaling in the existing framework. Use my mapper's actual property paths, reactive reads, and small movable components. Preserve the transparent game opening and global connection boundary. Hide unknown data and preserve valid zero values. Bundle assets locally and keep preview fixtures explicit. Use a viewmodel only if this same overlay must support multiple games.
