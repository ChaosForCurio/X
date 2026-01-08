import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Register GSAP plugins
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin);
}

interface UseSmoothScrollOptions {
    /**
     * Duration of the scroll animation in seconds
     * @default 0.5
     */
    duration?: number;

    /**
     * GSAP easing function
     * @default "power1.out"
     */
    ease?: string;

    /**
     * Whether to enable smooth scrolling enhancement
     * Set to false to disable GSAP and use native scrolling
     * @default true
     */
    enabled?: boolean;

    /**
     * Only apply GSAP smooth scroll on desktop (allows native scroll on mobile)
     * @default true
     */
    desktopOnly?: boolean;

    /**
     * Sensitivity multiplier for the scroll wheel
     * @default 1
     */
    sensitivity?: number;
}

/**
 * Custom hook that provides GSAP-powered smooth scrolling for a container element
 * Enhances wheel scrolling on desktop while preserving native touch/mobile scrolling
 * 
 * IMPORTANT: This hook only enhances desktop mouse wheel scrolling.
 * Mobile touch scrolling and trackpad scrolling remain native for better compatibility.
 * 
 * @example
 * ```tsx
 * const scrollRef = useSmoothScroll({ duration: 0.5, ease: "power1.out" });
 * return <div ref={scrollRef} className="overflow-y-auto">...</div>
 * ```
 */
export function useSmoothScroll<T extends HTMLElement = HTMLDivElement>(
    options: UseSmoothScrollOptions = {}
) {
    const {
        duration = 0.5,
        ease = "power1.out",
        enabled = true,
        desktopOnly = true,
        sensitivity = 1
    } = options;

    const scrollContainerRef = useRef<T>(null);
    const targetScrollRef = useRef<number>(0);
    const animationRef = useRef<gsap.core.Tween | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        // Initialize targetScrollRef to current position
        targetScrollRef.current = scrollContainer.scrollTop;

        // Detect touch devices - disable smooth scroll on them for native behavior
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (desktopOnly && isTouchDevice) {
            // On mobile/touch devices, use native scroll
            return;
        }

        const handleWheel = (e: WheelEvent) => {
            // Prevent default scroll behavior so GSAP can fully control it
            e.preventDefault();

            // If the user tries to scroll while we're animating, we want to accumulate
            // but we also need to stay in sync with manual scroll (if any)
            const currentScroll = scrollContainer.scrollTop;

            // If the current scroll is far from our target (user scrolled manually), reset target
            if (Math.abs(currentScroll - (animationRef.current?.vars.scrollTop ?? currentScroll)) > 10) {
                targetScrollRef.current = currentScroll;
            }

            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;

            // Accumulate the delta
            targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current + e.deltaY * sensitivity));

            // Animate the scroll with accumulation support
            animationRef.current = gsap.to(scrollContainer, {
                scrollTop: targetScrollRef.current,
                duration,
                ease,
                overwrite: true,
                onUpdate: () => {
                    // Sync internal target with animation progress to allow interruption
                    // but we keep the main targetScrollRef for accumulation
                }
            });
        };

        // Also sync targetScrollRef on manual scroll events (scrollbars, keys, etc.)
        const handleNativeScroll = () => {
            // Only update if not animating
            if (!animationRef.current || !animationRef.current.isActive()) {
                targetScrollRef.current = scrollContainer.scrollTop;
            }
        };

        // Use passive: false to allow preventDefault() for proper GSAP control
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
        scrollContainer.addEventListener('scroll', handleNativeScroll, { passive: true });

        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel);
            scrollContainer.removeEventListener('scroll', handleNativeScroll);
            if (animationRef.current) {
                animationRef.current.kill();
            }
        };
    }, [duration, ease, enabled, desktopOnly, sensitivity]);

    return scrollContainerRef;
}

/**
 * Smoothly scrolls a container to a specific target element or position
 * 
 * @param container - The scroll container element
 * @param target - The target element to scroll to, or 'top', 'bottom', 'max', or a number for pixels
 * @param options - Animation options
 */
export function smoothScrollTo(
    container: HTMLElement | null,
    target: HTMLElement | 'top' | 'bottom' | 'max' | number,
    options: {
        duration?: number;
        ease?: string;
        offset?: number;
    } = {}
) {
    if (!container) return;

    const { duration = 0.8, ease = "power2.inOut", offset = 0 } = options;

    let scrollTarget: number | string;

    if (typeof target === 'number') {
        scrollTarget = target + offset;
    } else if (typeof target === 'string') {
        if (target === 'top') {
            scrollTarget = offset;
        } else if (target === 'bottom' || target === 'max') {
            scrollTarget = 'max';
        } else {
            scrollTarget = offset;
        }
    } else {
        // HTMLElement
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
        scrollTarget = relativeTop + offset;
    }

    gsap.to(container, {
        scrollTo: { y: scrollTarget, autoKill: false },
        duration,
        ease,
        overwrite: true
    });
}
