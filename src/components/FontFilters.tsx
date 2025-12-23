import { FontFamily } from '@/lib/fontDB';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type CategoryFilter = FontFamily['category'] | 'all';
export type StyleFilter = 'all' | 'italic' | 'bold';

interface FontFiltersProps {
  categoryFilter: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  styleFilter: StyleFilter;
  onStyleChange: (value: StyleFilter) => void;
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
}: FontFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
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
  );
}
