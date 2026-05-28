# 💻 Development Guide

> Everything you need to know to run, build, and modify GitHub City locally.

---

## Prerequisites

- Node.js (v18+ recommended)
- npm (or yarn / pnpm)

---

## Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/github-city.git
   cd github-city
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173` with instant Hot Module Replacement (HMR).*

---

## Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts the Vite dev server |
| `npm run build` | Builds the app for production into the `dist/` directory |
| `npm run preview` | Previews the production build locally |

---

## Project Dependencies

### Core React & Build
- `react` / `react-dom` — UI framework
- `vite` — Next-gen frontend tooling (fast dev server & bundler)
- `@vitejs/plugin-react` — React support for Vite

### 3D Rendering (Three.js)
- `three` — The core WebGL 3D engine
- `@react-three/fiber` (R3F) — React renderer for Three.js (build 3D scenes using JSX)
- `@react-three/drei` — Useful helpers for R3F (OrbitControls, Billboard, Text, Stars, Grid)

### Data & UI
- `axios` — HTTP client for GitHub API calls
- `lucide-react` — SVG icon library

---

## How to Modify the Project

### 🎨 Changing the Design/Colors
All global styles and design tokens are in `src/index.css`. Look at the `:root` variables at the top of the file to change the background, accent colors, or typography.

### 🏙️ Changing Building Generation
The rules for how tall or wide a building is are located inside `src/components/Building.jsx` in the "Geometry params" section.
You can adjust the formulas (e.g., `Math.log2(stars)`) to scale buildings differently.

### 🚦 Adjusting Rate Limits or Data Fetching
If you need to change how many repos are fetched, or add a GitHub Personal Access Token to avoid rate limits, edit `src/utils/github.js`. See [API.md](API.md) for details on adding a token.

### 💡 Modifying the Scene Lighting
All lighting (ambient, hemisphere, directional moonlight, and point lights) is configured in `src/components/Scene.jsx` inside the `CitySceneContents` component.

---

## Performance Considerations

Rendering a 3D scene with dozens of complex buildings can be GPU-intensive. If you encounter performance issues with users who have hundreds of repos:

1. **Window Meshes:** Currently, every lit window is a separate `mesh`. For massive cities, consider migrating the `WindowFace` component to use `THREE.InstancedMesh` to dramatically reduce draw calls.
2. **Shadows:** The directional moonlight casts shadows (`castShadow`). If FPS drops, try disabling shadows on the `<directionalLight>` in `Scene.jsx` or on the individual meshes in `Building.jsx`.
3. **Pagination Cap:** You can artificially cap the number of repos fetched in `github.js` by limiting the `page` loop in `fetchAllRepos()`.

---

## Deployment

GitHub City is a static frontend app. You can deploy the `dist/` folder to any static hosting service like GitHub Pages, Vercel, Netlify, or Cloudflare Pages.

```bash
# To build for production:
npm run build
```
Then upload the contents of the `dist/` directory. No backend is required.
