import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showSearch: boolean;
    setShowSearch: (show: boolean) => void;
    placeholder: string;
    setPlaceholder: (placeholder: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [placeholder, setPlaceholder] = useState('Chercher...');

    return (
        <SearchContext.Provider value={{ 
            searchQuery, 
            setSearchQuery, 
            showSearch, 
            setShowSearch,
            placeholder,
            setPlaceholder
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}
