# 🏙️ GitHub City

> **Visualize any GitHub user's repository portfolio as a living, breathing 3D city — where every building is a repo and every window is a commit.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-black?logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

<br />
<div align="center">
  <a href="https://arnavpundir22.github.io/GitHub-City/" target="_blank">
    <video src="./public/video/City.mp4" width="100%" autoplay loop muted playsinline style="border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); cursor: pointer;"></video>
  </a>
  <p align="center">
    <em>Explore the 3D cyberpunk city of any GitHub user.</em>
  </p>
  <b><a href="https://arnavpundir22.github.io/GitHub-City/" target="_blank">Enter the City ↗</a></b>
</div>
<br />

---

## ✨ Introduction

GitHub City transforms any GitHub user's public profile into an interactive **3D skyscraper city**. Type a username, press **Explore City**, and watch their repositories rise from the ground as real buildings — lit up at night with window lights that show exactly how active each repo has been over the past year. 

This project goes beyond traditional data visualization, rendering a completely procedural cyberpunk metropolis on the fly based on dynamic metrics.

### 🏙️ Visual Data Mapping

| What you see | What it means |
|---|---|
| 🏗️ **Taller building** | More stars + larger codebase (scales logarithmically) |
| 🏢 **Wider building** | More community forks (represents widespread adoption) |
| 💡 **More lit windows** | Higher commit volume (52-week activity map) |
| 🎨 **Neon glow color** | Primary programming language (using GitHub's official palette) |
| 📡 **Blinking beacon** | Navigational antenna on every rooftop for realism |
| 🌃 **Building placement** | Most starred repos are placed closer to the city center |

---

## 🚀 Quick Start

To run the city simulation locally on your machine:

```bash
# Clone the repo
git clone https://github.com/your-username/github-city.git
cd "github-city"

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open **<http://localhost:5173>** in your browser, type any GitHub username (like `torvalds` or `gaearon`), and click **Explore City**.

---

## 🏗️ System Architecture

GitHub City utilizes a fully decoupled architecture, separating the **React/HTML UI Layer** from the **Three.js WebGL Rendering Pipeline**.

### Component Flow

1. **State Management (`App.jsx`)**: The root component handles global state, fetching GitHub user data and storing the master `cityData` and `hoveredRepo` state.
2. **WebGL Scene (`Scene.jsx`)**: Uses `react-three-fiber` to bridge React state to the Three.js Canvas. It orchestrates the camera, grid floor, atmosphere (fog, stars), and lighting rig.
3. **Procedural Geometry (`Building.jsx`)**: Instantiates individual skyscrapers mapped to repository data. It handles its own rise animations, hover scaling, and individual light components.
4. **UI Overlay (`Overlay.jsx`)**: Renders the HTML UI (Search bar, sidebar, and tooltips) completely outside the WebGL canvas, allowing for native CSS accessibility and crisp font rendering.

### Bi-Directional Interaction
The system features seamless bidirectional syncing between 2D HTML and 3D WebGL contexts. Hovering over a 3D building mesh triggers state changes that highlight the corresponding HTML sidebar card, and vice versa. 

> 🔗 For detailed state flow and rendering pipeline diagrams, read the complete [**Architecture Deep Dive (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md).

---

## 🏢 Building System & Generation

Every building in the city is procedurally generated using standard Three.js geometries, constructed in modular segments to mimic realistic skyscraper forms (e.g., Art Deco aesthetics).

### Geometry Hierarchy
- **Base Podium:** The wide foundational lobby.
- **Lower Tower:** Rises up to 62% of the total floors.
- **Upper Tower (Setback):** Steps inward to 70% width for the remaining height.
- **Rooftop Penthouse & Antenna:** Adds vertical flair and a blinking navigational beacon.

### 52-Week Commit Window Matrix
Each window on the skyscraper acts as a pixel displaying commit density. The 52-week array of repository activity maps sequentially to the windows around the building's four faces. 

**Lighting Thresholds (Relative to Peak Week):**
- ⬛ **Dark / Off:** 0 commits
- 🟨 **Dim Amber:** < 15% of peak
- 🟧 **Warm Orange:** 15% - 40% of peak
- 🟡 **Bright Yellow:** 40% - 75% of peak
- ⬜ **Blazing White:** > 75% of peak

By scaling to a repository's *personal peak* (rather than a global cap), both highly active and infrequently updated projects display visible window patterns.

> 🔗 For precise mathematical parameters on building dimensions and mesh layout, see the [**Building System Reference (`docs/BUILDING_SYSTEM.md`)**](docs/BUILDING_SYSTEM.md).

---

## 🎮 Controls & Interaction

### Camera Controls (OrbitControls)
- **Left-click + Drag:** Rotate / orbit around the city center.
- **Right-click + Drag:** Pan the camera horizontally and vertically.
- **Scroll Wheel:** Zoom in and out (constrained between 6 and 150 units).
- **Double-click:** Reset camera target to origin.

### UI Panels
- **HUD Sidebar:** Provides the overarching user profile (followers, total repos, location), a scrollable list of detailed repo cards, and a window lighting legend.
- **Sparkline Charts:** Each repository card displays a 52-week inline SVG commit sparkline matching the exact color gradient of the building's windows.
- **Dynamic Tooltips:** Bottom-right anchored floating tooltips offer quick stats (Stars, Forks, Total Commits) without navigating away from the 3D focal point.

> 🔗 For a complete UI breakdown and error state handling, see the [**Controls Guide (`docs/CONTROLS.md`)**](docs/CONTROLS.md).

---

## 🔌 API Integration & Rate Limits

The city is powered by the standard **GitHub REST API v3**. By default, it operates completely unauthenticated.

### Data Fetching
- Queries `/users/{username}` for core profile metrics.
- Paginates `/users/{username}/repos` to retrieve up to 300+ public repositories.
- Fetches `/repos/{owner}/{repo}/stats/participation` for the 52-week commit history of each project.

### Dealing with Rate Limits
Because unauthenticated API calls are limited to 60 requests per hour per IP address, rendering large cities sequentially can quickly exhaust your quota. The application implements fallback mechanisms:
- Handles HTTP 202 (Accepted) for cached stats and implements retry logic.
- Falls back to *Estimated Activity Modeling* if the rate limit is hit mid-generation, ensuring the city still renders successfully without window data.

> 🔗 To learn how to bypass these limits using a Personal Access Token (PAT), consult the [**API Documentation (`docs/API.md`)**](docs/API.md).

---

## 🛠️ Tech Stack & Development

### Core Technologies
| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **3D Engine** | Three.js 0.184 |
| **Declarative WebGL** | React Three Fiber 9 |
| **3D Helpers** | React Three Drei 10 (Text, OrbitControls, Billboard) |
| **Post-Processing** | `@react-three/postprocessing` (Full-screen Bloom) |
| **Network & Data** | Axios |

### Modifying the Source
- **Styling:** Design tokens and global aesthetics are located in `src/index.css`.
- **Logic:** Building scale algorithms reside in `src/components/Building.jsx`.
- **Atmosphere:** Global lighting, fog, and celestial backgrounds are orchestrated in `src/components/Scene.jsx`.

> 🔗 For deployment scripts and performance optimization strategies (like using `InstancedMesh`), refer to the [**Development Guide (`docs/DEVELOPMENT.md`)**](docs/DEVELOPMENT.md).

---

## 📚 Complete Documentation Subparts

If you wish to explore the absolute deepest technical details of the project, refer to these dedicated markdown files:

1. 🏗️ [**Architecture (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md)
2. 🏢 [**Building System (`docs/BUILDING_SYSTEM.md`)**](docs/BUILDING_SYSTEM.md)
3. 🔌 [**API Reference (`docs/API.md`)**](docs/API.md)
4. 🎮 [**Controls & UI (`docs/CONTROLS.md`)**](docs/CONTROLS.md)
5. 💻 [**Development & Deployment (`docs/DEVELOPMENT.md`)**](docs/DEVELOPMENT.md)

---

## 📄 License

MIT © 2026 GitHub City Contributors
