import { useState } from 'react';
import { Download, Code, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontFamily, generateInlineCSS } from '@/lib/fontDB';
import { toast } from '@/hooks/use-toast';

interface FontCardProps {
  font: FontFamily;
  previewText: string;
  onDelete: (id: string) => void;
}

export function FontCard({ font, previewText, onDelete }: FontCardProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleDownload = () => {
    font.files.forEach((file) => {
      const blob = new Blob([file.data], { type: `font/${file.format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });

    toast({
      title: 'Download started',
      description: `Downloading ${font.files.length} file(s)`,
    });
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

  const cssCode = generateInlineCSS(font);
  const cssImport = `/* Add to your CSS */\n${cssCode}\n/* Then use it */\n.your-element {\n  font-family: '${font.name}', ${font.category};\n}`;
  const htmlUsage = `<!-- In your HTML/JSX -->\n<p style="font-family: '${font.name}', ${font.category};">Your text here</p>`;

  const weightLabels: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };

  return (
    <>
      <div className="group relative bg-card card-gradient border border-border rounded-xl p-6 transition-all hover:border-muted-foreground/50 hover:glow-subtle animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{font.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {font.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {font.files.length} style{font.files.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
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
                  This will permanently remove this font from your library. This action cannot be undone.
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
        </div>

        {/* Preview */}
        <div 
          className="min-h-[80px] flex items-center mb-4 text-2xl text-foreground"
          style={{ fontFamily: `'${font.name}', ${font.category}` }}
        >
          {previewText || 'The quick brown fox jumps over the lazy dog'}
        </div>

        {/* Weights preview */}
        <div className="flex flex-wrap gap-2 mb-4">
          {font.files.map((file, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground"
              style={{ 
                fontFamily: `'${font.name}', ${font.category}`,
                fontWeight: file.weight,
                fontStyle: file.style,
              }}
            >
              {weightLabels[file.weight] || file.weight}
              {file.style === 'italic' && ' Italic'}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCode(true)}
            className="flex-1 gap-2"
          >
            <Code className="w-4 h-4" />
            Get Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Code Dialog */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Use {font.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="css" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="css" className="flex-1">CSS</TabsTrigger>
              <TabsTrigger value="html" className="flex-1">HTML/JSX</TabsTrigger>
            </TabsList>

            <TabsContent value="css" className="mt-4">
              <div className="relative">
                <pre className="p-4 bg-secondary rounded-lg overflow-x-auto text-sm font-mono max-h-[400px] overflow-y-auto">
                  <code className="text-foreground">{cssImport}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(cssImport, 'CSS')}
                  className="absolute top-2 right-2"
                >
                  {copied === 'CSS' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="html" className="mt-4">
              <div className="relative">
                <pre className="p-4 bg-secondary rounded-lg overflow-x-auto text-sm font-mono">
                  <code className="text-foreground">{htmlUsage}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(htmlUsage, 'HTML')}
                  className="absolute top-2 right-2"
                >
                  {copied === 'HTML' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
