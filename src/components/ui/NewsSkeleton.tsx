import React from 'react';

export default function NewsSkeleton() {
    return (
        <div className="p-6 space-y-10 animate-pulse">
            {/* Main Player Skeleton */}
            <div className="w-full max-w-7xl mx-auto mb-12">
                <div className="space-y-4">
                    {/* Video Placeholder */}
                    <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/10" />

                    {/* Title & Metadata */}
                    <div className="space-y-3">
                        <div className="h-8 w-3/4 bg-white/10 rounded-lg" />
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-32 bg-white/10 rounded" />
                            <div className="h-4 w-24 bg-white/10 rounded" />
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="h-4 w-full bg-white/5 rounded" />
                            <div className="h-4 w-5/6 bg-white/5 rounded" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections Skeleton */}
            {[1, 2, 3].map((section) => (
                <div key={section}>
                    <div className="h-8 w-48 bg-white/10 rounded-lg mb-4 border-l-4 border-white/20 pl-3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden h-full">
                                {/* Thumbnail */}
                                <div className="aspect-video bg-white/10" />

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                    <div className="h-4 w-full bg-white/10 rounded" />
                                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                                    <div className="flex items-center gap-3 pt-1">
                                        <div className="h-3 w-20 bg-white/5 rounded" />
                                        <div className="h-3 w-16 bg-white/5 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
