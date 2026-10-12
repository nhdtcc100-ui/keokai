/**
 * 🛡️ MIME Magic Bytes Validator
 * Verifies file contents at the binary level to prevent malicious file uploads (e.g. executable renamed as PDF).
 */

const MAGIC_BYTES: Record<string, number[]> = {
  'application/pdf':  [0x25, 0x50, 0x44, 0x46],        // %PDF
  'image/jpeg':       [0xFF, 0xD8, 0xFF],               // JPEG / EXIF
  'image/png':        [0x89, 0x50, 0x4E, 0x47],         // PNG
  'image/webp':       [0x52, 0x49, 0x46, 0x46],         // RIFF (WebP)
  'image/gif':        [0x47, 0x49, 0x46, 0x38],         // GIF8
  // Word documents (DOC/DOCX)
  'application/msword': [0xD0, 0xCF, 0x11, 0xE0],      // DOC (OLE2)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP)
};

export async function verifyFileMimeType(
  file: File | Blob, 
  expectedMime: string
): Promise<{ valid: boolean; error?: string }> {
  const expectedSignature = MAGIC_BYTES[expectedMime];
  
  if (!expectedSignature) {
    return { valid: false, error: `نوع الملف غير مدعوم للتحقق من التوقيع الرقمي (${expectedMime})` };
  }

  try {
    // For PDF: search within first 512 bytes (some mobile PDFs have encoding headers before %PDF)
    const searchLength = expectedMime === 'application/pdf' ? 512 : 8;
    const buffer = await file.slice(0, searchLength).arrayBuffer();
    const bytes  = new Uint8Array(buffer);

    let isMatch: boolean;
    if (expectedMime === 'application/pdf') {
      // Search for PDF signature anywhere in first 512 bytes
      isMatch = false;
      for (let i = 0; i <= bytes.length - expectedSignature.length; i++) {
        if (expectedSignature.every((byte, j) => bytes[i + j] === byte)) {
          isMatch = true;
          break;
        }
      }
    } else {
      isMatch = expectedSignature.every((byte, i) => bytes[i] === byte);
    }

    if (!isMatch) {
      return { 
        valid: false, 
        error: `⛔ تحذير أمني: محتوى الملف لا يطابق الصيغة المعلنة (${expectedMime}). قد يكون الملف تالفاً أو غير مصرح به.` 
      };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'حدث خطأ أثناء فحص البنية الرقمية للملف' };
  }
}
