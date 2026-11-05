# BumbleBeing

Jackson Cmelak's portfolio site — [Bumblebeing.com](https://bumblebeing.com).
A SvelteKit + Tailwind showcase of software projects under a light bumblebee/hive
theme: a fixed honeycomb texture, drifting bees you can switch off, and a burst of
dots around hovered header buttons.

This is **v2**, a rebuild from scratch. See [`CONTEXT.md`](./CONTEXT.md) for the
project's vocabulary and [`docs/adr/`](./docs/adr) for the decisions that would
otherwise look arbitrary.

## Running it

```sh
npm install
npm run dev
```

| Script            | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Dev server                             |
| `npm run build`   | Prerender the whole site               |
| `npm run preview` | Serve the production build             |
| `npm run check`   | `svelte-check` against `tsconfig.json` |
| `npm run lint`    | Prettier + ESLint                      |
| `npm run format`  | Prettier, writing                      |
| `npm test`        | Vitest, once                           |

CI runs `lint`, `check`, `test` and `build` on every PR into `main`.

`/dev/tokens` is a live gallery of every design token and UI primitive in both
themes — the fastest way to see what you have to work with. It is scaffolding and
gets deleted before launch.

## Adding a project

A Project is **one file**. Create `src/content/projects/<slug>.svx` — the filename
becomes the URL — and give it frontmatter:

```yaml
---
title: Bone Fracture Detector
blurb: A ResNet classifier that flags fractures in radiographs.
tags: [ml] # game | ml | systems | web — closed set, see CONTEXT.md
tools: [Python, PyTorch, Jupyter]
date: 2025-12-07
repo: https://github.com/BumbleBeing/ResNet-Fracture-Classifier # optional
demo: https://example.com # optional
report: /GarbageClassificationReport.pdf # optional, for work with no public repo
credit: Team project — UC Davis ECS 171 # optional, when it wasn't solo work
images: [] # optional; omit and the page shows no gallery
thumbnail: /booster-tutor/wizard.webp # optional; the Card's art when it differs from images[0]
fullBleed: false # optional; true when the Thumbnail is a screenshot, not cut-out art
---
Markdown body. The images sit centered above the title, and the body starts under
the links, so lead with what the project *is*.
```

Then nothing else. No route to add, no nav entry to edit — the index, the cards and
the sitemap all read from the same glob.

| Field       | Required | Notes                                                             |
| ----------- | -------- | ----------------------------------------------------------------- |
| `title`     | yes      |                                                                   |
| `blurb`     | yes      | 200 characters max — it has to sit in a card next to three others |
| `tags`      | yes      | at least one, from the closed set                                 |
| `date`      | yes      | quoted or not; see below                                          |
| `tools`     | no       | free-form strings, display only; defaults to `[]`                 |
| `repo`      | no       | must be a full URL                                                |
| `demo`      | no       | must be a full URL                                                |
| `report`    | no       | a path into `static/`, so it starts with `/`                      |
| `credit`    | no       | collaboration disclosure                                          |
| `images`    | no       | defaults to `[]`, and an empty list renders no gallery            |
| `thumbnail` | no       | path into `static/`; the Card uses it instead of `images[0]`      |
| `fullBleed` | no       | `true` fills the Thumbnail edge to edge with no Honeycomb behind  |

Frontmatter is validated with Zod at build time, so a missing field or an unknown
tag **fails the build** — naming the file and the field — rather than rendering
`undefined`:

```
Error: Invalid frontmatter in ../../content/projects/booster-tutor.svx:
  tags.0: Invalid option: expected one of "game"|"ml"|"systems"|"web"
```

**Dates work however you write them.** `date: 2026-09-30` and `date: '2026-09-30'`
both give you `2026-09-30`. This is worth knowing because the unquoted form is not
what it looks like: YAML parses it into a `Date`, which mdsvex then compiles into
the module as the string `2026-09-30T00:00:00.000Z`. The schema normalizes all
three shapes, so you never have to think about it.

A Post works the same way in `src/content/posts/`, with `title`, `date`, `blurb` and
optional `tags`.

## Images

Every image in a Post or Project page gets the same honeycomb frame as the Card
Thumbnails. You don't add it: `src/lib/content/frame-images.ts` wraps each `<img>`
(and each Markdown `![]()`) at build time. Give raw `<img>` tags their `width` and
`height` attributes, because the frame sizes itself from them before the image
loads. Without them a lazy image's frame collapses until it arrives and the page
jumps. Frames cap at 40rem wide and 30rem tall, book covers (`class="book-cover"`)
at 13rem wide and mascot art (`class="post-art"`) at 16rem; the project page
strip caps at 20rem tall.

**Transparent images get a solid copy for the pages.** The frame's honeycomb
would show through a transparent image, so Posts and Project pages use a copy
flattened onto a solid, light background that contrasts with the art, saved next
to the original as `<name>-bg.webp`. Keep the transparent original: it is what the
Card Thumbnail shows on its tinted Honeycomb. For a Project, that means
`images: [/x/art-bg.webp]` plus `thumbnail: /x/art.webp`; in a Post, point the
`<img>` at the `-bg` copy. Cream (`--honey-100`, `rgb(255 251 235)`) is the
default ground. Pick another hue only when the art is itself close to cream, the
way the pink Multi-Task King disc sits on mint (`rgb(200 236 208)`). Light grounds
suit our art because it has black outlines. The copy is a fixed file, so it
doesn't flip with the theme.

```sh
python3 -c "
from PIL import Image
src, ground = 'static/x/art.webp', (255, 251, 235)
im = Image.open(src).convert('RGBA')
bg = Image.new('RGBA', im.size, ground + (255,)); bg.alpha_composite(im)
bg.convert('RGB').save(src.replace('.webp', '-bg.webp'), 'WEBP', quality=88, method=6)"
```

A screenshot used as a Thumbnail has no transparency to worry about. Set
`fullBleed: true` so it fills the Card instead of sitting on the Honeycomb.

> `credit` is the field for disclosing collaborative work. It is deliberately not
> called `context` — that name belongs to `CONTEXT.md`.

## Building pages

Six hand-rolled primitives, all from `$lib/components`:

| Component         | Notes                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Button`          | Renders an `<a>` when given `href`, a `<button>` otherwise. `primary` / `outline` / `ghost`, sizes `sm` / `md` / `icon` |
| `Card`            | Plain rounded rectangle on `--surface`. Pass `href` to make the whole card a link                                       |
| `Chip`            | Pass `tag` for a colored Tag chip, omit it for a neutral Tool chip                                                      |
| `Separator`       | `horizontal` or `vertical`                                                                                              |
| `ImageStrip`      | CSS scroll-snap gallery. Renders **nothing** when `images` is empty                                                     |
| `PlaceholderTile` | Honeycomb thumbnail tinted by Tag, carrying the title's initial                                                         |

Use `cn()` from `$lib/utils` when a component takes a `class` prop, so a caller's
utility beats the component's own instead of losing a specificity coin-flip.

**Two token layers, and only one of them is yours.** `src/app.css` defines raw
primitives (`--honey-500`, `--beige-100`, `--umber-900`), then maps them to
semantic roles (`--background`, `--surface`, `--ink`, `--primary`, `--border`,
`--honeycomb-cell`). Components use **semantic names only** — via Tailwind
utilities like `bg-surface` and `text-ink`. A component reaching for `--honey-500`
has broken the layering, and dark mode stops being a one-place change.

`palette.test.ts` enforces this from the other end: all 16 text/background pairs
must clear WCAG AA and both honeycomb deltas must stay in the 4–5% band, so a
careless token edit fails CI rather than shipping an unreadable chip.

## Things that are deliberate

Do not "fix" these without reading the reasoning first.

- **Old v1 URLs 404 on purpose.** `/models`, `/models/*`, `/about-me/*` and the
  retired `/projects/{dnd-igor,multi-task-king,magic-the-glyphening}` have no
  redirects. The themed error page is the intended landing spot.
- **There is no component library.** No shadcn-svelte, no `bits-ui`. The primitives
  in `src/lib/components` are hand-rolled, which means accessibility is ours —
  see [ADR 0002](./docs/adr/0002-hand-rolled-ui-over-shadcn-svelte.md).
- **ML models are not a separate section.** They are Projects tagged `ml` —
  see [ADR 0001](./docs/adr/0001-dissolve-ml-models-into-project-tags.md).
- **`legacy-peer-deps=true` in `.npmrc`** works around an npm 10.9.x crash on
  vitest 4's peer graph. The comment in that file says when to remove it.
- **`ImageStrip`'s `tabindex="0"` is not a mistake.** A scrollable region that
  cannot be reached by keyboard fails WCAG 2.1.1. The linter rule that flags it
  does not model `role="region"` plus a label, which is the standard pairing.
- **`Button` and `Card` suppress `no-navigation-without-resolve`.** They take
  external URLs as well as internal routes, so `resolve()` is the caller's job.
- **Components reference semantic tokens only** (`--surface`, `--ink`), never
  primitives (`--honey-500`). That is what keeps dark mode a one-place change.

## Where the planning lives

Design decisions, the v1 audit and the phased build plan are in the Obsidian vault
under `PrimaryVault/Bumblebeing/`, not in this repo. `CONTEXT.md` and `docs/adr/`
carry the parts a reader of the code needs.
