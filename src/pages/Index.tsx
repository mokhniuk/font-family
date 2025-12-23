import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FontUploader } from '@/components/FontUploader';
import { FontGrid } from '@/components/FontGrid';
import { SearchBar } from '@/components/SearchBar';
import { FontFilters, CategoryFilter, StyleFilter } from '@/components/FontFilters';
import { useFonts } from '@/hooks/useFonts';

const Index = () => {
  const { fonts, loading, addFont, updateFont, removeFont } = useFonts();
  const [search, setSearch] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all');
  
  // Base URL for CDN-style links (current origin in production, or localhost in dev)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const filteredFonts = useMemo(() => {
    return fonts.filter((font) => {
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
  }, [fonts, search, categoryFilter, styleFilter]);

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
            fontCount={filteredFonts.length}
          />
          
          <FontFilters
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            styleFilter={styleFilter}
            onStyleChange={setStyleFilter}
          />
        </section>

        {/* Font Grid */}
        <section>
          <FontGrid
            fonts={filteredFonts}
            previewText={previewText}
            loading={loading}
            onDelete={removeFont}
            onUpdate={updateFont}
            baseUrl={baseUrl}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              FontHost — Self-hosted font service
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              Fonts stored locally in IndexedDB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
