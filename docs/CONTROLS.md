# 🎮 Controls & UI Guide

> Complete reference for all camera controls, mouse interactions, and UI elements in GitHub City.

---

## Camera Controls

GitHub City uses **OrbitControls** from React Three Drei. The camera orbits around the city center.

### Mouse Controls

| Action | Result |
|---|---|
| **Left-click + drag** | Rotate / orbit the camera around the city |
| **Right-click + drag** | Pan the camera (move horizontally/vertically) |
| **Scroll wheel** | Zoom in / zoom out |
| **Double-click** | Reset camera target to origin (Three.js default) |

### Touch Controls (Mobile / Trackpad)

| Gesture | Result |
|---|---|
| **One finger drag** | Rotate / orbit |
| **Two finger pinch** | Zoom |
| **Two finger drag** | Pan |

### Camera Constraints

| Setting | Value | Reason |
|---|---|---|
| `maxPolarAngle` | `π/2 - 0.05` | Cannot go below the ground plane |
| `minDistance` | `6 units` | Cannot zoom into a building |
| `maxDistance` | `150 units` | Cannot zoom out so far the city disappears |
| `enableDamping` | `true` | Smooth inertia-based deceleration |
| `dampingFactor` | `0.05` | Gentle smoothing (lower = smoother) |

### Auto-Rotate (Empty State)

Before any city is loaded, the camera auto-rotates slowly around the empty grid:
```
autoRotate:      true
autoRotateSpeed: 0.3 deg/frame
```
Auto-rotation stops as soon as a city loads.

### Initial Camera Position

```js
position: [28, 18, 28]   // isometric-ish angle from the front-right
fov:      42°             // narrower FOV = less distortion, more zoom feel
```

---

## Mouse Interactions with Buildings

### Hover a 3D Building

- **Hover enters** → building scales to `1.04×` on X and Z
- → repo name label brightens to `#ffffff`
- → matching **repo card** in the sidebar gets highlighted (blue-tinted border)
- → **hover tooltip** appears in the **bottom-right corner** showing full repo details

### Hover a Sidebar Repo Card

- **Mouse enters** card → the matching **3D building** scales up and brightens
- → tooltip appears bottom-right
- This works as **bi-directional hover sync** between the HTML UI and the 3D scene

### Hover Tooltip Contents

Appears in bottom-right corner when any building or card is hovered:

```
┌───────────────────────────────┐
│ repo-name              Python │  ← name + language (language-colored)
├───────────────────────────────┤
│ Short description text here…  │
├───────────────────────────────┤
│ ⭐ 1234 stars  🍴 56 forks    │
│ ⊕ 89 commits (52w)            │
├───────────────────────────────┤
│ [████░░░░██░░░░░░░░░░░██████] │  ← 52-week commit sparkline
└───────────────────────────────┘
```

The left border of the tooltip uses the repo's **language accent color**.

---

## UI Panels

### Search Bar (Top-Center)

```
┌──────────────────────────────────────────────────┐
│ 🏙️  GitHub City                                  │
│ ┌────────────────────────────┐ ┌───────────────┐ │
│ │ Enter GitHub username…     │ │ 🔍 Explore    │ │
│ └────────────────────────────┘ └───────────────┘ │
│  Each building = one repo · Height = popularity  │  ← hint (only before load)
└──────────────────────────────────────────────────┘
```

- **Width:** 90% of viewport, max 560px
- **Position:** fixed top-center, `1.25rem` from top
- While loading: button shows a spinner and "Loading…" text; input is disabled
- After loading: hint text disappears; search a new username to replace the city

### Left Side Panel

Appears after a city loads. Fixed to the left edge.

```
┌──────────────────────────────┐
│ [avatar]  Linus Torvalds     │
│           @torvalds          │
│           📍 Portland, OR    │
│                              │
│ ┌────────┬──────────┬──────┐ │
│ │   11   │  304807  │76931 │ │
│ │ Repos  │ Followers│Commi.│ │
│ └────────┴──────────┴──────┘ │
│                              │
│ WINDOW = COMMITS             │  ← legend
│ ■ None ■ Low ■ Mid ■ High ■P │
│                              │
│ ◇ 8 Repositories             │
├──────────────────────────────┤
│ [repo card 1]                │
│ [repo card 2]                │
│ [repo card 3]                │
│ ...scrollable...             │
└──────────────────────────────┘
```

- **Width:** 288px
- Scrollable repo list with custom scrollbar
- Window legend shows the 5 lighting levels with colored dots

### Repo Card (in sidebar)

```
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
▏ linux                 [C]   ▏  ← name + language badge
▏ Linux kernel source tree    ▏  ← description (70 char max)
▏ ⭐ 234654  🍴 62572  ⊕ 76800▏  ← star / fork / commit stats
▏ [sparkline bar chart 52w]   ▏  ← 52-week mini commit graph
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

Left border color = language accent color. Highlighted state adds a glow effect.

### Sparkline Chart

The 52-week sparkline is rendered as an inline SVG (80×20px):
- Each week = one bar
- Bar height = `commits / peakWeek × 20`
- Bar color follows the same 5-level scale as window lighting
- Zero-commit weeks = dark (`#1a2030`)

---

## Window Lighting Legend

Always visible in the side panel:

| Indicator | Meaning |
|---|---|
| ⬛ Dark square | 0 commits that week |
| 🟨 Dim amber | Low activity (< 15% of peak) |
| 🟧 Warm orange | Moderate (15–40% of peak) |
| 🟡 Bright yellow | High (40–75% of peak) |
| ⬜ White | Peak week (75–100% of peak) |

"Peak" is relative to each repo's own busiest week — not a global scale. A repo with only 1 commit/week peak will show white for that week, while a repo averaging 50 commits/week peak will also show white for its maximum. This ensures even low-activity repos have visible window patterns.

---

## Error States

### User Not Found (404)

```
⚠️ User "badusername" not found.  [×]
```

### Rate Limit Hit (403)

```
⚠️ GitHub API rate limit reached. Please wait a minute and try again.  [×]
```

### Generic Error

```
⚠️ Failed to load city. Check the username and try again.  [×]
```

All errors appear as a **dismissable toast** at the bottom-center of the screen. Click `×` to close.

---

## Keyboard Shortcuts

There are no explicit keyboard shortcuts defined, but standard browser behavior applies:

| Key | Effect |
|---|---|
| `Tab` | Focus next interactive element (search input → Explore button) |
| `Enter` | Submit search form (when input is focused) |
| `Escape` | Blur the currently focused element |

The 3D canvas itself captures mouse events but not keyboard events.
