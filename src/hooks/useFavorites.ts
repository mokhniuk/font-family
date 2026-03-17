import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'fonthost-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch (e) {
        console.error('Failed to save favorites:', e);
      }
      return next;
    });
  }, []);

  return { favorites, toggleFavorite };
}
