import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { getLangColor } from '../utils/github';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// ─── Window color based on weekly commits ────────────────────────────────────
function getWindowColor(commits, peak) {
  if (commits === 0) return '#050810';
  const ratio = Math.min(commits / Math.max(peak, 1), 1);
  if (ratio < 0.15) return '#ffd27f';
  if (ratio < 0.4)  return '#ffb347';
  if (ratio < 0.75) return '#fff176';
  return '#ffffff';
}

function generateWindowsForFace(weeklyCommits, peak, floorCount, winsPerRow, floorHeight, faceW, offsetZ, rotationY, weekOffset = 0, baseY = 0) {
  const windows = [];
  const totalWindows = floorCount * winsPerRow;
  for (let f = 0; f < floorCount; f++) {
    const y = baseY + f * floorHeight + floorHeight * 0.5;
    for (let w = 0; w < winsPerRow; w++) {
      const winIdx = f * winsPerRow + w;
      // Map window index → week index (52 weeks spread across all windows)
      const weekIdx = Math.floor((winIdx / totalWindows) * weeklyCommits.length) + weekOffset;
      const commits = weeklyCommits[Math.min(weekIdx, weeklyCommits.length - 1)] || 0;
      const xSpacing = faceW / (winsPerRow + 1);
      const x = (w + 1) * xSpacing - faceW / 2;
      
      windows.push({ x, y, z: offsetZ, rotationY, color: getWindowColor(commits, peak) });
    }
  }
  return windows;
}

// ─── Floor slab ───────────────────────────────────────────────────────────────
function FloorSlab({ y, w, d }) {
  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[w + 0.12, 0.06, d + 0.12]} />
      <meshStandardMaterial color="#18181f" roughness={0.5} metalness={0.6} />
    </mesh>
  );
}

// ─── Main Building (represents one GitHub repo) ───────────────────────────────
export default function Building({ repo, position, isHovered, onPointerOver, onPointerOut }) {
  const groupRef      = useRef();
  const antennaMatRef = useRef();
  const instancedMeshRef = useRef();
  const riseRef       = useRef(0); // 0→1 animation progress

  // Rise-in animation on mount
  useFrame((_, delta) => {
    if (riseRef.current < 1) {
      riseRef.current = Math.min(riseRef.current + delta * 1.0, 1);
      if (groupRef.current) {
        groupRef.current.scale.y = riseRef.current;
        groupRef.current.position.y = -(1 - riseRef.current) * 2;
      }
    }
    // Blinking antenna emissive
    if (antennaMatRef.current) {
      const blink = Math.sin(Date.now() * 0.005) > 0 ? 3 : 0.5;
      antennaMatRef.current.emissiveIntensity = blink;
    }
  });

  // ── Geometry params ──────────────────────────────────────────────────────
  const stars      = repo.stars  || 0;
  const forks      = repo.forks  || 0;
  const sizeKB     = repo.size   || 10;

  // Height: driven by stars + repo size (log scale so it doesn't explode)
  const heightScore = Math.log2(stars + 2) * 2.5 + Math.log2(sizeKB + 2) * 0.8;
  const totalHeight = Math.max(3, Math.min(heightScore, 24));

  // Width: wider if many forks (community adoption)
  const baseW = 2.8 + Math.min(forks / 200, 1.2);
  const baseD = 2.4;
  const topW  = baseW * 0.7;
  const topD  = baseD * 0.7;

  const floorHeight  = 0.85;
  const floorCount   = Math.max(Math.floor(totalHeight / floorHeight), 5);
  const actualHeight = floorCount * floorHeight;
  const setbackAt    = Math.floor(floorCount * 0.62); // setback at 62% height

  // Language accent color
  const langHex    = getLangColor(repo.language);
  const accentColor = new THREE.Color(langHex);

  // Hover scale
  const hoverScale = isHovered ? 1.04 : 1.0;

  // ── Floor slab list ──────────────────────────────────────────────────────
  const slabs = useMemo(() => {
    const arr = [];
    for (let f = 0; f <= floorCount; f++) {
      const isUpper = f >= setbackAt;
      arr.push({ key: f, y: f * floorHeight, w: isUpper ? topW : baseW, d: isUpper ? topD : baseD });
    }
    return arr;
  }, [floorCount, setbackAt, floorHeight, baseW, baseD, topW, topD]);

  // ── Split weekly commits for base vs top segments ────────────────────────
  const splitIdx   = Math.floor(repo.weeklyCommits.length * 0.6);
  const baseWeeks  = repo.weeklyCommits.slice(0, splitIdx);
  const topWeeks   = repo.weeklyCommits.slice(splitIdx);
  const weeklyMax  = repo.peakWeek || 1;

  // ── Generate All Windows for InstancedMesh ───────────────────────────────
  const allWindows = useMemo(() => {
    const arr = [];
    
    // Base front/back (0.76 is the starting Y offset of the lower tower)
    arr.push(...generateWindowsForFace(baseWeeks, weeklyMax, setbackAt, 4, floorHeight, baseW, baseD / 2 + 0.025, 0, 0, 0.76));
    arr.push(...generateWindowsForFace(baseWeeks, weeklyMax, setbackAt, 4, floorHeight, baseW, -(baseD / 2 + 0.025), Math.PI, 0, 0.76));
    
    // Base left/right
    arr.push(...generateWindowsForFace(baseWeeks, weeklyMax, setbackAt, 3, floorHeight, baseD, baseW / 2 + 0.025, Math.PI / 2, Math.floor(baseWeeks.length / 2), 0.76));
    arr.push(...generateWindowsForFace(baseWeeks, weeklyMax, setbackAt, 3, floorHeight, baseD, -(baseW / 2 + 0.025), -Math.PI / 2, Math.floor(baseWeeks.length / 3), 0.76));

    // Top front/back
    const topBaseY = setbackAt * floorHeight + 0.76;
    const topCount = floorCount - setbackAt;
    arr.push(...generateWindowsForFace(topWeeks, weeklyMax, topCount, 3, floorHeight, topW, topD / 2 + 0.025, 0, 0, topBaseY));
    arr.push(...generateWindowsForFace(topWeeks, weeklyMax, topCount, 3, floorHeight, topW, -(topD / 2 + 0.025), Math.PI, 0, topBaseY));
    
    // Top left/right
    arr.push(...generateWindowsForFace(topWeeks, weeklyMax, topCount, 2, floorHeight, topD, topW / 2 + 0.025, Math.PI / 2, Math.floor(topWeeks.length / 2), topBaseY));
    arr.push(...generateWindowsForFace(topWeeks, weeklyMax, topCount, 2, floorHeight, topD, -(topW / 2 + 0.025), -Math.PI / 2, Math.floor(topWeeks.length / 3), topBaseY));
    
    return arr;
  }, [baseWeeks, topWeeks, weeklyMax, setbackAt, floorCount, floorHeight, baseW, baseD, topW, topD]);

  // Apply matrix and color to instanced mesh
  useLayoutEffect(() => {
    if (instancedMeshRef.current) {
      allWindows.forEach((win, i) => {
        tempObject.position.set(0, win.y, 0); // Start at Y level
        tempObject.rotation.set(0, win.rotationY, 0); // Apply face rotation
        tempObject.translateX(win.x); // Move along local X
        tempObject.translateZ(win.z); // Move along local Z
        tempObject.updateMatrix();
        
        instancedMeshRef.current.setMatrixAt(i, tempObject.matrix);
        instancedMeshRef.current.setColorAt(i, tempColor.set(win.color));
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [allWindows]);

  return (
    <group
      ref={groupRef}
      position={[position[0], 0, position[2]]}
      scale={[hoverScale, 1, hoverScale]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* ── Wide podium base ── */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[baseW + 1.2, 0.7, baseD + 1.2]} />
        <meshStandardMaterial
          color="#0f0f17" roughness={0.3} metalness={0.85}
          emissive={accentColor} emissiveIntensity={0.3}
        />
      </mesh>

      {/* Podium step */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[baseW + 0.5, 0.08, baseD + 0.5]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* ── Lower tower body ── */}
      <mesh
        position={[0, setbackAt * floorHeight * 0.5 + 0.76, 0]}
        castShadow receiveShadow
      >
        <boxGeometry args={[baseW, setbackAt * floorHeight, baseD]} />
        <meshStandardMaterial
          color="#111120" roughness={0.25} metalness={0.88}
          emissive={accentColor} emissiveIntensity={0.06}
        />
      </mesh>

      {/* ── Upper tower body ── */}
      <mesh
        position={[
          0,
          setbackAt * floorHeight + (floorCount - setbackAt) * floorHeight * 0.5 + 0.76,
          0,
        ]}
        castShadow receiveShadow
      >
        <boxGeometry args={[topW, (floorCount - setbackAt) * floorHeight, topD]} />
        <meshStandardMaterial
          color="#0c0c18" roughness={0.2} metalness={0.92}
          emissive={accentColor} emissiveIntensity={0.09}
        />
      </mesh>

      {/* ── Floor slabs ── */}
      {slabs.map((s) => (
        <FloorSlab key={s.key} y={s.y + 0.76} w={s.w} d={s.d} />
      ))}

      {/* ── ALL WINDOWS (Instanced) ── */}
      {allWindows.length > 0 && (
        <instancedMesh ref={instancedMeshRef} args={[null, null, allWindows.length]}>
          <boxGeometry args={[0.2, 0.28, 0.03]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </instancedMesh>
      )}

      {/* ── Rooftop penthouse ── */}
      <mesh position={[0, actualHeight + 0.76 + 0.35, 0]} castShadow>
        <boxGeometry args={[topW * 0.6, 0.7, topD * 0.6]} />
        <meshStandardMaterial color="#0a0a14" roughness={0.3} metalness={0.9}
          emissive={accentColor} emissiveIntensity={0.25} />
      </mesh>

      {/* ── Antenna spire ── */}
      <mesh position={[0, actualHeight + 0.76 + 0.7 + 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.055, 3.5, 8]} />
        <meshStandardMaterial color="#4a4a58" roughness={0.2} metalness={1.0} />
      </mesh>

      {/* ── Antenna red beacon (Faked light via emissive material) ── */}
      <mesh position={[0, actualHeight + 0.76 + 0.7 + 3.6, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial ref={antennaMatRef} color="#ff1010" emissive="#ff0000" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* ── Repo name label ── */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, actualHeight + 0.76 + 0.7 + 4.2, 0]}
          fontSize={0.55}
          color={isHovered ? '#ffffff' : '#cccccc'}
          anchorX="center" anchorY="middle"
          outlineWidth={0.03} outlineColor="#000000"
          maxWidth={8}
        >
          {repo.name}
        </Text>
        <Text
          position={[0, actualHeight + 0.76 + 0.7 + 3.6, 0]}
          fontSize={0.32}
          color={langHex}
          anchorX="center" anchorY="middle"
        >
          {repo.language || 'Unknown'} · ⭐{repo.stars}
        </Text>
      </Billboard>
    </group>
  );
}

