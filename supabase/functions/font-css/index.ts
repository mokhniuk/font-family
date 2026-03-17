import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const fontId = url.searchParams.get('id');

  if (!fontId) {
    return new Response('Missing ?id= parameter', { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: family, error } = await supabase
    .from('font_families')
    .select('*, font_files(*)')
    .eq('id', fontId)
    .single();

  if (error || !family) {
    return new Response('Font not found', { status: 404, headers: corsHeaders });
  }

  // Group font_files by weight+style
  const groups = new Map<string, typeof family.font_files>();
  for (const file of family.font_files ?? []) {
    const key = `${file.weight}-${file.style}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(file);
  }

  let css = '';
  for (const [, files] of groups) {
    const sources = files
      .map((f: any) => {
        const { data } = supabase.storage.from('fonts').getPublicUrl(f.storage_path);
        return `url('${data.publicUrl}') format('${f.format}')`;
      })
      .join(',\n       ');

    css += `@font-face {
  font-family: '${family.name}';
  font-style: ${files[0].style};
  font-weight: ${files[0].weight};
  font-display: swap;
  src: ${sources};
}\n\n`;
  }

  return new Response(css.trim(), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});
