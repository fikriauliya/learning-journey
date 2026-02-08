# Levi's Learning Journey 📚

A personal website to track my polymath learning journey, complete with GitHub-style activity heatmap.

## Features

- 🔥 GitHub-style contribution heatmap showing daily learning activity
- 📊 Stats: total topics, days learning, current streak
- ✅ Completed topics with key concepts
- 🎯 Suggested next topics
- 🌙 Dark theme (GitHub-inspired)

## Development

```bash
# Build the site
bun run build

# Start local server
bun run serve
```

Then open http://localhost:3000

## Deploy to Netlify

1. Push this repo to GitHub
2. Connect to Netlify
3. Netlify will auto-detect the `netlify.toml` config
4. Build command: `bun run build`
5. Publish directory: `dist`

## Updating Learning Data

Edit `data/learning.json` to:
- Add new completed topics
- Update activity log with new dates
- Modify suggested next topics

### Activity Log Format

```json
{
  "date": "2026-02-08",
  "count": 2,
  "topics": ["Topic A", "Topic B"]
}
```

The heatmap shows activity levels:
- Level 0: No activity (dark)
- Level 1: 1 topic
- Level 2: 2 topics
- Level 3: 3-4 topics
- Level 4: 5+ topics

## Tech Stack

- **Runtime:** Bun
- **Fonts:** Inter + Source Serif 4
- **Style:** GitHub dark theme inspired
- **No frameworks** — pure HTML/CSS/JS

---

*"اقرأ — Read."*
