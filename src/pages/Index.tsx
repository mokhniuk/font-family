import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FontUploader } from '@/components/FontUploader';
import { FontGrid } from '@/components/FontGrid';
import { FontDetailModal } from '@/components/FontDetailModal';
import { SearchBar } from '@/components/SearchBar';
import { FontFilters, CategoryFilter, StyleFilter, ViewMode } from '@/components/FontFilters';
import { useFonts } from '@/hooks/useFonts';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { FontFamily } from '@/lib/fontDB';

const Index = () => {
  const { fonts, loading, error, addFont, updateFont, removeFont, refreshFonts } = useFonts();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewSize, setPreviewSize] = useState(24);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [cardOrigin, setCardOrigin] = useState<DOMRect | null>(null);

  const selectedFont = useMemo(
    () => (selectedFontId ? fonts.find((f) => f.id === selectedFontId) ?? null : null),
    [selectedFontId, fonts]
  );

  const handleOpenDetail = (font: FontFamily, rect: DOMRect) => {
    setSelectedFontId(font.id);
    setCardOrigin(rect);
  };

  const filteredFonts = useMemo(() => {
    return fonts.filter((font) => {
      if (showFavoritesOnly && !favorites.has(font.id)) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        if (!font.name.toLowerCase().includes(query) && !font.category.toLowerCase().includes(query)) return false;
      }

      if (categoryFilter !== 'all' && font.category !== categoryFilter) return false;

      if (styleFilter !== 'all') {
        if (styleFilter === 'italic' && !font.files.some(f => f.style === 'italic')) return false;
        if (styleFilter === 'bold' && !font.files.some(f => f.weight >= 600)) return false;
      }

      return true;
    });
  }, [fonts, search, categoryFilter, styleFilter, showFavoritesOnly, favorites]);

  const favoritesCount = useMemo(() => fonts.filter(f => favorites.has(f.id)).length, [fonts, favorites]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStyleFilter('all');
    setShowFavoritesOnly(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Toolbar: search + preview controls + upload */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <SearchBar
              search={search}
              onSearchChange={setSearch}
              previewText={previewText}
              onPreviewChange={setPreviewText}
              previewSize={previewSize}
              onPreviewSizeChange={setPreviewSize}
            />
          </div>
          <FontUploader onUpload={addFont} />
        </div>

        {/* Filters */}
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
          fontCount={filteredFonts.length}
        />

        {/* Font grid */}
        <FontGrid
          fonts={filteredFonts}
          totalFonts={fonts.length}
          previewText={previewText}
          previewSize={previewSize}
          loading={loading}
          error={error}
          isAdmin={!!user}
          onDelete={removeFont}
          onUpdate={updateFont}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          viewMode={viewMode}
          onRetry={refreshFonts}
          onClearFilters={clearFilters}
          onOpenDetail={handleOpenDetail}
        />
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-6">
          <p className="text-xs text-muted-foreground">Font Family — Self-hosted font service</p>
        </div>
      </footer>

      {selectedFont && cardOrigin && (
        <FontDetailModal
          font={selectedFont}
          originRect={cardOrigin}
          onClose={() => setSelectedFontId(null)}
          onUpdate={updateFont}
        />
      )}
    </div>
  );
};

export default Index;
