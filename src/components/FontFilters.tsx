import { Heart, LayoutGrid, List } from 'lucide-react';
import { FontFamily } from '@/lib/fontDB';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';

export type CategoryFilter = FontFamily['category'] | 'all';
export type StyleFilter = 'all' | 'italic' | 'bold';
export type ViewMode = 'grid' | 'list';

interface FontFiltersProps {
  categoryFilter: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  styleFilter: StyleFilter;
  onStyleChange: (value: StyleFilter) => void;
  showFavoritesOnly: boolean;
  onShowFavoritesOnlyChange: (value: boolean) => void;
  favoritesCount: number;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
}

const categories: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
];

const styles: { value: StyleFilter; label: string }[] = [
  { value: 'all', label: 'All Styles' },
  { value: 'italic', label: 'Italic' },
  { value: 'bold', label: 'Bold' },
];

export function FontFilters({
  categoryFilter,
  onCategoryChange,
  styleFilter,
  onStyleChange,
  showFavoritesOnly,
  onShowFavoritesOnlyChange,
  favoritesCount,
  viewMode,
  onViewModeChange,
}: FontFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Favorites filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collection</p>
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => onShowFavoritesOnlyChange(!showFavoritesOnly)}
            className="gap-2"
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                {favoritesCount}
              </span>
            )}
          </Button>
        </div>

        {/* Category filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</p>
          <ToggleGroup
            type="single"
            value={categoryFilter}
            onValueChange={(v) => v && onCategoryChange(v as CategoryFilter)}
            className="flex flex-wrap gap-1"
          >
            {categories.map((cat) => (
              <ToggleGroupItem
                key={cat.value}
                value={cat.value}
                size="sm"
                className="text-xs px-3 py-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {cat.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Style filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Style</p>
          <ToggleGroup
            type="single"
            value={styleFilter}
            onValueChange={(v) => v && onStyleChange(v as StyleFilter)}
            className="flex flex-wrap gap-1"
          >
            {styles.map((style) => (
              <ToggleGroupItem
                key={style.value}
                value={style.value}
                size="sm"
                className="text-xs px-3 py-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {style.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* View mode switcher */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">View</p>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && onViewModeChange(v as ViewMode)}
          className="flex gap-1"
        >
          <ToggleGroupItem
            value="grid"
            size="sm"
            className="px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <LayoutGrid className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            size="sm"
            className="px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <List className="w-4 h-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
