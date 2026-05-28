import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { getLangColor } from '../utils/github';

// ─── Window color based on weekly commits ────────────────────────────────────
function windowLight(commits, peak) {
  if (commits === 0) return { color: new THREE.Color('#050810'), intensity: 0 };
  const ratio = Math.min(commits / Math.max(peak, 1), 1);
  if (ratio < 0.15) return { color: new THREE.Color('#ffd27f'), intensity: 0.6 };
  if (ratio < 0.4)  return { color: new THREE.Color('#ffb347'), intensity: 1.1 };
  if (ratio < 0.75) return { color: new THREE.Color('#fff176'), intensity: 1.8 };
  return               { color: new THREE.Color('#ffffff'),   intensity: 3.0 };
}

// ─── Single Window mesh ───────────────────────────────────────────────────────
function Window({ position, commits, peak }) {
  const { color, intensity } = windowLight(commits, peak);
  return (
    <mesh position={position}>
      <boxGeometry args={[0.2, 0.28, 0.03]} />
      <meshStandardMaterial
        color={intensity > 0 ? '#b8923a' : '#080c18'}
        emissive={color}
        emissiveIntensity={intensity}
        roughness={0.05}
        metalness={0.2}
      />
    </mesh>
  );
}

// ─── A face of windows mapped to weekly commits ───────────────────────────────
function WindowFace({ weeklyCommits, peak, floorCount, winsPerRow, floorHeight, faceW, offsetZ, weekOffset = 0 }) {
  const windows = useMemo(() => {
    const items = [];
    const totalWindows = floorCount * winsPerRow;
    for (let f = 0; f < floorCount; f++) {
      const y = f * floorHeight + floorHeight * 0.5;
      for (let w = 0; w < winsPerRow; w++) {
        const winIdx = f * winsPerRow + w;
        // Map window index → week index (52 weeks spread across all windows)
        const weekIdx = Math.floor((winIdx / totalWindows) * weeklyCommits.length) + weekOffset;
        const commits = weeklyCommits[Math.min(weekIdx, weeklyCommits.length - 1)] || 0;
        const xSpacing = faceW / (winsPerRow + 1);
        const x = (w + 1) * xSpacing - faceW / 2;
        items.push({ x, y, commits, key: `${f}-${w}` });
      }
    }
    return items;
  }, [weeklyCommits, floorCount, winsPerRow, floorHeight, faceW, weekOffset]);

  return (
    <group>
      {windows.map(({ x, y, commits, key }) => (
        <Window key={key} position={[x, y, offsetZ]} commits={commits} peak={peak} />
      ))}
    </group>
  );
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
  const groupRef   = useRef();
  const antennaRef = useRef();
  const riseRef    = useRef(0); // 0→1 animation progress

  // Rise-in animation on mount
  useFrame((_, delta) => {
    if (riseRef.current < 1) {
      riseRef.current = Math.min(riseRef.current + delta * 1.0, 1);
      if (groupRef.current) {
        groupRef.current.scale.y = riseRef.current;
        groupRef.current.position.y = -(1 - riseRef.current) * 2;
      }
    }
    // Blinking antenna
    if (antennaRef.current) {
      const blink = Math.sin(Date.now() * 0.005) > 0 ? 1.5 : 0;
      antennaRef.current.intensity = blink;
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

  // Activity ratio for glow intensity
  const weeklyMax   = repo.peakWeek || 1;
  const totalC      = repo.totalCommits || 0;
  const actRatio    = Math.min(totalC / 100, 1);

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
          emissive={accentColor} emissiveIntensity={0.2}
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
          emissive={accentColor} emissiveIntensity={0.04}
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
          emissive={accentColor} emissiveIntensity={0.07}
        />
      </mesh>

      {/* ── Floor slabs ── */}
      {slabs.map((s) => (
        <FloorSlab key={s.key} y={s.y + 0.76} w={s.w} d={s.d} />
      ))}

      {/* ── WINDOWS: Lower base (front/back) ── */}
      <group position={[0, 0.76, 0]}>
        <WindowFace weeklyCommits={baseWeeks} peak={weeklyMax}
          floorCount={setbackAt} winsPerRow={4} floorHeight={floorHeight}
          faceW={baseW} offsetZ={baseD / 2 + 0.025} />
        <WindowFace weeklyCommits={baseWeeks} peak={weeklyMax}
          floorCount={setbackAt} winsPerRow={4} floorHeight={floorHeight}
          faceW={baseW} offsetZ={-(baseD / 2 + 0.025)} />
        {/* Lower (left/right) */}
        <group rotation={[0, Math.PI / 2, 0]}>
          <WindowFace weeklyCommits={baseWeeks} peak={weeklyMax}
            floorCount={setbackAt} winsPerRow={3} floorHeight={floorHeight}
            faceW={baseD} offsetZ={baseW / 2 + 0.025} weekOffset={Math.floor(baseWeeks.length / 2)} />
          <WindowFace weeklyCommits={baseWeeks} peak={weeklyMax}
            floorCount={setbackAt} winsPerRow={3} floorHeight={floorHeight}
            faceW={baseD} offsetZ={-(baseW / 2 + 0.025)} weekOffset={Math.floor(baseWeeks.length / 3)} />
        </group>
      </group>

      {/* ── WINDOWS: Upper tower ── */}
      <group position={[0, setbackAt * floorHeight + 0.76, 0]}>
        <WindowFace weeklyCommits={topWeeks} peak={weeklyMax}
          floorCount={floorCount - setbackAt} winsPerRow={3} floorHeight={floorHeight}
          faceW={topW} offsetZ={topD / 2 + 0.025} />
        <WindowFace weeklyCommits={topWeeks} peak={weeklyMax}
          floorCount={floorCount - setbackAt} winsPerRow={3} floorHeight={floorHeight}
          faceW={topW} offsetZ={-(topD / 2 + 0.025)} />
        <group rotation={[0, Math.PI / 2, 0]}>
          <WindowFace weeklyCommits={topWeeks} peak={weeklyMax}
            floorCount={floorCount - setbackAt} winsPerRow={2} floorHeight={floorHeight}
            faceW={topD} offsetZ={topW / 2 + 0.025} weekOffset={Math.floor(topWeeks.length / 2)} />
          <WindowFace weeklyCommits={topWeeks} peak={weeklyMax}
            floorCount={floorCount - setbackAt} winsPerRow={2} floorHeight={floorHeight}
            faceW={topD} offsetZ={-(topW / 2 + 0.025)} weekOffset={Math.floor(topWeeks.length / 3)} />
        </group>
      </group>

      {/* ── Rooftop penthouse ── */}
      <mesh position={[0, actualHeight + 0.76 + 0.35, 0]} castShadow>
        <boxGeometry args={[topW * 0.6, 0.7, topD * 0.6]} />
        <meshStandardMaterial color="#0a0a14" roughness={0.3} metalness={0.9}
          emissive={accentColor} emissiveIntensity={0.15} />
      </mesh>

      {/* ── Antenna spire ── */}
      <mesh position={[0, actualHeight + 0.76 + 0.7 + 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.055, 3.5, 8]} />
        <meshStandardMaterial color="#4a4a58" roughness={0.2} metalness={1.0} />
      </mesh>

      {/* ── Antenna red beacon ── */}
      <mesh position={[0, actualHeight + 0.76 + 0.7 + 3.6, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#ff1010" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
      <pointLight
        ref={antennaRef}
        position={[0, actualHeight + 0.76 + 0.7 + 3.6, 0]}
        color="#ff0000" intensity={1.5} distance={5}
      />

      {/* ── Base glow (language-colored) ── */}
      <pointLight
        position={[0, 1.2, 0]}
        color={accentColor}
        intensity={0.8 + actRatio * 1.5}
        distance={7}
      />

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
