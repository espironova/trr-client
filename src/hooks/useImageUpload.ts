import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('activity-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('activity-images')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      const path = url.split('/').pop();
      if (!path) return false;
      
      const { error } = await supabase.storage
        .from('activity-images')
        .remove([path]);
      
      return !error;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return { uploadImage, deleteImage, uploading };
}
