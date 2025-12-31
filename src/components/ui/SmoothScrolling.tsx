'use client';

import { ReactNode, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { usePathname } from 'next/navigation';

export default function SmoothScrolling({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        // Wait for element to be available
        const scrollContainer = document.getElementById('main-content');

        // Only initialize Lenis if we found the container or want window scroll
        // In our case, we want to scroll the #main-content div
        if (!scrollContainer) return;

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            wrapper: scrollContainer, // Target the specific container
            content: scrollContainer.firstElementChild as HTMLElement // Content is the direct child
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
