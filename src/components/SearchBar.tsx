import { Search, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  previewText: string;
  onPreviewChange: (value: string) => void;
  previewSize: number;
  onPreviewSizeChange: (value: number) => void;
  fontCount: number;
}

export function SearchBar({ 
  search, 
  onSearchChange, 
  previewText, 
  onPreviewChange,
  previewSize,
  onPreviewSizeChange,
  fontCount,
}: SearchBarProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search fonts..."
            className="pl-10"
          />
        </div>

        {/* Preview text */}
        <div className="relative flex-1 max-w-md">
          <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={previewText}
            onChange={(e) => onPreviewChange(e.target.value)}
            placeholder="Type to preview..."
            className="pl-10"
          />
        </div>

        {/* Font size slider */}
        <div className="flex items-center gap-3 min-w-[160px]">
          <span className="text-xs text-muted-foreground w-8">{previewSize}px</span>
          <Slider
            value={[previewSize]}
            onValueChange={([value]) => onPreviewSizeChange(value)}
            min={12}
            max={72}
            step={1}
            className="flex-1"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {fontCount} font{fontCount !== 1 ? 's' : ''} in library
      </p>
    </div>
  );
}
