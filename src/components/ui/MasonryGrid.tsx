'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MasonryGridProps<T> {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    columnCount?: number;
    gap?: number;
}

export default function MasonryGrid<T>({ items, renderItem, columnCount = 3, gap = 16 }: MasonryGridProps<T>) {
    const [currentColumnCount, setCurrentColumnCount] = useState(columnCount);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const updateColumns = () => {
            const width = window.innerWidth;
            let cols = columnCount;

            if (width < 640) {
                cols = 1;
            } else if (width < 1024) {
                cols = 2;
            } else {
                cols = columnCount;
            }

            setCurrentColumnCount(cols);
        };

        const debouncedUpdate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(updateColumns, 100);
        };

        updateColumns();
        window.addEventListener('resize', debouncedUpdate);
        return () => {
            window.removeEventListener('resize', debouncedUpdate);
            clearTimeout(timeoutId);
        };
    }, [columnCount]);

    const columns = React.useMemo(() => {
        const newColumns: T[][] = Array.from({ length: currentColumnCount }, () => []);

        items.forEach((item, index) => {
            newColumns[index % currentColumnCount].push(item);
        });

        return newColumns;
    }, [items, currentColumnCount]);

    return (
        <div
            className="flex gap-4"
            style={{ gap: `${gap}px` }}
        >
            {columns.map((col, colIndex) => (
                <div
                    key={colIndex}
                    className="flex flex-col gap-4 flex-1"
                    style={{ gap: `${gap}px` }}
                >
                    {col.map((item, itemIndex) => (
                        <motion.div
                            key={itemIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: itemIndex * 0.05 }}
                        >
                            {renderItem(item)}
                        </motion.div>
                    ))}
                </div>
            ))}
        </div>
    );
}
