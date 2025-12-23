import { useState, useEffect, useCallback } from 'react';
import { 
  FontFamily, 
  getAllFonts, 
  addFont, 
  deleteFont, 
  generateInlineCSS 
} from '@/lib/fontDB';

export function useFonts() {
  const [fonts, setFonts] = useState<FontFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedFontIds, setLoadedFontIds] = useState<Set<string>>(new Set());

  const loadFonts = useCallback(async () => {
    setLoading(true);
    try {
      const allFonts = await getAllFonts();
      setFonts(allFonts.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load fonts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNewFont = useCallback(async (font: FontFamily) => {
    await addFont(font);
    await loadFonts();
  }, [loadFonts]);

  const updateFont = useCallback(async (font: FontFamily) => {
    // Remove old style tag if exists
    const oldStyle = document.getElementById(`font-${font.id}`);
    if (oldStyle) {
      oldStyle.remove();
    }
    setLoadedFontIds((prev) => {
      const next = new Set(prev);
      next.delete(font.id);
      return next;
    });
    
    await addFont(font); // This uses put() which updates existing
    await loadFonts();
  }, [loadFonts]);

  const removeFont = useCallback(async (id: string) => {
    await deleteFont(id);
    const oldStyle = document.getElementById(`font-${id}`);
    if (oldStyle) {
      oldStyle.remove();
    }
    setLoadedFontIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await loadFonts();
  }, [loadFonts]);

  const injectFont = useCallback((font: FontFamily) => {
    if (loadedFontIds.has(font.id)) return;

    const css = generateInlineCSS(font);
    const style = document.createElement('style');
    style.id = `font-${font.id}`;
    style.textContent = css;
    document.head.appendChild(style);

    setLoadedFontIds((prev) => new Set([...prev, font.id]));
  }, [loadedFontIds]);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  // Inject all fonts when they load
  useEffect(() => {
    fonts.forEach((font) => {
      injectFont(font);
    });
  }, [fonts, injectFont]);

  return {
    fonts,
    loading,
    addFont: addNewFont,
    updateFont,
    removeFont,
    refreshFonts: loadFonts,
  };
}
