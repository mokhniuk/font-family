import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Code, Pencil, Heart, User, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { FontFamily, getFont, generateCSSImport, generateCSSLink, generateFontFaceCSS, getCSSUrl } from '@/lib/fontDB';
import { useFonts } from '@/hooks/useFonts';
import { FontEditor } from '@/components/FontEditor';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Font pairing suggestions based on category
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

export default function FontDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fonts, updateFont } = useFonts();
  const { user } = useAuth();
  const isAdmin = !!user;
  const [font, setFont] = useState<FontFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [previewSize, setPreviewSize] = useState(32);
  const [showEdit, setShowEdit] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('fontFavorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    async function loadFont() {
      if (!id) return;
      setLoading(true);
      try {
        const loadedFont = await getFont(id);
        setFont(loadedFont || null);
      } catch (error) {
        console.error('Failed to load font:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFont();
  }, [id, fonts]);

  const toggleFavorite = () => {
    if (!font) return;
    const newFavorites = new Set(favorites);
    if (newFavorites.has(font.id)) {
      newFavorites.delete(font.id);
    } else {
      newFavorites.add(font.id);
    }
    setFavorites(newFavorites);
    localStorage.setItem('fontFavorites', JSON.stringify([...newFavorites]));
  };

  const handleDownload = async () => {
    if (!font) return;

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
    toast({
      title: 'Copied!',
      description: `${type} copied to clipboard`,
    });
  };

  const handleSaveFont = async (updatedFont: FontFamily) => {
    await updateFont(updatedFont);
    setFont(updatedFont);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading font...</div>
      </div>
    );
  }

  if (!font) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Font not found</p>
        <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Button>
      </div>
    );
  }

  const cssUrl = getCSSUrl(font.id);
  const cssImportCode = generateCSSImport(font.id);
  const cssLinkCode = generateCSSLink(font.id);
  const fontFaceCSS = generateFontFaceCSS(font);

  const isFavorite = favorites.has(font.id);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Library
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">{font.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">{font.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {font.files.length} style{font.files.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className={isFavorite ? 'text-red-500' : ''}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => setShowEdit(true)}>
                  <Pencil className="w-5 h-5" />
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowCode(true)} className="gap-2">
                <Code className="w-4 h-4" />
                Get Code
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Preview Section */}
        <section className="mb-12">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <Input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Type to preview..."
                className="flex-1"
              />
              <div className="flex items-center gap-3 min-w-[200px]">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{previewSize}px</span>
                <Slider
                  value={[previewSize]}
                  onValueChange={([v]) => setPreviewSize(v)}
                  min={12}
                  max={120}
                  step={1}
                  className="w-32"
                />
              </div>
            </div>
            <div
              className="p-6 bg-secondary rounded-lg text-foreground break-words"
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
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">All Styles</h2>
          <div className="grid gap-4">
            {font.files.map((file, index) => {
              const formats = [file.format, ...(file.variants?.map(v => v.format) || [])];
              return (
                <div key={index} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {weightLabels[file.weight] || file.weight}
                        {file.style === 'italic' && ' Italic'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Weight: {file.weight}
                      </span>
                      <div className="flex gap-1">
                        {formats.map((fmt, i) => (
                          <Badge key={i} variant="secondary" className="text-xs uppercase">
                            {fmt}
                          </Badge>
                        ))}
                      </div>
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Author & Info Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              About This Font
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              {font.author ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Author</p>
                  <p className="text-foreground font-medium">{font.author}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Author</p>
                  <p className="text-muted-foreground italic">Not specified</p>
                </div>
              )}

              {font.description ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-foreground">{font.description}</p>
                </div>
              ) : null}

              {font.license ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">License</p>
                  <p className="text-foreground">{font.license}</p>
                </div>
              ) : null}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="text-foreground capitalize">{font.category.replace('-', ' ')}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Added</p>
                <p className="text-foreground">
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

          {/* Font Pairings Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Font Pairing Ideas
            </h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
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
                <div className="space-y-3">
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

        {/* Sample Text Section */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Type Samples</h2>
          <div className="bg-card border border-border rounded-xl p-6 space-y-8">
            {/* Alphabet */}
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

            {/* Numbers & Symbols */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Numbers & Symbols</p>
              <div
                className="text-3xl text-foreground"
                style={{ fontFamily: `'${font.name}', ${font.category}` }}
              >
                0123456789
                <br />
                !@#$%^&*()_+-=[]{}|;':",./&lt;&gt;?
              </div>
            </div>

            {/* Paragraph */}
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
      </main>

      {isAdmin && (
        <FontEditor
          font={font}
          open={showEdit}
          onOpenChange={setShowEdit}
          onSave={handleSaveFont}
        />
      )}

      {/* Code Dialog */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Use {font.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-foreground">CSS URL (via Edge Function)</label>
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
    </div>
  );
}
