/**
 * Logo3D.jsx
 *
 * Three.js / React Three Fiber 3D logo renderer.
 *
 * Computer Graphics Concepts Used:
 *  • 3D Scene Graph          — hierarchical model-view hierarchy in Three.js
 *  • Perspective Projection  — PerspectiveCamera (FOV, near/far planes)
 *  • Mesh & Geometry         — BoxGeometry, CylinderGeometry, TorusGeometry, SphereGeometry
 *  • Material & Shading      — MeshStandardMaterial, MeshPhongMaterial, metalness/roughness PBR
 *  • Lighting                — AmbientLight, PointLight, SpotLight (phong shading model)
 *  • Transformations (3D)    — rotation per frame (continuous rotation animation)
 *  • Environment Mapping     — useEnvironment() HDRI environment for reflections
 *  • OrbitControls           — interactive camera — quaternion-based arc-ball rotation
 *  • Color Space             — sRGBEncoding for physically correct colour output
 */

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

// ─── Animated shape mesh ──────────────────────────────────────
function ShapeMesh({ shape, palette, effect }) {
    const ref = useRef();
    // CG: Rotation animation — updates model matrix every frame
    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.6;
            ref.current.rotation.x += delta * 0.15;
        }
    });

    // CG: PBR material — metalness/roughness parameters
    const matProps = {
        color: palette.primary,
        metalness: effect === 'metallic' ? 0.9 : effect === 'glass' ? 0.1 : 0.4,
        roughness: effect === 'metallic' ? 0.1 : effect === 'glass' ? 0.0 : 0.5,
        transparent: effect === 'glass',
        opacity: effect === 'glass' ? 0.65 : 1.0,
        envMapIntensity: 1.5,
    };

    // CG: Select geometry based on shape type
    const Geometry = () => {
        switch (shape) {
            case 'circle':
                return <sphereGeometry args={[1, 64, 64]} />;
            case 'diamond':
                return <octahedronGeometry args={[1, 0]} />;
            case 'hexagon':
                return <cylinderGeometry args={[1, 1, 0.3, 6]} />;
            case 'star':
                return <torusGeometry args={[0.8, 0.35, 16, 5]} />;
            case 'badge':
                return <cylinderGeometry args={[1, 1, 0.3, 8]} />;
            case 'arch':
                return <torusGeometry args={[0.9, 0.25, 16, 32, Math.PI]} />;
            case 'infinity':
                return <torusKnotGeometry args={[0.7, 0.25, 120, 16, 2, 3]} />;
            case 'shield':
            default:
                return <boxGeometry args={[1.4, 1.8, 0.3]} />;
        }
    };

    return (
        <mesh ref={ref} castShadow receiveShadow>
            <Geometry />
            {/* CG: MeshStandardMaterial — physically-based rendering */}
            <meshStandardMaterial {...matProps} />
        </mesh>
    );
}

// ─── Inner accent ring ────────────────────────────────────────
function AccentRing({ palette }) {
    const ref = useRef();
    // CG: Counter-rotation for visual interest
    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.z += delta * 0.8;
    });
    return (
        <mesh ref={ref}>
            <torusGeometry args={[1.6, 0.03, 16, 64]} />
            <meshStandardMaterial
                color={palette.accent}
                emissive={palette.accent}
                emissiveIntensity={0.6}
                metalness={0.8}
                roughness={0.2}
            />
        </mesh>
    );
}

// ─── Orbiting particles ───────────────────────────────────────
function OrbitParticles({ palette, count = 12 }) {
    const groupRef = useRef();
    // CG: Circular orbit transformation per frame
    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            const t = clock.getElapsedTime();
            const speed = 0.4 + i * 0.05;
            const angle = t * speed + (Math.PI * 2 * i) / count;
            const orbitR = 1.9 + (i % 3) * 0.3;
            child.position.set(
                Math.cos(angle) * orbitR,
                Math.sin(angle * 0.7) * 0.4,
                Math.sin(angle) * orbitR,
            );
        });
    });

    return (
        <group ref={groupRef}>
            {Array.from({ length: count }, (_, i) => (
                <mesh key={i}>
                    <sphereGeometry args={[0.04 + (i % 3) * 0.02, 8, 8]} />
                    <meshStandardMaterial
                        color={i % 2 === 0 ? palette.accent : palette.secondary}
                        emissive={i % 2 === 0 ? palette.accent : palette.secondary}
                        emissiveIntensity={1}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ─── Logo text (brand name / initials) ─────────────────────────
function LogoText({ config }) {
    const { name, initials, layout, palette } = config;
    const displayText = layout === 'monogram' ? initials : name?.toUpperCase?.() || name || 'LOGO';

    return (
        <Text
            position={[0, 0, 0.5]}
            fontSize={0.22}
            maxWidth={1.8}
            anchorX="center"
            anchorY="middle"
            color={palette.primary}
        >
            {displayText}
        </Text>
    );
}

// ─── Scene ────────────────────────────────────────────────────
function Scene({ config, compact = false }) {
    const { palette, shape, effect } = config;

    // CG: Three-point lighting setup — key / fill / rim
    return (
        <>
            {/* CG: Ambient light — flat base illumination */}
            <ambientLight intensity={0.3} />
            {/* CG: PointLight — positional, attenuated, Phong model */}
            <pointLight position={[4, 4, 4]} intensity={2} color={palette.primary} />
            <pointLight position={[-4, -3, -2]} intensity={1.5} color={palette.secondary} />
            <pointLight position={[0, 5, -4]} intensity={1} color={palette.accent} />

            {/* CG: HDRI Environment mapping — reflection/IBL (skip in compact to reduce flicker) */}
            {!compact && <Environment preset="city" />}

            {/* CG: Floating animation — reduced in compact mode to prevent flickering */}
            <Float speed={compact ? 1 : 2} rotationIntensity={compact ? 0 : 0.1} floatIntensity={compact ? 0 : 0.4}>
                <ShapeMesh shape={shape} palette={palette} effect={effect} />
                <AccentRing palette={palette} />
                <OrbitParticles palette={palette} />
                <Suspense fallback={null}>
                    <LogoText config={config} />
                </Suspense>
            </Float>

            {/* CG: OrbitControls — quaternion-based arcball */}
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate={false}
                maxPolarAngle={Math.PI * 0.75}
                minPolarAngle={Math.PI * 0.25}
            />
        </>
    );
}

// ─── React Component ──────────────────────────────────────────
export default function Logo3D({ config, compact = false }) {
    if (!config) return null;

    return (
        // CG: PerspectiveCamera — frustum culling, FOV, aspect ratio
        <Canvas
            camera={{ position: [0, 0, 4.5], fov: 50, near: 0.1, far: 100 }}
            shadows={!compact}
            dpr={compact ? [1, 1.5] : undefined}
            gl={{
                antialias: true,
                alpha: false,
                outputColorSpace: THREE.SRGBColorSpace,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2,
                powerPreference: compact ? 'low-power' : 'high-performance',
            }}
        >
            <Suspense fallback={null}>
                <Scene config={config} compact={compact} />
            </Suspense>
        </Canvas>
    );
}
