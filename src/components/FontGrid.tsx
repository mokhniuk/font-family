import { FontFamily } from '@/lib/fontDB';
import { FontCard } from './FontCard';

interface FontGridProps {
  fonts: FontFamily[];
  totalFonts: number;
  previewText: string;
  previewSize: number;
  loading: boolean;
  error?: string | null;
  isAdmin?: boolean;
  onDelete: (id: string) => void;
  onUpdate: (font: FontFamily) => Promise<void>;
  onToggleFavorite: (id: string) => void;
  favorites: Set<string>;
  viewMode: 'grid' | 'list';
  onRetry?: () => void;
  onClearFilters?: () => void;
}

export function FontGrid({
  fonts,
  totalFonts,
  previewText,
  previewSize,
  loading,
  error,
  isAdmin,
  onDelete,
  onUpdate,
  onToggleFavorite,
  favorites,
  viewMode,
  onRetry,
  onClearFilters,
}: FontGridProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p className="text-base font-medium text-foreground">Failed to load fonts</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-sm text-primary hover:underline mt-1">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`bg-card border border-border rounded-xl animate-pulse ${viewMode === 'grid' ? 'h-[320px]' : 'h-[120px]'}`}
          />
        ))}
      </div>
    );
  }

  // Library is empty (no fonts at all, regardless of filters)
  if (totalFonts === 0) {
    if (isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
          <p className="text-base font-medium text-foreground">Your font library is empty</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload font files and they'll be hosted on your CDN. Use the CSS URL in any project —
            no more Google Fonts dependency.
          </p>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>1. Click <span className="font-medium text-foreground">Upload Font</span> above</p>
            <p>2. Drop in your .woff2 / .ttf / .otf files</p>
            <p>3. Copy the CSS URL from any font card</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
        <p className="text-base font-medium text-foreground">No fonts yet</p>
        <p className="text-sm text-muted-foreground">The font library is empty.</p>
      </div>
    );
  }

  // Library has fonts but current filters/search returned nothing
  if (fonts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
        <p className="text-base font-medium text-foreground">No fonts match your search</p>
        <p className="text-sm text-muted-foreground">Try a different query or clear your filters.</p>
        {onClearFilters && (
          <button onClick={onClearFilters} className="text-sm text-primary hover:underline mt-1">
            Clear filters
          </button>
        )}
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
          isFavorite={favorites?.has(font.id) ?? false}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
