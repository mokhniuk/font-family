import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FontUploader } from '@/components/FontUploader';
import { FontGrid } from '@/components/FontGrid';
import { SearchBar } from '@/components/SearchBar';
import { FontFilters, CategoryFilter, StyleFilter, ViewMode } from '@/components/FontFilters';
import { useFonts } from '@/hooks/useFonts';

const FAVORITES_KEY = 'fonthost-favorites';

const Index = () => {
  const { fonts, loading, addFont, updateFont, removeFont } = useFonts();
  const [search, setSearch] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewSize, setPreviewSize] = useState(24);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...newFavorites]));
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    saveFavorites(newFavorites);
  };

  const filteredFonts = useMemo(() => {
    return fonts.filter((font) => {
      // Favorites filter
      if (showFavoritesOnly && !favorites.has(font.id)) {
        return false;
      }
      
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        if (!font.name.toLowerCase().includes(query) && 
            !font.category.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Category filter
      if (categoryFilter !== 'all' && font.category !== categoryFilter) {
        return false;
      }
      
      // Style filter - check if font has matching styles
      if (styleFilter !== 'all') {
        if (styleFilter === 'italic') {
          const hasItalic = font.files.some(f => f.style === 'italic');
          if (!hasItalic) return false;
        } else if (styleFilter === 'bold') {
          const hasBold = font.files.some(f => f.weight >= 600);
          if (!hasBold) return false;
        }
      }
      
      return true;
    });
  }, [fonts, search, categoryFilter, styleFilter, showFavoritesOnly, favorites]);

  const favoritesCount = useMemo(() => {
    return fonts.filter(f => favorites.has(f.id)).length;
  }, [fonts, favorites]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Hero */}
        <section className="text-center py-12 mb-8 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Your Fonts. Your Server.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Self-hosted font management. Upload, preview, and serve your fonts with complete control and privacy.
          </p>
          <FontUploader onUpload={addFont} />
        </section>

        {/* Search and Filters */}
        <section className="space-y-6 mb-8">
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            previewText={previewText}
            onPreviewChange={setPreviewText}
            previewSize={previewSize}
            onPreviewSizeChange={setPreviewSize}
            fontCount={filteredFonts.length}
          />
          
          <FontFilters
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            styleFilter={styleFilter}
            onStyleChange={setStyleFilter}
            showFavoritesOnly={showFavoritesOnly}
            onShowFavoritesOnlyChange={setShowFavoritesOnly}
            favoritesCount={favoritesCount}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </section>

        {/* Font Grid */}
        <section>
          <FontGrid
            fonts={filteredFonts}
            previewText={previewText}
            previewSize={previewSize}
            loading={loading}
            onDelete={removeFont}
            onUpdate={updateFont}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            viewMode={viewMode}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Font Family — Self-hosted font service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
