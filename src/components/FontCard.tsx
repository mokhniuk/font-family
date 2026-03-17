import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Code, Trash2, Copy, Check, Link, Pencil, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FontFamily, FontFile, generateCSSImport, generateCSSLink, generateFontFaceCSS, getCSSUrl } from '@/lib/fontDB';
import { FontEditor } from './FontEditor';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface FontCardProps {
  font: FontFamily;
  previewText: string;
  previewSize: number;
  onDelete: (id: string) => void;
  onUpdate: (font: FontFamily) => Promise<void>;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  viewMode: 'grid' | 'list';
}

export function FontCard({
  font,
  previewText,
  previewSize,
  onDelete,
  onUpdate,
  onToggleFavorite,
  isFavorite,
  viewMode,
}: FontCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = !!user;

  const [showCode, setShowCode] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<FontFile | null>(null);

  const handleDownload = async () => {
    for (const file of font.files) {
      const allFiles = [
        { name: file.name, url: file.storageUrl! },
        ...(file.variants?.map((v) => ({ name: v.name, url: v.storageUrl! })) ?? []),
      ];

      for (const f of allFiles) {
        if (!f.url) continue;
        const response = await fetch(f.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }

    toast({ title: 'Download started', description: `Downloading ${font.files.length} style(s)` });
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copied!', description: `${type} copied to clipboard` });
  };

  const cssUrl = getCSSUrl(font.id);
  const cssImportCode = generateCSSImport(font.id);
  const cssLinkCode = generateCSSLink(font.id);
  const fontFaceCSS = generateFontFaceCSS(font);

  const cssUsage = `/* Option 1: CSS @import */
${cssImportCode}

/* Option 2: HTML <link> */
${cssLinkCode}

/* Then use in your CSS */
.your-element {
  font-family: '${font.name}', ${font.category};
}`;

  const htmlUsage = `<!-- Add to your <head> -->
${cssLinkCode}

<!-- Then use in your HTML -->
<p style="font-family: '${font.name}', ${font.category};">
  Your text here
</p>`;

  const fontFaceUsage = `/* Paste directly into your CSS (no server needed) */
${fontFaceCSS}

/* Then use in your CSS */
.your-element {
  font-family: '${font.name}', ${font.category};
}`;

  const weightLabels: Record<number, string> = {
    100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular',
    500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
  };

  const activeWeight = selectedStyle?.weight ?? 400;
  const activeStyle = selectedStyle?.style ?? 'normal';
  const isListView = viewMode === 'list';

  return (
    <>
      <div className={`group relative bg-card card-gradient border border-border rounded-xl p-6 transition-all hover:border-muted-foreground/50 hover:glow-subtle animate-fade-in ${isListView ? 'flex gap-6 items-start' : ''}`}>
        {/* Header */}
        <div className={`${isListView ? 'shrink-0 w-48' : 'mb-4'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3
                className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
                onClick={() => navigate(`/font/${font.id}`)}
              >
                {font.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{font.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {font.files.length} style{font.files.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {!isListView && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleFavorite(font.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    isFavorite
                      ? 'text-red-500 opacity-100'
                      : 'opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowEdit(true)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {font.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this font from the CDN. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(font.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className={`${isListView ? 'flex-1 min-w-0' : ''}`}>
          <div
            className={`${isListView ? 'min-h-[60px]' : 'min-h-[80px]'} flex items-center ${isListView ? '' : 'mb-4'} text-foreground transition-all`}
            style={{
              fontFamily: `'${font.name}', ${font.category}`,
              fontWeight: activeWeight,
              fontStyle: activeStyle,
              fontSize: `${previewSize}px`,
            }}
          >
            {previewText || 'The quick brown fox jumps over the lazy dog'}
          </div>

          {/* Weight chips */}
          <div className={`flex flex-wrap gap-2 ${isListView ? 'mt-3' : 'mb-4'}`}>
            {font.files.map((file, i) => (
              <Popover key={i}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setSelectedStyle(selectedStyle === file ? null : file)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      selectedStyle === file
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                        : 'bg-secondary text-secondary-foreground hover:bg-muted'
                    }`}
                    style={{
                      fontFamily: `'${font.name}', ${font.category}`,
                      fontWeight: file.weight,
                      fontStyle: file.style,
                    }}
                  >
                    {weightLabels[file.weight] || file.weight}
                    {file.style === 'italic' && ' Italic'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{font.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {weightLabels[file.weight] || file.weight}
                        {file.style === 'italic' && ' Italic'}
                      </Badge>
                    </div>
                    <div
                      className="text-xl leading-relaxed text-foreground"
                      style={{
                        fontFamily: `'${font.name}', ${font.category}`,
                        fontWeight: file.weight,
                        fontStyle: file.style,
                      }}
                    >
                      {previewText || 'The quick brown fox jumps over the lazy dog.'}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      font-weight: {file.weight}; font-style: {file.style};
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex gap-2 ${isListView ? 'shrink-0 items-center' : ''}`}>
          {isListView && (
            <>
              <button
                onClick={() => onToggleFavorite(font.id)}
                className={`p-2 rounded-lg transition-all ${
                  isFavorite ? 'text-red-500' : 'opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => setShowEdit(true)} className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {font.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this font from the CDN. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(font.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowCode(true)} className="gap-2">
            <Code className="w-4 h-4" />
            {!isListView && 'Get Code'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            {!isListView && 'Download'}
          </Button>
        </div>
      </div>

      {isAdmin && (
        <FontEditor font={font} open={showEdit} onOpenChange={setShowEdit} onSave={onUpdate} />
      )}

      {/* Code Dialog */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Use {font.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Link className="w-4 h-4" />
              CSS URL (via Edge Function)
            </label>
            <div className="flex gap-2">
              <Input value={cssUrl} readOnly className="font-mono text-xs flex-1" />
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(cssUrl, 'URL')}>
                {copied === 'URL' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="css" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="css" className="flex-1">CSS</TabsTrigger>
              <TabsTrigger value="html" className="flex-1">HTML</TabsTrigger>
              <TabsTrigger value="fontface" className="flex-1">@font-face</TabsTrigger>
            </TabsList>

            <TabsContent value="css" className="flex-1 min-h-0 mt-4">
              <div className="relative">
                <ScrollArea className="h-[280px] rounded-lg border border-border">
                  <pre className="p-4 bg-secondary text-sm font-mono">
                    <code className="text-foreground whitespace-pre">{cssUsage}</code>
                  </pre>
                </ScrollArea>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(cssUsage, 'CSS')} className="absolute top-2 right-4 z-10">
                  {copied === 'CSS' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="html" className="flex-1 min-h-0 mt-4">
              <div className="relative">
                <ScrollArea className="h-[280px] rounded-lg border border-border">
                  <pre className="p-4 bg-secondary text-sm font-mono">
                    <code className="text-foreground whitespace-pre">{htmlUsage}</code>
                  </pre>
                </ScrollArea>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(htmlUsage, 'HTML')} className="absolute top-2 right-4 z-10">
                  {copied === 'HTML' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="fontface" className="flex-1 min-h-0 mt-4">
              <div className="relative">
                <ScrollArea className="h-[280px] rounded-lg border border-border">
                  <pre className="p-4 bg-secondary text-sm font-mono">
                    <code className="text-foreground whitespace-pre">{fontFaceUsage}</code>
                  </pre>
                </ScrollArea>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(fontFaceUsage, '@font-face CSS')} className="absolute top-2 right-4 z-10">
                  {copied === '@font-face CSS' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
