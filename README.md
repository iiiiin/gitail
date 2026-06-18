# gitail

> A lightweight SVG timeline widget for your GitHub profile README.  
> Embed your project history as an animated track — one URL, zero setup.

![demo](https://gitail-phi.vercel.app/api/timeline?items=2024-01,react,My%20First%20App|2024-06,flutter,Mobile%20App|2025-01,typescript,Web%20Service|2025-08,figma,Design%20System&v=2)

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

> **Note:** Only the 5 most recent items are displayed. If more than 5 items are provided, the earliest ones are dropped automatically.

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

---

## Built With

- [simple-icons](https://simpleicons.org) — brand icon library
- [Vercel](https://vercel.com) — serverless deployment

---

<!-- ## License

MIT -->
