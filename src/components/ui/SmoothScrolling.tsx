'use client';

import { ReactNode, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { usePathname } from 'next/navigation';

export default function SmoothScrolling({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        // Wait for element to be available
        const scrollContainer = document.getElementById('main-content');
        const scrollContent = document.getElementById('main-scroll-content');
        if (!scrollContainer || !scrollContent) return;

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            wrapper: scrollContainer,
            content: scrollContent
        });

        // Sync Lenis with scroll container
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, [pathname]); // Re-init on route change to be safe, though usually stable

    return <>{children}</>;
}
