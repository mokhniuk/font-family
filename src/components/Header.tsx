import { Type } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-subtle">
              <Type className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                FontHost
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Self-hosted font service
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a 
              href="#docs" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
