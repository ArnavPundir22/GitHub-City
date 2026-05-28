# 🏢 Building System

> Complete technical reference for the 3D skyscraper geometry, window lighting math, and animations in GitHub City.

---

## Overview

Each GitHub repository is rendered as a **realistic multi-segment skyscraper** using Three.js geometry. The building's physical form encodes repo metadata visually, and every individual window on every face of the building is lit based on real commit data from the last 52 weeks.

---

## Geometry Parameters

### Height

```js
heightScore = log2(stars + 2) × 2.5   +   log2(sizeKB + 2) × 0.8
totalHeight = clamp(heightScore, 3, 24)   // min 3 units, max 24 units
```

| Repo type | Approx height |
|---|---|
| Empty/new repo (0 stars, tiny) | ~3 units |
| Moderate repo (100 stars, 500KB) | ~10 units |
| Popular repo (10k stars, 5MB) | ~18 units |
| Massive repo (100k+ stars) | 24 units (capped) |

### Width

```js
baseW = 2.8 + min(forks / 200, 1.2)   // 2.8 to 4.0 units wide
baseD = 2.4                            // fixed depth
topW  = baseW × 0.7                    // upper tower is 70% of base width
topD  = baseD × 0.7
```

More community forks → wider building (represents community adoption).

### Floors

```js
floorHeight = 0.85 units per floor
floorCount  = max(floor(totalHeight / floorHeight), 5)
actualHeight = floorCount × floorHeight
```

---

## Building Segments

Each building is composed of **5 stacked segments** (bottom to top):

```
         ┌──────────┐  ← Antenna beacon (sphere)
         │          │
         ╪══════════╪  ← Antenna spire (cylinder, 3.5u tall)
         │          │
      ┌──┴──────────┴──┐  ← Rooftop penthouse (60% width)
      │                │
┌─────┴────────────────┴─────┐  ← Upper tower (topW × topD)
│                            │    floors [setbackAt → floorCount]
│                            │    width = baseW × 0.7
│                            │
├╌╌╌╌╌╌╌╌╌╌ SETBACK ╌╌╌╌╌╌╌╌┤  ← at 62% of total floor count
│                            │
│    Lower tower             │  ← Lower tower (baseW × baseD)
│                            │    floors [0 → setbackAt]
│                            │
├════════════════════════════┤  ← Podium step (slim slab)
│                            │
│          PODIUM            │  ← Wide lobby base (baseW+1.2 × baseD+1.2)
│                            │    height: 0.7 units
└════════════════════════════┘  ground (y=0)
```

### Setback

The setback happens at **62% of total floor count**:

```js
setbackAt = floor(floorCount × 0.62)
```

At this floor, the tower narrows from `baseW/baseD` to `topW/topD`. This matches classic Art Deco skyscraper design where the upper floors step inward.

### Floor Slabs

At every floor boundary, a thin horizontal slab is rendered:
```js
// slab dimensions
width  = isUpper ? topW + 0.12 : baseW + 0.12
depth  = isUpper ? topD + 0.12 : baseD + 0.12
height = 0.06 units
color  = #18181f (dark near-black steel)
```

---

## Window System

### Window Grid Layout

Windows are placed on **all 4 faces** of both the lower and upper tower segments:

| Segment | Face | Windows per row | Total windows |
|---|---|---|---|
| Lower base | Front & Back | 4 | `setbackAt × 4 × 2` |
| Lower base | Left & Right | 3 | `setbackAt × 3 × 2` |
| Upper tower | Front & Back | 3 | `(floorCount-setbackAt) × 3 × 2` |
| Upper tower | Left & Right | 2 | `(floorCount-setbackAt) × 2 × 2` |

Each window is a tiny `BoxGeometry(0.2, 0.28, 0.03)` mesh placed at:
```js
xSpacing = faceWidth / (winsPerRow + 1)
x = (col + 1) × xSpacing - faceWidth / 2
y = floor × floorHeight + floorHeight × 0.5
z = ±(halfFaceDepth + 0.025)   // sits just proud of the facade
```

### Week → Window Mapping

The 52-week participation data is spread linearly across all windows on a face:

```js
weekIdx = floor((windowIndex / totalWindowsOnFace) × 52) + weekOffset
commits = weeklyCommits[weekIdx] || 0
```

The **52-week array** has index `0` = oldest week, `51` = most recent week.

- Lower base front/back → `weeks[0..31]` (older activity)
- Upper tower front/back → `weeks[31..51]` (recent activity)
- Left/right faces use `weekOffset` to show different slices, creating a varied pattern around all 4 faces

### Window Color Scale

```js
function windowLight(commits, peakWeek) {
  if (commits === 0)          return { color: '#050810', intensity: 0   }  // dark off
  ratio = commits / peakWeek  // normalized to this repo's busiest week
  if (ratio < 0.15)           return { color: '#ffd27f', intensity: 0.6 }  // dim amber
  if (ratio < 0.40)           return { color: '#ffb347', intensity: 1.1 }  // warm orange
  if (ratio < 0.75)           return { color: '#fff176', intensity: 1.8 }  // bright yellow
  else                        return { color: '#ffffff', intensity: 3.0 }  // blazing white
}
```

Intensity applies as `emissiveIntensity` on `MeshStandardMaterial`. The window frame color is:
- `#b8923a` (warm brass) when lit
- `#080c18` (near-black) when dark

---

## Language Accent Colors

Each building gets a glow color based on the repo's primary language, using GitHub's official palette:

| Language | Color | Language | Color |
|---|---|---|---|
| JavaScript | `#f1e05a` | TypeScript | `#3178c6` |
| Python | `#3572A5` | Go | `#00ADD8` |
| Rust | `#dea584` | Java | `#b07219` |
| C | `#555555` | C++ | `#f34b7d` |
| C# | `#178600` | Ruby | `#701516` |
| PHP | `#4F5D95` | Swift | `#F05138` |
| Kotlin | `#A97BFF` | HTML | `#e34c26` |
| CSS | `#563d7c` | Shell | `#89e051` |
| Dart | `#00B4AB` | Scala | `#c22d40` |
| Vue | `#41b883` | Svelte | `#ff3e00` |
| *(other)* | `#00eeff` | | |

The accent color is applied to:
1. **Podium** — `emissiveIntensity: 0.2`
2. **Lower tower** — `emissiveIntensity: 0.04`
3. **Upper tower** — `emissiveIntensity: 0.07`
4. **Rooftop penthouse** — `emissiveIntensity: 0.15`
5. **Base point light** — intensity scales with commit activity: `0.8 + actRatio × 1.5`

---

## Rooftop Details

```
Rooftop penthouse:
  BoxGeometry(topW×0.6, 0.7, topD×0.6)
  Color: #0a0a14
  Emissive: langColor × 0.15

Antenna spire:
  CylinderGeometry(r_top=0.018, r_bottom=0.055, height=3.5, segments=8)
  Color: #4a4a58 (brushed steel)
  Metalness: 1.0

Antenna beacon (sphere):
  SphereGeometry(r=0.09)
  Color: #ff1010
  Emissive: #ff0000, intensity=3

Beacon point light:
  color: #ff0000
  intensity: blinks between 0 and 1.5 (sine wave at ~0.8Hz)
  distance: 5 units
```

---

## Animations

### Rise-In Animation (on mount)

When a city first loads, every building grows upward from the ground:

```js
const riseRef = useRef(0);   // progress: 0 → 1

useFrame((_, delta) => {
  if (riseRef.current < 1) {
    riseRef.current = min(riseRef.current + delta × 1.0, 1);
    groupRef.current.scale.y    = riseRef.current;           // scale height from 0→1
    groupRef.current.position.y = -(1 - riseRef.current) × 2; // lift from below ground
  }
});
```

Speed: `delta × 1.0` → takes approximately **1 second** per building to fully rise.

### Antenna Blink

```js
const blink = sin(Date.now() × 0.005) > 0 ? 1.5 : 0;
antennaLightRef.current.intensity = blink;
// Period: 2π / 0.005 ≈ 1257ms → ~0.8Hz blink rate
```

### Hover Scale

When `isHovered === true`:
```js
scale={[1.04, 1.0, 1.04]}  // 4% scale on X and Z only (not Y)
```

This causes the building to appear slightly wider/closer without affecting its height, giving a subtle "spotlight" feel without distortion.

---

## Billboard Labels

Each building has two text labels that always face the camera (using React Three Drei's `<Billboard>`):

```
Repo name:     fontSize=0.55, color=#ffffff (hovered) / #cccccc (normal)
               outlineWidth=0.03, outlineColor=#000000
               position: just above the antenna tip

Language·⭐stars: fontSize=0.32, color=langHex
               position: just below the name
```

Labels are rendered using `troika-three-text` (bundled with Drei) with signed distance field text for crisp rendering at any zoom level.
