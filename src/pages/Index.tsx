import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FontUploader } from '@/components/FontUploader';
import { FontGrid } from '@/components/FontGrid';
import { SearchBar } from '@/components/SearchBar';
import { useFonts } from '@/hooks/useFonts';

const Index = () => {
  const { fonts, loading, addFont, removeFont } = useFonts();
  const [search, setSearch] = useState('');
  const [previewText, setPreviewText] = useState('');

  const filteredFonts = useMemo(() => {
    if (!search.trim()) return fonts;
    const query = search.toLowerCase();
    return fonts.filter(
      (font) =>
        font.name.toLowerCase().includes(query) ||
        font.category.toLowerCase().includes(query)
    );
  }, [fonts, search]);

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
        <section className="mb-8">
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            previewText={previewText}
            onPreviewChange={setPreviewText}
            fontCount={filteredFonts.length}
          />
        </section>

        {/* Font Grid */}
        <section>
          <FontGrid
            fonts={filteredFonts}
            previewText={previewText}
            loading={loading}
            onDelete={removeFont}
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
