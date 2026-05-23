import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "story-images";

const EXT_FOR_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export async function uploadStoryImage(input: {
  externalId: string;
  contentType: string;
  body: ArrayBuffer | Uint8Array | Blob;
}): Promise<{ publicUrl: string }> {
  const ext = EXT_FOR_CONTENT_TYPE[input.contentType];
  if (!ext) {
    throw new Error(`unsupported image content-type: ${input.contentType}`);
  }
  const objectKey = `${input.externalId}.${ext}`;
  const supabase = getClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectKey, input.body, {
      contentType: input.contentType,
      upsert: true,
    });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectKey);
  return { publicUrl: data.publicUrl };
}

// Extract the object key from a public URL of the form
//   https://<project>.supabase.co/storage/v1/object/public/story-images/<key>
// Returns null when the URL doesn't match — we then skip the Storage delete
// rather than blowing up the Postgres row delete.
export function parseStoryImageObjectKey(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    const marker = `/public/${BUCKET}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx < 0) return null;
    const key = u.pathname.slice(idx + marker.length);
    return key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

export async function deleteStoryImageByUrl(publicUrl: string): Promise<void> {
  const key = parseStoryImageObjectKey(publicUrl);
  if (!key) return;
  const supabase = getClient();
  const { error } = await supabase.storage.from(BUCKET).remove([key]);
  if (error) throw error;
}
