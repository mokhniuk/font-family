import { useState, useEffect, useCallback } from 'react';
import { X, Download, Code, Heart, Pencil, ArrowUpRight, Check, Copy, Link, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FontFamily,
  FontFile,
  generateCSSImport,
  generateCSSLink,
  generateFontFaceCSS,
  getCSSUrl,
} from '@/lib/fontDB';
import { FontEditor } from './FontEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const categoryColors: Record<string, string> = {
  'sans-serif': 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'serif': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'monospace': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'display': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'handwriting': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

const weightLabels: Record<number, string> = {
  100: 'Thin', 200: 'Extra Light', 300: 'Light', 400: 'Regular',
  500: 'Medium', 600: 'Semi Bold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black',
};

const fontPairingSuggestions: Record<string, string[]> = {
  'sans-serif': ['A clean sans-serif pairs beautifully with a classic serif for body text', 'Try pairing with a display font for headlines', 'Works great with monospace for code snippets'],
  'serif': ['Classic serifs pair well with geometric sans-serifs', 'Use with a handwriting font for a personal touch', 'Combine with another serif of different contrast'],
  'monospace': ['Perfect for code, pair with a humanist sans-serif for UI', 'Use alongside a serif for documentation', 'Combines well with any clean sans-serif'],
  'display': ['Use sparingly for headlines, pair with a readable sans-serif for body', 'Works well with a neutral serif for elegant layouts', 'Combine with a simple monospace for technical sites'],
  'handwriting': ['Pair with a clean sans-serif for modern contrast', 'Use with a classic serif for a refined look', 'Keep body text in a readable font'],
};

const popularPairings = [
  { heading: 'Display', body: 'Sans-serif', description: 'Bold headlines with clean body text' },
  { heading: 'Serif', body: 'Sans-serif', description: 'Classic editorial style' },
  { heading: 'Sans-serif', body: 'Serif', description: 'Modern headings with traditional body' },
  { heading: 'Display', body: 'Serif', description: 'Eye-catching with elegant readability' },
];

interface FontDetailModalProps {
  font: FontFamily;
  originRect: DOMRect;
  onClose: () => void;
  onUpdate: (font: FontFamily) => Promise<void>;
}

export function FontDetailModal({ font, originRect, onClose, onUpdate }: FontDetailModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const isAdmin = !!user;
  const isFavorite = favorites.has(font.id);

  const [visible, setVisible] = useState(false);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [previewSize, setPreviewSize] = useState(32);
  const [showCode, setShowCode] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Expand animation — one rAF so the initial scale is painted before transitioning
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 320);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  // Compute transform-origin so the modal appears to grow from the clicked card
  const modalMaxW = Math.min(window.innerWidth * 0.92, 820);
  const modalMaxH = window.innerHeight * 0.9;
  const modalLeft = (window.innerWidth - modalMaxW) / 2;
  const modalTop = (window.innerHeight - modalMaxH) / 2;
  const cardCenterX = originRect.left + originRect.width / 2;
  const cardCenterY = originRect.top + originRect.height / 2;
  const originX = cardCenterX - modalLeft;
  const originY = cardCenterY - modalTop;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      for (const file of font.files) {
        const allFiles = [
          { name: file.name, url: file.storageUrl! },
          ...(file.variants?.map((v) => ({ name: v.name, url: v.storageUrl! })) ?? []),
        ];
        for (const f of allFiles) {
          if (!f.url) continue;
          const response = await fetch(f.url);
          if (!response.ok) throw new Error(`Failed to download ${f.name}`);
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
    } catch (error: any) {
      toast({ title: 'Download failed', description: error.message, variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
        onClick={handleClose}
      />

      {/* Modal centering wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            width: `min(92vw, 820px)`,
            maxHeight: '90vh',
            transformOrigin: `${originX}px ${originY}px`,
            transform: visible ? 'scale(1)' : 'scale(0.45)',
            opacity: visible ? 1 : 0,
            transition: visible
              ? 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease'
              : 'transform 260ms cubic-bezier(0.4, 0, 1, 1), opacity 180ms ease',
          }}
        >
          {/* Header */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  className="text-2xl font-semibold text-foreground truncate leading-tight"
                  style={{ fontFamily: `'${font.name}', ${font.category}` }}
                  title={font.name}
                >
                  {font.name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[font.category] ?? 'bg-secondary text-secondary-foreground'}`}>
                    {font.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {font.files.length} style{font.files.length !== 1 ? 's' : ''}
                  </span>
                  {font.author && (
                    <span className="text-xs text-muted-foreground">· {font.author}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => toggleFavorite(font.id)}
                  className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-red-500' : 'text-muted-foreground hover:bg-muted'}`}
                  title="Favourite"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowEdit(true)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { handleClose(); setTimeout(() => navigate(`/font/${font.id}`), 320); }}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  title="Open full page"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-6 space-y-10">

              {/* Preview Section */}
              <section>
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <Input
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="Type to preview…"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-3 min-w-[180px] shrink-0">
                      <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">{previewSize}px</span>
                      <Slider
                        value={[previewSize]}
                        onValueChange={([v]) => setPreviewSize(v)}
                        min={12}
                        max={120}
                        step={1}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <div
                    className="p-5 bg-secondary rounded-lg text-foreground break-words"
                    style={{
                      fontFamily: `'${font.name}', ${font.category}`,
                      fontSize: `${previewSize}px`,
                      lineHeight: 1.4,
                    }}
                  >
                    {previewText || 'The quick brown fox jumps over the lazy dog'}
                  </div>
                </div>
              </section>

              {/* All Styles Section */}
              <section>
                <h3 className="text-base font-semibold mb-3">All Styles</h3>
                <div className="grid gap-3">
                  {font.files.map((file, index) => {
                    const formats = [file.format, ...(file.variants?.map(v => v.format) || [])];
                    return (
                      <div key={index} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline">
                            {weightLabels[file.weight] || file.weight}
                            {file.style === 'italic' && ' Italic'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Weight: {file.weight}</span>
                          <div className="flex gap-1">
                            {formats.map((fmt, i) => (
                              <Badge key={i} variant="secondary" className="text-xs uppercase">{fmt}</Badge>
                            ))}
                          </div>
                        </div>
                        <div
                          className="text-2xl text-foreground"
                          style={{
                            fontFamily: `'${font.name}', ${font.category}`,
                            fontWeight: file.weight,
                            fontStyle: file.style,
                          }}
                        >
                          {previewText || 'The quick brown fox jumps over the lazy dog'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* About + Pairing 2-column */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* About This Font */}
                <section>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    About This Font
                  </h3>
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Author</p>
                      {font.author
                        ? <p className="text-foreground font-medium">{font.author}</p>
                        : <p className="text-muted-foreground italic text-sm">Not specified</p>
                      }
                    </div>

                    {font.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Description</p>
                        <p className="text-foreground text-sm">{font.description}</p>
                      </div>
                    )}

                    {font.license && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">License</p>
                        <p className="text-foreground text-sm">{font.license}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <p className="text-foreground text-sm capitalize">{font.category.replace('-', ' ')}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Added</p>
                      <p className="text-foreground text-sm">
                        {new Date(font.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-2">
                        <Pencil className="w-4 h-4" />
                        Edit Info
                      </Button>
                    )}
                  </div>
                </section>

                {/* Font Pairing Ideas */}
                <section>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Font Pairing Ideas
                  </h3>
                  <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Suggestions for {font.category}</p>
                      <ul className="space-y-2">
                        {fontPairingSuggestions[font.category]?.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-primary mt-1">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Popular Pairings</p>
                      <div className="space-y-2">
                        {popularPairings.map((pair, i) => (
                          <div key={i} className="p-3 bg-secondary rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{pair.heading}</Badge>
                              <span className="text-muted-foreground text-xs">+</span>
                              <Badge variant="outline" className="text-xs">{pair.body}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{pair.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Type Samples */}
              <section>
                <h3 className="text-base font-semibold mb-3">Type Samples</h3>
                <div className="bg-card border border-border rounded-xl p-5 space-y-7">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Alphabet</p>
                    <div
                      className="text-3xl text-foreground"
                      style={{ fontFamily: `'${font.name}', ${font.category}` }}
                    >
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ
                      <br />
                      abcdefghijklmnopqrstuvwxyz
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Numbers & Symbols</p>
                    <div
                      className="text-3xl text-foreground"
                      style={{ fontFamily: `'${font.name}', ${font.category}` }}
                    >
                      0123456789
                      <br />
                      {'!@#$%^&*()_+-=[]{}|;\':",./'}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Paragraph</p>
                    <div
                      className="text-lg leading-relaxed text-foreground"
                      style={{ fontFamily: `'${font.name}', ${font.category}` }}
                    >
                      Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing (leading), and letter-spacing (tracking), as well as adjusting the space between pairs of letters (kerning).
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-border flex gap-2">
            <Button variant="default" size="sm" onClick={() => setShowCode(true)} className="gap-2 flex-1">
              <Code className="w-4 h-4" />
              Get Code
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="gap-2 flex-1">
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading…' : 'Download'}
            </Button>
          </div>
        </div>
      </div>

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
                <ScrollArea className="h-[250px] rounded-lg border border-border">
                  <pre className="p-4 bg-secondary text-sm font-mono">
                    <code className="text-foreground whitespace-pre">{`${cssImportCode}

/* Or use HTML link */
${cssLinkCode}

/* Then use in your CSS */
.your-element {
  font-family: '${font.name}', ${font.category};
}`}</code>
                  </pre>
                </ScrollArea>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(cssImportCode, 'CSS')} className="absolute top-2 right-4 z-10">
                  {copied === 'CSS' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="html" className="flex-1 min-h-0 mt-4">
              <div className="relative">
                <ScrollArea className="h-[250px] rounded-lg border border-border">
                  <pre className="p-4 bg-secondary text-sm font-mono">
                    <code className="text-foreground whitespace-pre">{`<!-- Add to your <head> -->
${cssLinkCode}

<!-- Then use in your HTML -->
<p style="font-family: '${font.name}', ${font.category};">
  Your text here
</p>`}</code>
                  </pre>
                </ScrollArea>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(cssLinkCode, 'HTML')} className="absolute top-2 right-4 z-10">
                  {copied === 'HTML' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="fontface" className="flex-1 min-h-0 mt-4">
              <div className="relative">
                <ScrollArea className="h-[250px] rounded-lg border border-border">
                  <pre className="p-4 bg-secondary text-sm font-mono">
                    <code className="text-foreground whitespace-pre">{`/* Paste directly into your CSS (no Edge Function needed) */
${fontFaceCSS}

.your-element {
  font-family: '${font.name}', ${font.category};
}`}</code>
                  </pre>
                </ScrollArea>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(fontFaceCSS, '@font-face')} className="absolute top-2 right-4 z-10">
                  {copied === '@font-face' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <FontEditor font={font} open={showEdit} onOpenChange={setShowEdit} onSave={onUpdate} />
      )}
    </>
  );
}
