import { FontFamily } from '@/lib/fontDB';
import { FontCard } from './FontCard';
import { Type } from 'lucide-react';

interface FontGridProps {
  fonts: FontFamily[];
  previewText: string;
  loading: boolean;
  onDelete: (id: string) => void;
  onUpdate: (font: FontFamily) => Promise<void>;
  baseUrl: string;
}

export function FontGrid({ fonts, previewText, loading, onDelete, onUpdate, baseUrl }: FontGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="h-[200px] bg-card border border-border rounded-xl animate-pulse"
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fonts.map((font) => (
        <FontCard
          key={font.id}
          font={font}
          previewText={previewText}
          onDelete={onDelete}
          onUpdate={onUpdate}
          baseUrl={baseUrl}
        />
      ))}
    </div>
  );
}
