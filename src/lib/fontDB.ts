import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface FontFileVariant {
  name: string;
  data: ArrayBuffer;
  format: string;
}

export interface FontFile {
  name: string;
  weight: number;
  style: 'normal' | 'italic';
  data: ArrayBuffer;
  format: string;
  // Grouped variants of same weight+style in different formats
  variants?: FontFileVariant[];
}

export interface FontFamily {
  id: string;
  name: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';
  files: FontFile[];
  createdAt: number;
  previewUrl?: string;
  author?: string;
  description?: string;
  license?: string;
}

interface FontDBSchema extends DBSchema {
  fonts: {
    key: string;
    value: FontFamily;
    indexes: { 'by-name': string; 'by-category': string };
  };
}

let dbInstance: IDBPDatabase<FontDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<FontDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FontDBSchema>('font-host-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('fonts', { keyPath: 'id' });
      store.createIndex('by-name', 'name');
      store.createIndex('by-category', 'category');
    },
  });

  return dbInstance;
}

export async function addFont(font: FontFamily): Promise<void> {
  const db = await getDB();
  await db.put('fonts', font);
}

export async function getAllFonts(): Promise<FontFamily[]> {
  const db = await getDB();
  return db.getAll('fonts');
}

export async function getFont(id: string): Promise<FontFamily | undefined> {
  const db = await getDB();
  return db.get('fonts', id);
}

export async function deleteFont(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('fonts', id);
}

export function generateFontId(): string {
  return `font_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function detectFontFormat(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'woff2': return 'woff2';
    case 'woff': return 'woff';
    case 'ttf': return 'truetype';
    case 'otf': return 'opentype';
    case 'eot': return 'embedded-opentype';
    default: return 'truetype';
  }
}

export function detectFontWeight(filename: string): number {
  const lower = filename.toLowerCase();
  if (lower.includes('thin') || lower.includes('100')) return 100;
  if (lower.includes('extralight') || lower.includes('200')) return 200;
  if (lower.includes('light') || lower.includes('300')) return 300;
  if (lower.includes('regular') || lower.includes('400') || lower.includes('normal')) return 400;
  if (lower.includes('medium') || lower.includes('500')) return 500;
  if (lower.includes('semibold') || lower.includes('600')) return 600;
  if (lower.includes('bold') || lower.includes('700')) return 700;
  if (lower.includes('extrabold') || lower.includes('800')) return 800;
  if (lower.includes('black') || lower.includes('900')) return 900;
  return 400;
}

export function detectFontStyle(filename: string): 'normal' | 'italic' {
  const lower = filename.toLowerCase();
  return lower.includes('italic') || lower.includes('oblique') ? 'italic' : 'normal';
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function generateCSSImport(font: FontFamily, baseUrl: string): string {
  const cssUrl = `${baseUrl}/api/fonts/${font.id}/css`;
  return `@import url('${cssUrl}');`;
}

export function generateCSSLink(font: FontFamily, baseUrl: string): string {
  const cssUrl = `${baseUrl}/api/fonts/${font.id}/css`;
  return `<link rel="stylesheet" href="${cssUrl}">`;
}

export function generateInlineCSS(font: FontFamily): string {
  let css = '';
  
  font.files.forEach((file) => {
    const base64 = arrayBufferToBase64(file.data);
    const dataUrl = `data:font/${file.format};base64,${base64}`;
    
    css += `@font-face {
  font-family: '${font.name}';
  font-style: ${file.style};
  font-weight: ${file.weight};
  font-display: swap;
  src: url('${dataUrl}') format('${file.format}');
}

`;
  });

  return css;
}
