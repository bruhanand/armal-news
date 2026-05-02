import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "story-images";

const EXT_FOR_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ALLOWED_IMAGE_CONTENT_TYPES: ReadonlySet<string> = new Set(
  Object.keys(EXT_FOR_CONTENT_TYPE),
);

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

export type UploadStoryImageInput = {
  externalId: string;
  contentType: string;
  body: ArrayBuffer | Uint8Array | Blob;
};

export type UploadStoryImageResult = { publicUrl: string };

export async function uploadStoryImage(
  input: UploadStoryImageInput,
): Promise<UploadStoryImageResult> {
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
