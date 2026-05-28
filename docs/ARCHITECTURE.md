# 🏗️ Architecture

> Complete system design, component relationships, state flow, and rendering pipeline for GitHub City.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
│                                                     │
│  ┌──────────┐    state     ┌────────────────────┐   │
│  │  App.jsx │◄────────────►│   Overlay.jsx      │   │
│  │  (root)  │              │   (HTML UI layer)  │   │
│  └────┬─────┘              └────────────────────┘   │
│       │ cityData                                     │
│       │ hoveredRepo                                  │
│       ▼                                             │
│  ┌──────────┐    3D scene  ┌────────────────────┐   │
│  │ Scene.jsx│─────────────►│   Building.jsx     │   │
│  │ (Canvas) │   ×N repos   │   (per-repo mesh)  │   │
│  └──────────┘              └────────────────────┘   │
│       ▲                                             │
│       │ fetchUserCity()                             │
│  ┌──────────┐                                       │
│  │github.js │──── GitHub REST API v3 ────►          │
│  └──────────┘                                       │
└─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### `App.jsx` — Root State Manager

**Responsibility:** Owns all application state and wires components together.

**State:**
```js
const [cityData,    setCityData]    = useState(null);   // { user, repos[] }
const [isLoading,   setIsLoading]   = useState(false);
const [hoveredRepo, setHoveredRepo] = useState(null);   // repo.name string
const [error,       setError]       = useState('');
```

**Key behaviors:**
- On search: calls `fetchUserCity(username)`, replaces `cityData` entirely (no accumulation)
- `hoveredRepo` is shared between `Scene` and `Overlay` — hovering a 3D building highlights the sidebar card and vice versa
- Error states distinguish 404 (user not found), 403 (rate limit), and generic network failures

---

### `Scene.jsx` — 3D Canvas

**Responsibility:** Manages the Three.js canvas, all lights, the grid floor, and renders one `Building` per repo.

**Two internal sub-components:**

| Component | Used when | Description |
|---|---|---|
| `EmptySceneContents` | No city loaded | Auto-rotating camera over the empty grid |
| `CitySceneContents` | City loaded | Full lighting rig + all buildings |

**Camera:**
- Initial position: `[28, 18, 28]` (isometric-ish view)
- Field of view: `42°`
- Orbit controls: drag to rotate, scroll to zoom

**City grid layout algorithm (`getCityPosition`):**
```js
cols    = ceil(sqrt(total))         // square-ish grid
spacing = 9 units between buildings
rowOffset = (row % 2 === 1) ? 4.05 : 0   // stagger odd rows for organic feel
x = col * spacing - (cols * spacing)/2 + spacing/2 + rowOffset
z = row * spacing - (rows * spacing)/2 + spacing/2
```

Most-starred repos are placed first (sorted before layout), so they appear center-front.

**Lighting rig (city scene):**

| Light | Position | Color | Intensity | Purpose |
|---|---|---|---|---|
| `ambientLight` | global | `#8899cc` | 0.45 | Base fill, no shadows |
| `hemisphereLight` | sky/ground | `#1a2a6c` / `#0a1020` | 0.7 | Natural sky gradient depth |
| `directionalLight` | `[-25,50,-15]` | `#c8d8ff` | 0.9 | Main moonlight, casts shadows |
| `directionalLight` | `[40,20,30]` | `#ffd59e` | 0.35 | Warm golden fill, opposite side |
| `pointLight` | `[0,2,0]` | `#00334d` | 4.0 | Teal city-wide bounce from ground |
| `pointLight` | `[-40,15,-40]` | `#0044aa` | 1.5 | Corner rim: blue |
| `pointLight` | `[40,15,40]` | `#220066` | 1.5 | Corner rim: purple |
| `pointLight` | `[-40,15,40]` | `#003322` | 1.0 | Corner rim: green |
| `pointLight` | `[40,15,-40]` | `#001133` | 1.0 | Corner rim: dark blue |

Shadow map: `2048×2048`, covers `120×120` unit area.

---

### `Building.jsx` — Per-Repo Skyscraper

**Responsibility:** Renders one repo as a full 3D skyscraper with windows, lighting, labels, and animations.

See [BUILDING_SYSTEM.md](BUILDING_SYSTEM.md) for full geometry and window-lighting details.

**Props:**
```ts
{
  repo:          RepoData,     // repo object from github.js
  position:      [x, y, z],   // world position from getCityPosition()
  isHovered:     boolean,      // true = 4% XZ scale boost
  onPointerOver: () => void,   // R3F pointer event → sets hoveredRepo
  onPointerOut:  () => void,   // R3F pointer event → clears hoveredRepo
}
```

---

### `Overlay.jsx` — HTML UI Layer

**Responsibility:** All HTML/CSS interface elements rendered on top of the canvas.

**Sections:**

| Element | Position | Content |
|---|---|---|
| Search bar | Top-center | Title, search input, "Explore City" button, hint text |
| Side panel | Left | User profile, 3-stat row, window legend, repo list |
| Repo card | Inside side panel | Name, language badge, description, star/fork/commit stats, 52-week sparkline |
| Hover tooltip | Bottom-right | Detailed repo card shown when a 3D building is hovered |
| Error toast | Bottom-center | Dismissable error messages |

**Bi-directional hover sync:**
- Mouse enters a **repo card** → calls `onHoverRepo(repo.name)` → `isHovered=true` on the matching `Building`
- Pointer enters a **3D Building** → calls `onPointerOver()` → matching repo card gets `repo-card--hovered` CSS class

---

### `github.js` — API Client

**Responsibility:** All GitHub API communication and data transformation.

See [API.md](API.md) for endpoint details and rate limit guidance.

**Exports:**
```js
export const LANGUAGE_COLORS   // { JavaScript: '#f1e05a', ... }
export function getLangColor(language: string): string
export async function fetchUserCity(username: string): Promise<CityData>
```

---

## Data Flow

```
User types username → handleSearch(username)
    │
    ▼
fetchUserCity(username)
    ├── GET /users/{username}           → user profile
    └── fetchAllRepos(username)         → all repos (paginated)
            ├── page 1: GET /users/{username}/repos?per_page=100&page=1
            ├── page 2: GET /users/{username}/repos?per_page=100&page=2
            └── ... until response.length < 100
    │
    ▼
For each repo (batched 10 at a time):
    └── fetchParticipation(owner, repo)
            GET /repos/{owner}/{repo}/stats/participation
            → { all: [52 weekly commit counts] }
            → on 202: retry after 1500ms (up to 2 retries)
            → on failure: estimateActivity(repo) fallback
    │
    ▼
Transform & sort repos by stars (desc)
    │
    ▼
setCityData({ user, repos })
    │
    ├── Scene renders Buildings for each repo
    └── Overlay renders sidebar with user profile + repo list
```

---

## Render Pipeline

```
React render cycle
    │
    ▼
<Canvas> (React Three Fiber)
    │
    ├── Lighting setup (ambientLight, hemisphereLight, etc.)
    ├── <Grid> (infinite cyan wireframe floor)
    ├── <Stars> (8000 particles in a 160-unit radius sphere)
    ├── <fog> (depth fade: #06091a, near=60, far=160)
    └── For each repo:
            <Building>
                ├── useFrame() → rise animation + antenna blink
                ├── Podium mesh (BoxGeometry)
                ├── Lower tower mesh (BoxGeometry)
                ├── Upper tower mesh (BoxGeometry, setback)
                ├── FloorSlab meshes × floorCount
                ├── Window meshes × (floorCount × winsPerRow × 4 faces)
                ├── Rooftop penthouse mesh
                ├── Antenna cylinder mesh
                ├── Antenna beacon sphere
                ├── pointLight (red blinking beacon)
                ├── pointLight (language-colored base glow)
                └── <Billboard> <Text> (repo name + language·stars)
```
