import { useState, useCallback } from 'react';
import { Upload, File, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FontFamily, 
  FontFile,
  generateFontId, 
  detectFontFormat,
  detectFontWeight,
  detectFontStyle,
} from '@/lib/fontDB';
import { toast } from '@/hooks/use-toast';

interface FontUploaderProps {
  onUpload: (font: FontFamily) => Promise<void>;
}

export function FontUploader({ onUpload }: FontUploaderProps) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FontFile[]>([]);
  const [fontName, setFontName] = useState('');
  const [category, setCategory] = useState<FontFamily['category']>('sans-serif');
  const [uploading, setUploading] = useState(false);

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
    const newFiles: FontFile[] = [];

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
      newFiles.push({
        name: file.name,
        weight: detectFontWeight(file.name),
        style: detectFontStyle(file.name),
        data: buffer,
        format: detectFontFormat(file.name),
      });

      // Auto-detect font name from first file if not set
      if (!fontName && newFiles.length === 1) {
        const baseName = file.name
          .replace(/\.(woff2?|ttf|otf|eot)$/i, '')
          .replace(/[-_](regular|bold|light|medium|semibold|thin|black|italic|oblique|\d{3})/gi, '')
          .replace(/[-_]/g, ' ')
          .trim();
        setFontName(baseName);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, [fontName]);

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
        title: 'No files selected',
        description: 'Please upload at least one font file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const font: FontFamily = {
        id: generateFontId(),
        name: fontName.trim(),
        category,
        files,
        createdAt: Date.now(),
      };

      await onUpload(font);
      
      toast({
        title: 'Font uploaded',
        description: `${fontName} has been added to your library`,
      });

      // Reset form
      setFiles([]);
      setFontName('');
      setCategory('sans-serif');
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Something went wrong while uploading the font',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Upload Font
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Font Family</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all
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
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium text-foreground">
              Drop font files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports WOFF2, WOFF, TTF, OTF, EOT
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Files ({files.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <File className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {weightLabels[file.weight] || file.weight} {file.style !== 'normal' && `• ${file.style}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          <Button 
            onClick={handleSubmit} 
            disabled={uploading || files.length === 0}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Add to Library'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
