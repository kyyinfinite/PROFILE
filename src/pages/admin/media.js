import { supabase } from '../../lib/supabase';

const BUCKET = 'portfolio';
const MAX_SOURCE = 12 * 1024 * 1024;
const MAX_OUTPUT = 5 * 1024 * 1024;

/** Validate, downscale (max 2200px) and convert to WebP. Returns the blob and final pixel size. */
export async function prepareImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error(`${file.name}: format harus JPG, PNG, atau WebP.`);
  if (file.size > MAX_SOURCE) throw new Error(`${file.name}: ukuran sumber maksimal 12 MB.`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Gagal mengompres gambar.'))), 'image/webp', 0.84));
  if (blob.size > MAX_OUTPUT) throw new Error(`${file.name}: hasil kompresi masih lebih dari 5 MB.`);
  return { blob, width, height };
}

/** Upload a prepared image to portfolio/<folder>/ and return { path, width, height }. */
export async function uploadImage(file, folder) {
  const { blob, width, height } = await prepareImage(file);
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  return { path: data?.path || path, width, height };
}

export const publicUrl = (path) => (path && supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || '' : '');

/** Best-effort removal of a stored object; a failure never blocks deleting the database row. */
export async function removeObject(path) {
  if (!path || !supabase) return;
  try { await supabase.storage.from(BUCKET).remove([path]); } catch { /* orphaned file can be removed from the Supabase dashboard */ }
}

/** Friendly message when the SQL has not been run yet. */
export function explain(error) {
  const message = error?.message || 'Terjadi kesalahan.';
  if (/relation .* does not exist|schema cache|Could not find the table/i.test(message)) return 'Tabel belum ada. Jalankan supabase/gallery-awards.sql di Supabase SQL Editor terlebih dahulu.';
  return message;
}
