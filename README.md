# 🏙️ GitHub City

> **Visualize any GitHub user's repository portfolio as a living, breathing 3D city — where every building is a repo and every window is a commit.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-black?logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

<!-- markdownlint-disable MD033 -->
<br />
<div align="center">
  <!-- 
    DEMO WINDOW: Replace 'YOUR_VIDEO_LINK_HERE.mp4' with the actual link to your video.
    You can simply drag and drop your video file into the GitHub markdown editor to generate a link!
  -->
  <a href="https://arnavpundir22.github.io/GitHub-City/" target="_blank">
    <video src="./public/video/City.mp4" width="100%" autoplay loop muted playsinline style="border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); cursor: pointer;"></video>
  </a>
  <p align="center">
    <em>Explore the 3D cyberpunk city of any GitHub user.</em>
  </p>
  <b><a href="https://arnavpundir22.github.io/GitHub-City/" target="_blank">Enter the City ↗</a></b>
</div>
<br />
<!-- markdownlint-enable MD033 -->

---

## ✨ What Is This?

GitHub City transforms any GitHub user's public profile into an interactive **3D skyscraper city**. Type a username, press **Explore City**, and watch their repositories rise from the ground as real buildings — lit up at night with window lights that show exactly how active each repo has been over the past year.

| What you see | What it means |
|---|---|
| 🏗️ **Taller building** | More stars + larger codebase |
| 🏢 **Wider building** | More community forks |
| 💡 **More lit windows** | More weekly commits |
| 🎨 **Building glow color** | Primary programming language |
| 📡 **Blinking red beacon** | Antenna on every rooftop |

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/github-city.git
cd "github-city"

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open **<http://localhost:5173>** in your browser, type any GitHub username, and click **Explore City**.

---

## 🌟 Features at a Glance

- 🏙️ **Full personal city** — one building per repository (up to 300+ repos via pagination)
- 📐 **Realistic skyscraper geometry** — podium base, lower/upper tower with setback, floor slabs, rooftop penthouse, antenna spire
- 💡 **Commit-driven window lighting** — 52-week participation data mapped to individual windows across all 4 building faces, glowing brightly via bloom
- 🎨 **Neon language signs** — massive glowing corporate-style holograms on building facades using GitHub's language color palette
- 🔍 **Bi-directional hover** — hover a 3D building to highlight its card in the sidebar, or hover a sidebar card to highlight the building
- 📊 **Rich sidebar** — avatar, bio, location, repo list with sparklines, stats, window legend
- ⚡ **Rise animation** — buildings grow up from the ground when a city loads
- 🌌 **Cyberpunk atmosphere** — deep void sky, volumetric fog, neon rim lights, and full-screen bloom post-processing
- 🔄 **Switch cities** — search any new username to instantly replace the current city
- ⚠️ **Rate-limit aware** — graceful fallback to estimated activity when GitHub API is busy

---

## 📁 Project Structure

```
github-city/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite build config
├── package.json                # Dependencies & scripts
├── src/
│   ├── main.jsx                # React DOM mount
│   ├── App.jsx                 # Root state: cityData, hoveredRepo, error
│   ├── index.css               # Global design system & all UI styles
│   ├── components/
│   │   ├── Building.jsx        # 3D skyscraper (one per repo)
│   │   ├── Scene.jsx           # Three.js Canvas, lights, grid, camera
│   │   └── Overlay.jsx         # HTML UI: search, sidebar, tooltip, legend
│   └── utils/
│       └── github.js           # GitHub API client & data transforms
└── docs/
    ├── ARCHITECTURE.md         # System design & data flow
    ├── BUILDING_SYSTEM.md      # 3D geometry & window lighting details
    ├── API.md                  # GitHub API endpoints & rate limits
    ├── CONTROLS.md             # Camera controls & UI interactions
    └── DEVELOPMENT.md          # Dev setup, scripts, tech stack
```

---

## 📚 Documentation

| Document | Contents |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Component diagram, state flow, rendering pipeline |
| [BUILDING_SYSTEM.md](docs/BUILDING_SYSTEM.md) | Skyscraper geometry, window lighting math, animations |
| [API.md](docs/API.md) | GitHub API endpoints, pagination, rate limits, data shapes |
| [CONTROLS.md](docs/CONTROLS.md) | Camera controls, mouse interactions, UI guide |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, scripts, tech stack, contributing guide |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| 3D Engine | Three.js 0.184 via React Three Fiber 9 |
| 3D Helpers | React Three Drei 10 & Postprocessing |
| Build Tool | Vite 8 |
| HTTP Client | Axios |
| Icons | Lucide React |
| Fonts | Google Fonts — Outfit |
| Data Source | GitHub REST API v3 (public, no token required) |

---

## ⚠️ Limitations

- **No auth token** → 60 API requests/hour per IP. Searching multiple users quickly may hit the limit.
- **Participation stats** are cached by GitHub and may show a `202 Accepted` on first request (the app auto-retries once after 1.5s).
- **Private repos** are not shown (GitHub public API only).
- **Forks are included** in the city — own repos and forked repos both appear as buildings.

---

## 📄 License

MIT © 2026 GitHub City Contributors
