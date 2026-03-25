'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Menu, X, Tv } from 'lucide-react';
import { Player } from '@/components/player';
import { Sidebar } from '@/components/sidebar';
import { Channel } from '@/utils/m3u-parser';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DashboardProps {
    initialChannels: Channel[];
}

export function Dashboard({ initialChannels }: DashboardProps) {
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('existtv_favorites');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setFavoriteIds(new Set(parsed));
                }
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    const toggleFavorite = (channel: Channel) => {
        const newFavs = new Set(favoriteIds);
        if (newFavs.has(channel.id)) {
            newFavs.delete(channel.id);
        } else {
            newFavs.add(channel.id);
        }
        setFavoriteIds(newFavs);
        localStorage.setItem('existtv_favorites', JSON.stringify(Array.from(newFavs)));
    };

    const handleSelectChannel = (channel: Channel) => {
        setSelectedChannel(channel);
        // On mobile, close sidebar when selecting
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-bg text-fg flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                channels={initialChannels}
                selectedChannel={selectedChannel}
                onSelectChannel={handleSelectChannel}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-bg relative">
                {/* Subtle Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

                {/* Header */}
                <header className="flex-shrink-0 h-16 px-6 flex items-center gap-4 border-b border-border/50 bg-bg/80 backdrop-blur-xl z-30 animate-in">
                    {/* Menu Toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2.5 -ml-2 text-muted hover:text-fg transition-smooth rounded-xl hover:bg-surface border border-transparent hover:border-border/50 md:hidden"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />

                    {/* Back */}
                    <Link
                        href="/"
                        className="hidden sm:flex items-center gap-2 group text-muted hover:text-fg transition-smooth"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium">Exit</span>
                    </Link>

                    {/* Channel Name */}
                    <div className="flex-1 min-w-0 ml-2">
                        {selectedChannel ? (
                            <div className="animate-in">
                                <h1 className="text-base font-bold tracking-tight truncate leading-tight">
                                    {selectedChannel.name}
                                </h1>
                                <p className="text-xs text-muted truncate font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    {selectedChannel.category}
                                </p>
                            </div>
                        ) : (
                            <h1 className="text-sm font-semibold text-muted">No channel playing</h1>
                        )}
                    </div>

                    {/* Favorite */}
                    {selectedChannel && (
                        <button
                            onClick={() => toggleFavorite(selectedChannel)}
                            className={cn(
                                "p-2.5 rounded-xl transition-smooth border animate-scale",
                                favoriteIds.has(selectedChannel.id)
                                    ? "text-fg bg-surface border-fg/30"
                                    : "text-muted hover:text-fg hover:bg-surface border-transparent"
                            )}
                        >
                            <Star
                                className="h-5 w-5"
                                fill={favoriteIds.has(selectedChannel.id) ? "currentColor" : "none"}
                            />
                        </button>
                    )}
                </header>

                {/* Player Area */}
                <div className="flex-1 flex items-center justify-center p-4 md:p-10 relative overflow-hidden">
                    <div className="w-full max-w-6xl z-10">
                        {selectedChannel ? (
                            <div className="animate-scale group relative">
                                {/* Player Glow */}
                                <div className="absolute -inset-4 bg-fg/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-smooth pointer-events-none" />
                                
                                <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-border/50 relative">
                                    <Player key={selectedChannel.id} url={selectedChannel.url} />
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video rounded-3xl bg-surface/30 border border-dashed border-border/50 flex items-center justify-center animate-up">
                                <div className="text-center space-y-6 max-w-sm px-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-fg/[0.03] border border-fg/10 flex items-center justify-center mx-auto animate-pulse">
                                            <Tv className="h-10 w-10 text-muted" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fg/10 animate-ping" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-bold text-fg tracking-tight">Ready to Stream</h2>
                                        <p className="text-sm text-muted leading-relaxed">
                                            Select a channel from the sidebar to start watching live content from around the world.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSidebarOpen(true)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-fg text-sm font-bold hover:opacity-90 transition-smooth md:hidden"
                                    >
                                        Open Sidebar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
