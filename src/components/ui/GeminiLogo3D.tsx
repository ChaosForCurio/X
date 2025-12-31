'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface GeminiLogo3DProps {
    mode?: 'default' | 'searching' | 'creative';
}

function XierieeAvatar({ mode = 'default' }: { mode?: 'default' | 'searching' | 'creative' }) {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const shellRef = useRef<THREE.Mesh>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        if (groupRef.current) {
            // Floating motion is handled by <Float>, but we can add subtle sway
            groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
        }

        if (coreRef.current) {
            // Core pulsing
            const scale = 1 + Math.sin(t * 3) * 0.1;
            coreRef.current.scale.set(scale, scale, scale);
        }

        if (shellRef.current) {
            // Shell rotation
            if (mode === 'searching') {
                shellRef.current.rotation.y -= 0.05;
                shellRef.current.rotation.x -= 0.02;
            } else {
                shellRef.current.rotation.y -= 0.01;
                shellRef.current.rotation.x -= 0.005;
            }
        }

        if (ring1Ref.current) {
            ring1Ref.current.rotation.x = t * 0.5;
            ring1Ref.current.rotation.y = t * 0.2;
        }

        if (ring2Ref.current) {
            ring2Ref.current.rotation.x = t * 0.3;
            ring2Ref.current.rotation.y = -t * 0.4;
        }
    });

    // Colors based on mode
    const coreColor = mode === 'searching' ? "#06b6d4" : mode === 'creative' ? "#ec4899" : "#6366f1"; // Cyan, Pink, Indigo
    const shellColor = mode === 'searching' ? "#22d3ee" : mode === 'creative' ? "#f472b6" : "#818cf8";

    return (
        <group ref={groupRef}>
            {/* Core Sphere */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial
                    color={coreColor}
                    emissive={coreColor}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            {/* Outer Shell (Icosahedron) */}
            <mesh ref={shellRef}>
                <icosahedronGeometry args={[1.1, 0]} />
                <meshStandardMaterial
                    color={shellColor}
                    wireframe
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Orbiting Rings */}
            <mesh ref={ring1Ref}>
                <torusGeometry args={[1.6, 0.02, 16, 100]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transparent opacity={0.5} />
            </mesh>

            <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.8, 0.02, 16, 100]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transparent opacity={0.3} />
            </mesh>

            {/* Sparkles for effect */}
            <Sparkles count={20} scale={3} size={2} speed={0.4} opacity={0.5} color={shellColor} />
        </group>
    );
}

export default function GeminiLogo3D({ mode = 'default' }: GeminiLogo3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={containerRef} className="w-full h-full">
            <Canvas
                eventSource={containerRef as React.RefObject<HTMLElement>}
                camera={{ position: [0, 0, 5], fov: 45 }}
                gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance", alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <XierieeAvatar mode={mode} />
                </Float>

                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
            </Canvas>
        </div>
    );
}
