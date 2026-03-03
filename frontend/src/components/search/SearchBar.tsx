import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, X, Calendar, Users, Globe, Lock, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import { format } from 'date-fns';

interface SearchResult {
    id: string;
    title: string;
    created_at: string;
    user_id: string;
    organization_id?: string | null;
    visibility?: string;
    rank: number;
    highlights: {
        title?: string;
        summary?: string;
        transcript?: string;
    };
}

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const debouncedQuery = useDebounce(query, 300);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                // Focus the input after a tick
                setTimeout(() => inputRef.current?.focus(), 0);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const searchMeetings = async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(debouncedQuery)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${session?.access_token}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setResults(data.results);
                    setSelectedIndex(-1);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        searchMeetings();
    }, [debouncedQuery]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    navigate(`/meeting/${results[selectedIndex].id}`);
                    setIsOpen(false);
                    setQuery('');
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    const getVisibilityIcon = (visibility?: string) => {
        switch (visibility) {
            case 'public':
                return <Globe className="h-3 w-3" />;
            case 'organization':
                return <Users className="h-3 w-3" />;
            default:
                return <Lock className="h-3 w-3" />;
        }
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    placeholder="Search meetings... (⌘K)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10"
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isOpen && (query.length >= 2 || results.length > 0) && (
                <Card className="absolute top-12 left-0 right-0 z-50 max-h-96 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result, index) => (
                                <div
                                    key={result.id}
                                    className={`px-4 py-3 hover:bg-muted cursor-pointer transition-colors ${index === selectedIndex ? 'bg-muted' : ''
                                        }`}
                                    onClick={() => {
                                        navigate(`/meeting/${result.id}`);
                                        setIsOpen(false);
                                        setQuery('');
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="font-medium">
                                            {result.highlights.title ? (
                                                <span dangerouslySetInnerHTML={{ __html: result.highlights.title }} />
                                            ) : (
                                                result.title
                                            )}
                                        </div>
                                        {result.visibility && (
                                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                {getVisibilityIcon(result.visibility)}
                                                {result.visibility}
                                            </Badge>
                                        )}
                                    </div>

                                    {result.highlights.summary && (
                                        <p
                                            className="text-sm text-muted-foreground mb-1 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: result.highlights.summary }}
                                        />
                                    )}

                                    {result.highlights.transcript && (
                                        <p
                                            className="text-xs text-muted-foreground mb-2 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: result.highlights.transcript }}
                                        />
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {format(new Date(result.created_at), 'MMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Relevance: {Math.round(result.rank * 100)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No results found for "{query}"</p>
                            <p className="text-sm">Try different keywords</p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};