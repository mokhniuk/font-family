import { openDB } from 'idb';
import type { FontFamily, FontFile, FontFileVariant } from './fontDB';

const DB_NAME = 'font-family-local';
const DB_VERSION = 1;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('families')) {
        db.createObjectStore('families', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('by_family', 'family_id');
      }
    },
  });
}

interface StoredFamily {
  id: string;
  name: string;
  category: FontFamily['category'];
  author?: string;
  description?: string;
  license?: string;
  createdAt: number;
}

interface StoredFile {
  id: string;
  family_id: string;
  weight: number;
  style: 'normal' | 'italic';
  format: string;
  file_name: string;
  data: ArrayBuffer;
}

const mimeMap: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  truetype: 'font/ttf',
  opentype: 'font/otf',
};

function toDataUri(buffer: ArrayBuffer, format: string): string {
  const mime = mimeMap[format] ?? 'font/ttf';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function groupToFontFiles(files: StoredFile[]): FontFile[] {
  const groups = new Map<string, StoredFile[]>();
  for (const file of files) {
    const key = `${file.weight}-${file.style}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(file);
  }

  return Array.from(groups.values()).map((group) => {
    const [primary, ...rest] = group;
    return {
      id: primary.id,
      name: primary.file_name,
      weight: primary.weight,
      style: primary.style,
      format: primary.format,
      storageUrl: toDataUri(primary.data, primary.format),
      variants: rest.map((v) => ({
        id: v.id,
        name: v.file_name,
        format: v.format,
        storageUrl: toDataUri(v.data, v.format),
      })),
    };
  });
}

function toFontFamily(family: StoredFamily, files: StoredFile[]): FontFamily {
  return {
    id: family.id,
    name: family.name,
    category: family.category,
    author: family.author,
    description: family.description,
    license: family.license,
    createdAt: family.createdAt,
    files: groupToFontFiles(files),
  };
}

export async function getAllFonts(): Promise<FontFamily[]> {
  const db = await getDB();
  const families: StoredFamily[] = await db.getAll('families');
  const result: FontFamily[] = [];

  for (const family of families) {
    const files: StoredFile[] = await db.getAllFromIndex('files', 'by_family', family.id);
    result.push(toFontFamily(family, files));
  }

  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getFont(id: string): Promise<FontFamily | undefined> {
  const db = await getDB();
  const family: StoredFamily | undefined = await db.get('families', id);
  if (!family) return undefined;
  const files: StoredFile[] = await db.getAllFromIndex('files', 'by_family', id);
  return toFontFamily(family, files);
}

export async function addFont(font: FontFamily): Promise<FontFamily> {
  const db = await getDB();
  const familyId = crypto.randomUUID();
  const now = Date.now();

  await db.put('families', {
    id: familyId,
    name: font.name,
    category: font.category,
    author: font.author ?? undefined,
    description: font.description ?? undefined,
    license: font.license ?? undefined,
    createdAt: now,
  });

  const updatedFiles: FontFile[] = [];

  for (const file of font.files) {
    const allFormats = [
      { name: file.name, data: file.data!, format: file.format },
      ...(file.variants?.map((v) => ({ name: v.name, data: v.data!, format: v.format })) ?? []),
    ];

    let primaryId = '';
    let primaryDataUri = '';
    const savedVariants: FontFileVariant[] = [];

    for (let i = 0; i < allFormats.length; i++) {
      const f = allFormats[i];
      const fileId = crypto.randomUUID();

      await db.put('files', {
        id: fileId,
        family_id: familyId,
        weight: file.weight,
        style: file.style,
        format: f.format,
        file_name: f.name,
        data: f.data,
      });

      const dataUri = toDataUri(f.data, f.format);
      if (i === 0) {
        primaryId = fileId;
        primaryDataUri = dataUri;
      } else {
        savedVariants.push({ id: fileId, name: f.name, format: f.format, storageUrl: dataUri });
      }
    }

    updatedFiles.push({
      id: primaryId,
      name: file.name,
      weight: file.weight,
      style: file.style,
      format: file.format,
      storageUrl: primaryDataUri,
      variants: savedVariants.length > 0 ? savedVariants : undefined,
    });
  }

  return { ...font, id: familyId, createdAt: now, files: updatedFiles };
}

export async function updateFont(font: FontFamily): Promise<void> {
  const db = await getDB();

  await db.put('families', {
    id: font.id,
    name: font.name,
    category: font.category,
    author: font.author ?? undefined,
    description: font.description ?? undefined,
    license: font.license ?? undefined,
    createdAt: font.createdAt,
  });

  const keepIds = new Set<string>();
  for (const file of font.files) {
    if (file.id) keepIds.add(file.id);
    for (const v of file.variants ?? []) {
      if (v.id) keepIds.add(v.id);
    }
  }

  const currentFiles: StoredFile[] = await db.getAllFromIndex('files', 'by_family', font.id);
  for (const f of currentFiles) {
    if (!keepIds.has(f.id)) await db.delete('files', f.id);
  }

  for (const file of font.files) {
    if (!file.id && file.data) {
      await db.put('files', {
        id: crypto.randomUUID(),
        family_id: font.id,
        weight: file.weight,
        style: file.style,
        format: file.format,
        file_name: file.name,
        data: file.data,
      });
    } else if (file.id) {
      const existing = currentFiles.find((f) => f.id === file.id);
      if (existing && (existing.weight !== file.weight || existing.style !== file.style)) {
        await db.put('files', { ...existing, weight: file.weight, style: file.style });
      }
    }

    for (const variant of file.variants ?? []) {
      if (!variant.id && variant.data) {
        await db.put('files', {
          id: crypto.randomUUID(),
          family_id: font.id,
          weight: file.weight,
          style: file.style,
          format: variant.format,
          file_name: variant.name,
          data: variant.data,
        });
      }
    }
  }
}

export async function deleteFont(id: string): Promise<void> {
  const db = await getDB();
  const files: StoredFile[] = await db.getAllFromIndex('files', 'by_family', id);
  for (const f of files) await db.delete('files', f.id);
  await db.delete('families', id);
}
