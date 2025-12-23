import { FontFamily } from '@/lib/fontDB';
import { FontCard } from './FontCard';
import { Type } from 'lucide-react';

interface FontGridProps {
  fonts: FontFamily[];
  previewText: string;
  previewSize: number;
  loading: boolean;
  onDelete: (id: string) => void;
  onUpdate: (font: FontFamily) => Promise<void>;
  onToggleFavorite: (id: string) => void;
  favorites: Set<string>;
  baseUrl: string;
  viewMode: 'grid' | 'list';
}

export function FontGrid({ 
  fonts, 
  previewText, 
  previewSize, 
  loading, 
  onDelete, 
  onUpdate, 
  onToggleFavorite, 
  favorites, 
  baseUrl,
  viewMode,
}: FontGridProps) {
  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className={`bg-card border border-border rounded-xl animate-pulse ${viewMode === 'grid' ? 'h-[200px]' : 'h-[120px]'}`}
          />
        ))}
      </div>
    );
  }

  if (fonts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-secondary mb-4">
          <Type className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No fonts found
        </h3>
        <p className="text-muted-foreground max-w-md">
          No fonts match your filters. Try adjusting your search or upload a new font.
        </p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
      {fonts.map((font) => (
        <FontCard
          key={font.id}
          font={font}
          previewText={previewText}
          previewSize={previewSize}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favorites.has(font.id)}
          baseUrl={baseUrl}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
