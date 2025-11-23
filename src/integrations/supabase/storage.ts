import { supabase } from './client';

export const uploadImageToSupabase = async (file: File, userId: string, folder: string = 'product-images'): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/${folder}/${Date.now()}.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from('product-spins') // Asumiendo un bucket llamado 'product-spins'
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-spins')
    .getPublicUrl(fileName);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to get public URL for uploaded image.');
  }

  return publicUrlData.publicUrl;
};