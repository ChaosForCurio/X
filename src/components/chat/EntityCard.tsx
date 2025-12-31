
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EntityCardProps {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    attributes?: Record<string, string>;
    link?: string;
}

export function EntityCard({ title, subtitle, imageUrl, attributes, link }: EntityCardProps) {
    return (
        <div className="w-full my-6 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] shadow-2xl backdrop-blur-sm group/card hover:border-blue-500/20 transition-all duration-300">
            <div className="flex flex-col-reverse md:flex-row">
                {/* Left Content Section */}
                <div className="flex-1 p-6 flex flex-col justify-center">
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                                Bio & Facts
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight group-hover/card:text-blue-200 transition-colors">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-white/60 text-sm leading-relaxed line-clamp-4 md:line-clamp-none">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Attributes Grid */}
                    {attributes && Object.keys(attributes).length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {Object.entries(attributes).slice(0, 4).map(([key, value]) => (
                                <div key={key} className="bg-white/5 rounded-lg p-2 border border-white/5">
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{key}</div>
                                    <div className="text-xs text-white/90 font-medium truncate" title={value}>{value}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {link && (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors group/link w-fit"
                        >
                            Read Full Bio
                            <ExternalLink size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                        </a>
                    )}
                </div>

                {/* Right Image Section */}
                {imageUrl && (
                    <div className="md:w-1/3 min-h-[200px] relative overflow-hidden bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover/card:scale-105"
                            loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/40 md:to-transparent" />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
                    </div>
                )}
            </div>
        </div>
    );
}
