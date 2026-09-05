import { supabase } from '../supabase';
import { generateUUID } from '../security/distributedId';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'image/heic', 'image/heif', 'image/bmp'];
const ALLOWED_DOC_TYPES   = ['application/pdf'];
const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (compressed automatically before upload)
const MAX_DOC_SIZE_BYTES   = 20 * 1024 * 1024; // 20 MB

export const validateFile = (
  file: File,
  type: 'image' | 'document'
): { valid: boolean; error?: string } => {
  const isImg = type === 'image' || file.type.startsWith('image/');
  const maxSize = isImg ? MAX_IMAGE_SIZE_BYTES : MAX_DOC_SIZE_BYTES;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى: ${(maxSize / 1024 / 1024).toFixed(0)} ميغابايت`,
    };
  }
  return { valid: true };
};

export const imageService = {
  async createPresignedUploadUrl(
    userId: string,
    fileType: string,
    bucket = 'profiles'
  ): Promise<{ signedUrl: string; path: string; publicUrl: string } | null> {
    try {
      const fileExt = fileType.split('/')[1] || 'bin';
      const path = `${userId}/${generateUUID()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(path);

      if (error || !data) {
        console.error("[imageService] Error generating presigned upload URL:", error);
        return null;
      }

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

      return {
        signedUrl: data.signedUrl,
        path: data.path,
        publicUrl: publicData.publicUrl
      };
    } catch (err) {
      console.error("[imageService] Exception in createPresignedUploadUrl:", err);
      return null;
    }
  },

  async compressImage(file: File): Promise<Blob | File> {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          try {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                  if (blob) resolve(blob);
                  else resolve(file);
                }, 'image/jpeg', 0.8);
              } catch {
                resolve(file);
              }
            };
            img.onerror = () => resolve(file);
          } catch {
            resolve(file);
          }
        };
        reader.onerror = () => resolve(file);
      } catch {
        resolve(file);
      }
    });
  },

  async uploadFile(file: File | Blob, userId: string, bucket = 'profiles'): Promise<string> {
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${userId}/${generateUUID()}.${fileExt}`;
      const contentType = file instanceof File ? file.type : 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { contentType, upsert: true });

      if (!uploadError) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        if (publicData?.publicUrl) return publicData.publicUrl;
      }
    } catch (e) {
      console.warn('[imageService] Storage upload error, falling back to base64 data URL:', e);
    }

    // Fallback: convert to optimized compact data URL so image is always saved and never lost
    try {
      if (file.type && file.type.startsWith('image/')) {
        const canvas = document.createElement('canvas');
        const img = new Image();
        const src = URL.createObjectURL(file);
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = src;
        });
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(src);
        return canvas.toDataURL('image/jpeg', 0.7);
      }
    } catch (_) {}

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Failed to encode file'));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async processAndUpload(file: File, userId: string, bucket = 'profiles'): Promise<string> {
    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
    const validation = validateFile(file, fileType);
    if (!validation.valid) throw new Error(validation.error);

    if (file.type.startsWith('image/')) {
      const compressed = await this.compressImage(file);
      return this.uploadFile(compressed, userId, bucket);
    } else {
      return this.uploadFile(file, userId, bucket);
    }
  },

  async uploadVideo(file: File, userId: string): Promise<string> {
    return this.uploadFile(file, userId, 'posts');
  }
};
