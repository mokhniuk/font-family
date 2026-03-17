import { useState, useEffect, useCallback } from 'react';
import {
  FontFamily,
  getAllFonts,
  addFont,
  updateFont,
  deleteFont,
  generateFontFaceCSS,
} from '@/lib/fontDB';

export function useFonts() {
  const [fonts, setFonts] = useState<FontFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedFontIds, setLoadedFontIds] = useState<Set<string>>(new Set());

  const loadFonts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allFonts = await getAllFonts();
      setFonts(allFonts);
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load fonts';
      setError(message);
      console.error('Failed to load fonts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNewFont = useCallback(async (font: FontFamily) => {
    await addFont(font);
    await loadFonts();
  }, [loadFonts]);

  const updateExistingFont = useCallback(async (font: FontFamily) => {
    // Remove the existing style tag so it gets re-injected with fresh URLs
    const oldStyle = document.getElementById(`font-${font.id}`);
    if (oldStyle) oldStyle.remove();
    setLoadedFontIds((prev) => {
      const next = new Set(prev);
      next.delete(font.id);
      return next;
    });

    await updateFont(font);
    await loadFonts();
  }, [loadFonts]);

  const removeFont = useCallback(async (id: string) => {
    await deleteFont(id);
    const oldStyle = document.getElementById(`font-${id}`);
    if (oldStyle) oldStyle.remove();
    setLoadedFontIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await loadFonts();
  }, [loadFonts]);

  const injectFont = useCallback((font: FontFamily) => {
    if (loadedFontIds.has(font.id)) return;

    const css = generateFontFaceCSS(font);
    if (!css) return;

    const style = document.createElement('style');
    style.id = `font-${font.id}`;
    style.textContent = css;
    document.head.appendChild(style);

    setLoadedFontIds((prev) => new Set([...prev, font.id]));
  }, [loadedFontIds]);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  useEffect(() => {
    fonts.forEach((font) => injectFont(font));
  }, [fonts, injectFont]);

  return {
    fonts,
    loading,
    error,
    addFont: addNewFont,
    updateFont: updateExistingFont,
    removeFont,
    refreshFonts: loadFonts,
  };
}
