"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface AnimatedListProps {
    className?: string;
    children: React.ReactNode;
    delay?: number;
}

export const AnimatedList = React.memo(
    ({ className, children, delay = 100 }: AnimatedListProps) => {
        return (
            <motion.div
                className={`flex flex-col ${className}`}
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: delay / 1000,
                        },
                    },
                }}
            >
                <AnimatePresence mode="popLayout">
                    {React.Children.map(children, (child) => (
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 20, scale: 0.95 },
                                visible: { opacity: 1, y: 0, scale: 1 },
                            }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 500, damping: 50, mass: 1 }}
                            layout
                        >
                            {child}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        );
    }
);

AnimatedList.displayName = "AnimatedList";
