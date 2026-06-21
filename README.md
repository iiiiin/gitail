# gitail

> A lightweight SVG timeline widget for your GitHub profile README.  
> Embed your project history as an animated track — one URL, zero setup.

![demo](https://gitail-phi.vercel.app/api/timeline?items=2024-01,react,My%20First%20App|2024-06,flutter,Mobile%20App|2025-01,typescript,Web%20Service|2025-08,figma,Design%20System)

---

## Usage

Add the following to your `README.md`:

```markdown
![timeline](https://gitail-phi.vercel.app/api/timeline?items=YYYY-MM,icon,title|YYYY-MM,icon,title)
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `items` | ✅ | `|`-separated list of timeline entries |
| `style` | ❌ | `flag` (default) or `stairs` |

> **Note:** Only the 5 most recent items are displayed. If more than 5 items are provided, the earliest ones are dropped automatically.

### Styles

Two visual styles are available.

**`flag`** (default) — a track with flag-shaped markers and a running character.

![flag style](https://gitail-phi.vercel.app/api/timeline?items=2024-01,react,forest%20of%20coco|2024-06,flutter,pawprint|2025-01,chromewebstore,turtleneck%20reminder|2025-08,chromewebstore,lunch%20hourglass)

**`stairs`** — your projects as an ascending staircase, most recent on the highest step, with a jumping character on top.

```markdown
![timeline](https://gitail-phi.vercel.app/api/timeline?items=...&style=stairs)
```

![stairs style](https://gitail-phi.vercel.app/api/timeline?items=2024-01,react,forest%20of%20coco|2024-06,flutter,pawprint|2025-01,chromewebstore,turtleneck%20reminder|2025-08,chromewebstore,lunch%20hourglass&style=stairs)

### Item Format

Each item follows this structure:

```
YYYY-MM,icon,title
```

| Field | Description | Example |
|-------|-------------|---------|
| `YYYY-MM` | Date of the project | `2025-08` |
| `icon` | [simple-icons](https://simpleicons.org) slug | `react`, `flutter`, `typescript` |
| `title` | Project name (spaces allowed) | `my%20project` |

To find an icon slug: search the technology on [simpleicons.org](https://simpleicons.org), and use its name in lowercase with no spaces or symbols (e.g. "Chrome Web Store" → `chromewebstore`).

Optionally, append a hex color to override the icon's default brand color:

```
2025-08,react,My%20App,#FF0000
```

### Example

```markdown
![timeline](https://gitail-phi.vercel.app/api/timeline?items=2024-01,react,forest%20of%20coco|2024-06,flutter,pawprint|2025-01,chromewebstore,turtleneck%20reminder)
```

---

## Notes

- Spaces in titles must be encoded as `%20`
- Avoid `,` and `|` in titles — they are used as delimiters
- The widget renders a blank image on mobile (by design)
- Icon slugs follow [simple-icons](https://simpleicons.org) naming

## Troubleshooting

**Nothing shows up / blank image?**
- Double-check the `items` format: `YYYY-MM,icon,title` separated by `|`
- Make sure spaces in titles are encoded as `%20`
- Verify the icon slug exists on [simpleicons.org](https://simpleicons.org)
- If you just edited the URL, GitHub may be showing a cached version — try appending `&v=2` (or any dummy value) to force a refresh

---

## Built With

- [simple-icons](https://simpleicons.org) — brand icon library
- [Vercel](https://vercel.com) — serverless deployment

---

<!-- ## License

MIT -->