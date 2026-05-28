import React, { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Building from './Building';

// ── City-block grid layout ───────────────────────────────────────────────────
function getCityPosition(index, total) {
  const cols = Math.ceil(Math.sqrt(total));
  const row  = Math.floor(index / cols);
  const col  = index % cols;
  const spacing = 9;
  // Offset odd rows slightly for organic feel
  const rowOffset = row % 2 === 1 ? spacing * 0.45 : 0;
  const x = col * spacing - (cols * spacing) / 2 + spacing / 2 + rowOffset;
  const z = row * spacing - (Math.ceil(total / cols) * spacing) / 2 + spacing / 2;
  return [x, 0, z];
}

// ── Empty city scene (before search) ─────────────────────────────────────────
function EmptySceneContents() {
  return (
    <>
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 40, 140]} />
      <Stars radius={160} depth={60} count={8000} factor={5} saturation={0.8} fade speed={0.4} />

      {/* Scene lighting */}
      <ambientLight intensity={0.15} color="#445588" />
      <hemisphereLight args={['#08102a', '#02040a', 0.4]} />
      <directionalLight position={[-20, 40, -10]} intensity={0.4} color="#aaccff" />
      <pointLight position={[0, 8, 0]} intensity={2} color="#00ffff" distance={80} />

      <Grid
        position={[0, -0.01, 0]}
        args={[300, 300]}
        cellSize={1} cellThickness={0.7} cellColor="#0d2535"
        sectionSize={9} sectionThickness={1.6} sectionColor="#00ddbb"
        fadeDistance={100} fadeStrength={1.2} infiniteGrid
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#080c1a" roughness={0.95} />
      </mesh>
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={8} maxDistance={150}
        autoRotate autoRotateSpeed={0.3}
        enableDamping dampingFactor={0.05}
      />
      
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom intensity={1.2} luminanceThreshold={1} />
      </EffectComposer>
    </>
  );
}

// ── Full city scene ───────────────────────────────────────────────────────────
function CitySceneContents({ repos, hoveredRepo, onHover }) {
  return (
    <>
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 40, 160]} />
      <Stars radius={160} depth={60} count={8000} factor={5} saturation={0.8} fade speed={0.4} />

      {/* Ambient fill — moody cyberpunk base */}
      <ambientLight intensity={0.15} color="#445588" />

      {/* Sky/ground hemisphere */}
      <hemisphereLight args={['#08102a', '#02040a', 0.5]} />

      {/* Main moonlight — cool blue key light */}
      <directionalLight
        position={[-25, 50, -15]} intensity={0.5} color="#aaccff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={150}
        shadow-camera-left={-60} shadow-camera-right={60}
        shadow-camera-top={60} shadow-camera-bottom={-60}
      />

      {/* Warm golden/pink fill from the opposite side */}
      <directionalLight position={[40, 20, 30]} intensity={0.25} color="#ff00aa" />

      {/* Teal city-wide bounce light from below */}
      <pointLight position={[0, 2, 0]} intensity={3} color="#00ffee" distance={100} />

      {/* Atmospheric rim lights at city corners */}
      <pointLight position={[-40, 15, -40]} intensity={2.0} color="#ff0055" distance={80} />
      <pointLight position={[ 40, 15,  40]} intensity={2.0} color="#7700ff" distance={80} />
      <pointLight position={[-40, 15,  40]} intensity={1.5} color="#00ffcc" distance={80} />
      <pointLight position={[ 40, 15, -40]} intensity={1.5} color="#0022ff" distance={80} />

      {/* City grid floor */}
      <Grid
        position={[0, -0.01, 0]}
        args={[300, 300]}
        cellSize={1} cellThickness={0.7} cellColor="#0d2535"
        sectionSize={9} sectionThickness={1.6} sectionColor="#00ddbb"
        fadeDistance={100} fadeStrength={1.2} infiniteGrid
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#080c1a" roughness={0.95} />
      </mesh>

      {/* Buildings */}
      {repos.map((repo, i) => (
        <Building
          key={repo.name}
          repo={repo}
          position={getCityPosition(i, repos.length)}
          isHovered={hoveredRepo === repo.name}
          onPointerOver={() => onHover(repo.name)}
          onPointerOut={() => onHover(null)}
        />
      ))}

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={6} maxDistance={150}
        autoRotate={false}
        enableDamping dampingFactor={0.05}
      />
      
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom intensity={1.2} luminanceThreshold={1} />
      </EffectComposer>
    </>
  );
}

// ── Scene root ────────────────────────────────────────────────────────────────
export default function Scene({ cityData, hoveredRepo, onHover }) {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ position: [28, 18, 28], fov: 42 }}
        shadows
        gl={{ antialias: true }}
      >
        {cityData
          ? <CitySceneContents repos={cityData.repos} hoveredRepo={hoveredRepo} onHover={onHover} />
          : <EmptySceneContents />
        }
      </Canvas>
    </div>
  );
}
