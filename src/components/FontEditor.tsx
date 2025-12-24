import { useState, useCallback, useEffect } from 'react';
import { Upload, File, X, Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FontFamily, 
  FontFile,
  detectFontFormat,
  detectFontWeight,
  detectFontStyle,
} from '@/lib/fontDB';
import { toast } from '@/hooks/use-toast';

interface FontEditorProps {
  font: FontFamily;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (font: FontFamily) => Promise<void>;
}

export function FontEditor({ font, open, onOpenChange, onSave }: FontEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FontFile[]>(font.files);
  const [fontName, setFontName] = useState(font.name);
  const [author, setAuthor] = useState(font.author || '');
  const [description, setDescription] = useState(font.description || '');
  const [license, setLicense] = useState(font.license || '');
  const [category, setCategory] = useState<FontFamily['category']>(font.category);
  const [saving, setSaving] = useState(false);

  // Reset form when font changes
  useEffect(() => {
    setFiles(font.files);
    setFontName(font.name);
    setAuthor(font.author || '');
    setDescription(font.description || '');
    setLicense(font.license || '');
    setCategory(font.category);
  }, [font]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (fileList: FileList) => {
    const validExtensions = ['.woff2', '.woff', '.ttf', '.otf', '.eot'];

    for (const file of Array.from(fileList)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a valid font file`,
          variant: 'destructive',
        });
        continue;
      }

      const buffer = await file.arrayBuffer();
      const weight = detectFontWeight(file.name);
      const style = detectFontStyle(file.name);
      const format = detectFontFormat(file.name);

      // Check if we already have a file with same weight+style - group as variant
      setFiles((prev) => {
        const existingIndex = prev.findIndex(
          (f) => f.weight === weight && f.style === style
        );
        
        if (existingIndex >= 0) {
          // Add as variant to existing
          const updated = [...prev];
          const existing = updated[existingIndex];
          const variants = existing.variants || [];
          variants.push({
            name: file.name,
            data: buffer,
            format,
          });
          updated[existingIndex] = { ...existing, variants };
          return updated;
        } else {
          // Add as new file
          return [...prev, {
            name: file.name,
            weight,
            style,
            data: buffer,
            format,
          }];
        }
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateFileWeight = useCallback((index: number, weight: number) => {
    setFiles((prev) => prev.map((f, i) => i === index ? { ...f, weight } : f));
  }, []);

  const updateFileStyle = useCallback((index: number, style: 'normal' | 'italic') => {
    setFiles((prev) => prev.map((f, i) => i === index ? { ...f, style } : f));
  }, []);

  const handleSubmit = async () => {
    if (!fontName.trim()) {
      toast({
        title: 'Font name required',
        description: 'Please enter a name for this font family',
        variant: 'destructive',
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'No files',
        description: 'A font family must have at least one font file',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const updatedFont: FontFamily = {
        ...font,
        name: fontName.trim(),
        category,
        files,
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        license: license.trim() || undefined,
      };

      await onSave(updatedFont);
      
      toast({
        title: 'Font updated',
        description: `${fontName} has been saved`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Something went wrong while saving the font',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const weightLabels: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };

  const weightOptions = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit Font Family
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Font name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Font Family Name
              </label>
              <Input
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                placeholder="e.g., Inter, Roboto, Playfair Display"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Category
              </label>
              <Select value={category} onValueChange={(v) => setCategory(v as FontFamily['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans-serif">Sans Serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="display">Display</SelectItem>
                  <SelectItem value="handwriting">Handwriting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Author</label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Google, Adobe"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            {/* License */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">License</label>
              <Input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g., OFL, Apache 2.0"
              />
            </div>

            {/* Font files */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Styles ({files.length})
              </p>
              
              {files.map((file, index) => (
                <div 
                  key={index}
                  className="p-3 bg-secondary rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium truncate max-w-[180px]">
                        {file.name}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Select 
                      value={file.weight.toString()} 
                      onValueChange={(v) => updateFileWeight(index, parseInt(v))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weightOptions.map((w) => (
                          <SelectItem key={w} value={w.toString()}>
                            {weightLabels[w]} ({w})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={file.style} 
                      onValueChange={(v) => updateFileStyle(index, v as 'normal' | 'italic')}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Italic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {/* Add more files */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-6 text-center transition-all
                ${isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-muted-foreground'
                }
              `}
            >
              <input
                type="file"
                accept=".woff2,.woff,.ttf,.otf,.eot"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm text-muted-foreground">
                Add more font files
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={saving || files.length === 0}
            className="flex-1 gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
