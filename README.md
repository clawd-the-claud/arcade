# ✦ ARCADE

A small cabinet of procedural browser games. No engines, no asset packs — every
texture, mesh, and note in these games is generated in code at run time.

**→ [clawd-the-claud.github.io/arcade](https://clawd-the-claud.github.io/arcade/)**

Each game lives in its own repo and is published to its own GitHub Pages URL.
This site is the shelf: it lists them, draws their covers, and launches them
full-bleed in an iframe so you never leave the page.

---

## Adding a game

Append one entry to [`games.json`](games.json). That's the whole process — no
build step, no image to make, no code to touch.

```json
{
  "id": "your-game",
  "title": "Your Game",
  "tagline": "A short subtitle",
  "description": "One or two sentences on what you do in it.",
  "url": "https://clawd-the-claud.github.io/your-game/",
  "repo": "https://github.com/clawd-the-claud/your-game",
  "tech": ["three.js", "WebGL"],
  "accent": ["#6bffc4", "#7ad4ff", "#c58bff"],
  "art": "aurora",
  "seed": 7
}
```

| Field | What it does |
|---|---|
| `id` | Unique slug. Used to bind the cover canvas. |
| `title` / `tagline` / `description` | Card copy. |
| `url` | Where the game is hosted. Anything embeddable in an iframe. |
| `repo` | Optional. Adds a **Source** link to the card. |
| `tech` | Optional chips along the bottom of the card. |
| `accent` | 1–3 hex colours. Drives the cover art **and** the card's hover glow. |
| `art` | Cover style: `aurora`, `waves`, `orbit`, `grid`. Defaults to `aurora`. |
| `seed` | Any number. Same seed always draws the same cover. |

### Cover art

There are no image files in this repo. Covers are drawn to a canvas from the
game's `accent` palette and `seed`, so a new game never means a new PNG — and
they stay sharp on any display.

To add a style, write a `(ctx, w, h, accent, seed)` function in
[`src/art.js`](src/art.js) and add it to the `STYLES` map. It becomes available
to `art` immediately.

### Hosting a new game

```bash
gh repo create your-game --public --source=. --push
gh api -X POST repos/clawd-the-claud/your-game/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

Then add the entry above. Games published under the same
`clawd-the-claud.github.io` domain are same-origin with the arcade, so keyboard,
pointer lock, and fullscreen all work inside the embedded player.

---

## On the shelf

| Game | | |
|---|---|---|
| **Boreal** | A night flight | [play](https://clawd-the-claud.github.io/boreal/) · [source](https://github.com/clawd-the-claud/boreal) |

---

## Running it locally

```bash
python3 serve.py     # port 8100, sends no-store
```

`serve.py` disables caching on purpose — browsers hold onto ES modules hard
enough that an edited file will keep running its old version through a normal
reload, which makes changes look like they had no effect.

## Layout

```
index.html      shell, styles, the player overlay
games.json      the registry — the only file you edit to add a game
src/app.js      builds the shelf, runs the launcher, animates the background
src/art.js      procedural cover generators
serve.py        no-cache dev server
```

The drifting aurora behind the page is a 160×90 canvas scaled up by CSS.
Upscaling a tiny buffer gives smoother falloff than any blur filter and costs
almost nothing, so it can animate indefinitely without touching the frame
budget. It pauses when the tab is hidden.
