import { supabase } from './supabase';

export interface FontFileVariant {
  id?: string;
  name: string;
  format: string;
  storageUrl?: string;
  data?: ArrayBuffer;
}

export interface FontFile {
  id?: string;
  name: string;
  weight: number;
  style: 'normal' | 'italic';
  format: string;
  storageUrl?: string;
  data?: ArrayBuffer;
  variants?: FontFileVariant[];
}

export interface FontFamily {
  id: string;
  name: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';
  files: FontFile[];
  createdAt: number;
  author?: string;
  description?: string;
  license?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface DBFontFile {
  id: string;
  family_id: string;
  weight: number;
  style: 'normal' | 'italic';
  format: string;
  storage_path: string;
  file_name: string;
}

function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from('fonts').getPublicUrl(storagePath);
  return data.publicUrl;
}

function groupDbFilesToFontFiles(dbFiles: DBFontFile[]): FontFile[] {
  const groups = new Map<string, DBFontFile[]>();

  for (const file of dbFiles) {
    const key = `${file.weight}-${file.style}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(file);
  }

  return Array.from(groups.values()).map((groupFiles) => {
    const [primary, ...rest] = groupFiles;
    return {
      id: primary.id,
      name: primary.file_name,
      weight: primary.weight,
      style: primary.style,
      format: primary.format,
      storageUrl: getPublicUrl(primary.storage_path),
      variants: rest.map((v) => ({
        id: v.id,
        name: v.file_name,
        format: v.format,
        storageUrl: getPublicUrl(v.storage_path),
      })),
    };
  });
}

function dbRowToFontFamily(row: any): FontFamily {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    author: row.author ?? undefined,
    description: row.description ?? undefined,
    license: row.license ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    files: groupDbFilesToFontFiles(row.font_files ?? []),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getAllFonts(): Promise<FontFamily[]> {
  const { data, error } = await supabase
    .from('font_families')
    .select('*, font_files(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(dbRowToFontFamily);
}

export async function getFont(id: string): Promise<FontFamily | undefined> {
  const { data, error } = await supabase
    .from('font_families')
    .select('*, font_files(*)')
    .eq('id', id)
    .single();

  if (error) return undefined;
  return dbRowToFontFamily(data);
}

export async function addFont(font: FontFamily): Promise<FontFamily> {
  // 1. Insert family metadata
  const { data: family, error: familyError } = await supabase
    .from('font_families')
    .insert({
      name: font.name,
      category: font.category,
      author: font.author ?? null,
      description: font.description ?? null,
      license: font.license ?? null,
    })
    .select()
    .single();

  if (familyError) throw familyError;

  const familyId: string = family.id;
  const updatedFiles: FontFile[] = [];

  // 2. Upload each file (and its variants) to Storage, then insert DB records
  for (const file of font.files) {
    const allFormats = [
      { name: file.name, data: file.data!, format: file.format },
      ...(file.variants?.map((v) => ({ name: v.name, data: v.data!, format: v.format })) ?? []),
    ];

    let primaryStorageUrl = '';
    let primaryId = '';
    const savedVariants: FontFileVariant[] = [];

    for (let i = 0; i < allFormats.length; i++) {
      const f = allFormats[i];
      const storagePath = `${familyId}/${f.name}`;

      const { error: uploadError } = await supabase.storage
        .from('fonts')
        .upload(storagePath, f.data, {
          contentType: getMimeType(f.format),
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: fileRecord, error: fileError } = await supabase
        .from('font_files')
        .insert({
          family_id: familyId,
          weight: file.weight,
          style: file.style,
          format: f.format,
          storage_path: storagePath,
          file_name: f.name,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      const publicUrl = getPublicUrl(storagePath);

      if (i === 0) {
        primaryStorageUrl = publicUrl;
        primaryId = fileRecord.id;
      } else {
        savedVariants.push({ id: fileRecord.id, name: f.name, format: f.format, storageUrl: publicUrl });
      }
    }

    updatedFiles.push({
      id: primaryId,
      name: file.name,
      weight: file.weight,
      style: file.style,
      format: file.format,
      storageUrl: primaryStorageUrl,
      variants: savedVariants.length > 0 ? savedVariants : undefined,
    });
  }

  return {
    ...font,
    id: familyId,
    createdAt: new Date(family.created_at).getTime(),
    files: updatedFiles,
  };
}

export async function updateFont(font: FontFamily): Promise<void> {
  // Update metadata
  const { error } = await supabase
    .from('font_families')
    .update({
      name: font.name,
      category: font.category,
      author: font.author ?? null,
      description: font.description ?? null,
      license: font.license ?? null,
    })
    .eq('id', font.id);

  if (error) throw error;

  // Get current DB files
  const { data: currentFiles } = await supabase
    .from('font_files')
    .select('*')
    .eq('family_id', font.id);

  // Collect all IDs being kept
  const keepIds = new Set<string>();
  for (const file of font.files) {
    if (file.id) keepIds.add(file.id);
    for (const v of file.variants ?? []) {
      if (v.id) keepIds.add(v.id);
    }
  }

  // Delete removed files from Storage + DB
  const removedFiles = (currentFiles ?? []).filter((f) => !keepIds.has(f.id));
  if (removedFiles.length > 0) {
    await supabase.storage.from('fonts').remove(removedFiles.map((f) => f.storage_path));
    await supabase.from('font_files').delete().in('id', removedFiles.map((f) => f.id));
  }

  // Upload new files + update changed weight/styles for existing ones
  for (const file of font.files) {
    // New primary file (no id, has data)
    if (!file.id && file.data) {
      const storagePath = `${font.id}/${file.name}`;
      await supabase.storage.from('fonts').upload(storagePath, file.data, {
        contentType: getMimeType(file.format),
        upsert: true,
      });
      await supabase.from('font_files').insert({
        family_id: font.id,
        weight: file.weight,
        style: file.style,
        format: file.format,
        storage_path: storagePath,
        file_name: file.name,
      });
    } else if (file.id) {
      // Update weight/style for existing file if changed
      const existing = (currentFiles ?? []).find((f) => f.id === file.id);
      if (existing && (existing.weight !== file.weight || existing.style !== file.style)) {
        await supabase.from('font_files').update({ weight: file.weight, style: file.style }).eq('id', file.id);
      }
    }

    // Handle new variants
    for (const variant of file.variants ?? []) {
      if (!variant.id && variant.data) {
        const storagePath = `${font.id}/${variant.name}`;
        await supabase.storage.from('fonts').upload(storagePath, variant.data, {
          contentType: getMimeType(variant.format),
          upsert: true,
        });
        await supabase.from('font_files').insert({
          family_id: font.id,
          weight: file.weight,
          style: file.style,
          format: variant.format,
          storage_path: storagePath,
          file_name: variant.name,
        });
      }
    }
  }
}

export async function deleteFont(id: string): Promise<void> {
  // Get storage paths before deleting
  const { data: files } = await supabase
    .from('font_files')
    .select('storage_path')
    .eq('family_id', id);

  if (files && files.length > 0) {
    await supabase.storage.from('fonts').remove(files.map((f) => f.storage_path));
  }

  const { error } = await supabase.from('font_families').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Utility / detection helpers
// ---------------------------------------------------------------------------

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

function getMimeType(format: string): string {
  switch (format) {
    case 'woff2': return 'font/woff2';
    case 'woff': return 'font/woff';
    case 'truetype': return 'font/ttf';
    case 'opentype': return 'font/otf';
    default: return 'font/ttf';
  }
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

export function getCSSUrl(fontId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/font-css?id=${fontId}`;
}

export function generateCSSImport(fontId: string): string {
  return `@import url('${getCSSUrl(fontId)}');`;
}

export function generateCSSLink(fontId: string): string {
  return `<link rel="stylesheet" href="${getCSSUrl(fontId)}">`;
}

/** Generates @font-face CSS using Supabase Storage public URLs */
export function generateFontFaceCSS(font: FontFamily): string {
  let css = '';

  for (const file of font.files) {
    const sources: string[] = [];

    if (file.storageUrl) {
      sources.push(`url('${file.storageUrl}') format('${file.format}')`);
    }

    for (const v of file.variants ?? []) {
      if (v.storageUrl) {
        sources.push(`url('${v.storageUrl}') format('${v.format}')`);
      }
    }

    if (sources.length === 0) continue;

    css += `@font-face {
  font-family: '${font.name}';
  font-style: ${file.style};
  font-weight: ${file.weight};
  font-display: swap;
  src: ${sources.join(',\n       ')};
}\n\n`;
  }

  return css.trim();
}
