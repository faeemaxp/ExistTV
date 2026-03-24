'use client';

import { useState, useMemo } from 'react';
import { Search, Star, Tv, ChevronDown, X } from 'lucide-react';
import { Channel } from '@/utils/m3u-parser';
import { cn } from '@/lib/utils';
import { getCode } from 'country-list';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';


interface SidebarProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    favoriteIds?: Set<string>;
    onToggleFavorite?: (channel: Channel) => void;
    isOpen: boolean;
    onClose: () => void;
}

function getFlagUrl(countryCode: string) {
    if (!countryCode) return '';
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

export function Sidebar({
    channels,
    selectedChannel,
    onSelectChannel,
    favoriteIds = new Set(),
    onToggleFavorite,
    isOpen,
    onClose
}: SidebarProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedCountry, setSelectedCountry] = useState<string>('All');
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [limit, setLimit] = useState(50);

    const [showAllCategories, setShowAllCategories] = useState(false);

    // Categories
    const categories = useMemo(() => {
        const counts = channels.reduce((acc, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const unique = Object.keys(counts).sort();
        return [
            { name: 'All', count: channels.length },
            ...unique.map(cat => ({ name: cat, count: counts[cat] }))
        ];
    }, [channels]);

    // Split categories for "More" functionality
    const mainCategories = categories.slice(0, 5);
    const extraCategories = categories.slice(5);

    // Countries
    const countries = useMemo(() => {
        const relevantChannels = selectedCategory === 'All'
            ? channels
            : channels.filter(c => c.category === selectedCategory);

        const counts = relevantChannels.reduce((acc, c) => {
            if (c.country && c.country !== 'Unknown') {
                acc[c.country] = (acc[c.country] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const unique = Object.keys(counts).sort();
        return [
            { name: 'All', count: relevantChannels.length, code: '' },
            ...unique.map(name => ({
                name,
                count: counts[name],
                code: getCode(name) || ''
            }))
        ];
    }, [channels, selectedCategory]);

    // Filtered channels
    const matchedChannels = useMemo(() => {
        return channels.filter((c) => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
            const matchesCountry = selectedCountry === 'All' || c.country === selectedCountry;
            const matchesFavorite = !showFavorites || favoriteIds.has(c.id);
            return matchesSearch && matchesCategory && matchesCountry && matchesFavorite;
        });
    }, [channels, search, selectedCategory, selectedCountry, showFavorites, favoriteIds]);

    const visibleChannels = matchedChannels.slice(0, limit);
    const selectedCountryCode = selectedCountry !== 'All' ? getCode(selectedCountry) : null;

    return (
        <aside className={cn(
            "fixed md:relative h-full bg-bg border-r border-border flex flex-col z-40 transition-transform duration-300 shadow-2xl md:shadow-none",
            "w-80",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="flex-shrink-0 h-16 px-5 flex items-center justify-between border-b border-border/50 bg-bg/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <img src={`${basePath}/logo.svg`} className="h-7 w-7 transition-transform hover:scale-110" alt="ExistTV" />
                    <span className="font-bold text-lg tracking-tight text-fg">ExistTV</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-muted hover:text-fg transition-fast md:hidden rounded-full hover:bg-surface"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Search */}
            <div className="flex-shrink-0 p-4 border-b border-border/50">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted group-focus-within:text-fg transition-fast" />
                    <input
                        type="text"
                        placeholder="Search 10k+ channels..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setLimit(50); }}
                        className="w-full h-11 rounded-xl bg-surface/50 pl-10 pr-10 text-sm text-fg placeholder:text-muted border border-border focus:border-fg/40 focus:bg-surface outline-none transition-smooth"
                    />
                    {search && (
                        <button
                            onClick={() => { setSearch(''); setLimit(50); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fg transition-fast rounded-full hover:bg-surface"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex-shrink-0 p-4 space-y-3 border-b border-border/50 bg-surface/10">
                {/* Category Header + More Button */}
                <div className="flex items-center justify-between gap-2 relative">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Categories</span>
                    <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-smooth border flex items-center gap-1.5",
                            showAllCategories ? "bg-fg text-bg border-fg" : "bg-surface/50 text-muted hover:text-fg border-border"
                        )}
                    >
                        View All <ChevronDown className={cn("h-3 w-3 transition-transform", showAllCategories && "rotate-180")} />
                    </button>

                    {/* All Categories Dropdown/Grid */}
                    {showAllCategories && (
                        <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowAllCategories(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-surface border border-border rounded-2xl shadow-2xl z-30 animate-scale grid grid-cols-2 gap-2 max-h-64 overflow-y-auto scrollbar-none">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.name}
                                        onClick={() => { setSelectedCategory(cat.name); setSelectedCountry('All'); setLimit(50); setShowAllCategories(false); }}
                                        className={cn(
                                            "px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-fast text-left truncate flex items-center justify-between gap-2 border",
                                            selectedCategory === cat.name
                                                ? "bg-fg/10 text-fg border-fg/30"
                                                : "text-muted hover:bg-fg/5 hover:text-fg border-transparent"
                                        )}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        <span className="text-[9px] opacity-60 bg-border/40 px-1 rounded">{cat.count}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Category Pills (Current) */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
                    {mainCategories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => { setSelectedCategory(cat.name); setSelectedCountry('All'); setLimit(50); setShowAllCategories(false); }}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-smooth border",
                                selectedCategory === cat.name
                                    ? "bg-fg text-bg border-fg"
                                    : "bg-surface/50 text-muted hover:text-fg hover:border-fg/30 border-border"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {/* Country Dropdown */}
                    <div className="relative flex-[2]">
                        <button
                            onClick={() => setIsCountryOpen(!isCountryOpen)}
                            className={cn(
                                "w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface/50 text-muted hover:text-fg border transition-smooth flex items-center justify-between gap-2",
                                isCountryOpen ? "border-fg/40 text-fg" : "border-border"
                            )}
                        >
                            <span className="flex items-center gap-2 truncate">
                                {selectedCountryCode ? (
                                    <img src={getFlagUrl(selectedCountryCode)} alt="" className="w-4 h-3 object-contain rounded-sm" />
                                ) : (
                                    <span className="text-[14px]">🌍</span>
                                )}
                                <span className="truncate">{selectedCountry === 'All' ? 'Select Country' : selectedCountry}</span>
                            </span>
                            <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-smooth", isCountryOpen && "rotate-180")} />
                        </button>

                        {isCountryOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsCountryOpen(false)} />
                                <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl bg-surface border border-border shadow-2xl z-20 animate-scale scrollbar-none">
                                    <div className="p-1">
                                        {countries.map((country) => (
                                            <button
                                                key={country.name}
                                                onClick={() => { setSelectedCountry(country.name); setIsCountryOpen(false); setLimit(50); }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 text-xs flex items-center gap-3 transition-fast rounded-lg",
                                                    selectedCountry === country.name
                                                        ? "bg-fg/10 text-fg"
                                                        : "text-muted hover:bg-fg/5 hover:text-fg"
                                                )}
                                            >
                                                <span className="w-5 flex-shrink-0">
                                                    {country.code ? (
                                                        <img src={getFlagUrl(country.code)} alt="" className="w-5 h-3.5 object-contain rounded-sm" />
                                                    ) : (
                                                        <span className="text-[14px]">🌍</span>
                                                    )}
                                                </span>
                                                <span className="flex-1 truncate">{country.name === 'All' ? 'All Countries' : country.name}</span>
                                                <span className="text-[10px] bg-border/40 px-1.5 py-0.5 rounded-md text-muted font-bold group-hover:text-fg transition-fast">
                                                    {country.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowFavorites(!showFavorites)}
                        className={cn(
                            "flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-smooth flex items-center justify-center gap-2 border",
                            showFavorites
                                ? "bg-fg text-bg border-fg"
                                : "bg-surface/50 text-muted hover:text-fg hover:border-fg/30 border-border"
                        )}
                    >
                        <Star className="h-4 w-4" fill={showFavorites ? "currentColor" : "none"} />
                        <span className="hidden sm:inline">Favs</span>
                    </button>
                </div>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-0.5">
                    {visibleChannels.map((channel, idx) => (
                        <div
                            key={channel.id}
                            onClick={() => onSelectChannel(channel)}
                            style={{ animationDelay: `${Math.min(idx * 15, 200)}ms` }}
                            className={cn(
                                "group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-fast animate-up",
                                selectedChannel?.id === channel.id
                                    ? "bg-fg/10"
                                    : "hover:bg-surface"
                            )}
                        >
                            {/* Logo */}
                            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden">
                                {channel.logo ? (
                                    <img
                                        src={channel.logo}
                                        alt=""
                                        className="w-full h-full object-contain p-1"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <Tv className="h-4 w-4 text-muted" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-fg truncate">{channel.name}</p>
                                <p className="text-xs text-muted truncate">{channel.category}</p>
                            </div>

                            {/* Favorite */}
                            {onToggleFavorite && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(channel);
                                    }}
                                    className={cn(
                                        "p-1.5 rounded-full transition-fast",
                                        favoriteIds.has(channel.id)
                                            ? "text-fg"
                                            : "text-muted opacity-0 group-hover:opacity-100 hover:text-fg"
                                    )}
                                >
                                    <Star className="h-4 w-4" fill={favoriteIds.has(channel.id) ? "currentColor" : "none"} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Load More */}
                {visibleChannels.length < matchedChannels.length && (
                    <div className="p-3">
                        <button
                            onClick={() => setLimit(l => l + 50)}
                            className="w-full py-2.5 rounded-lg bg-surface border border-border text-muted hover:text-fg transition-fast text-xs font-medium"
                        >
                            Load more ({matchedChannels.length - visibleChannels.length} more)
                        </button>
                    </div>
                )}

                {visibleChannels.length === 0 && (
                    <div className="p-8 text-center">
                        <p className="text-muted text-sm">No channels found</p>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="flex-shrink-0 p-3 border-t border-border text-center">
                <p className="text-xs text-muted">
                    {matchedChannels.length} channels
                </p>
            </div>
        </aside>
    );
}
