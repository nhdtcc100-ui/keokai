import { threatEngine } from './threatEngine';

export interface FileInspectionResult {
  safe: boolean;
  error?: string;
  threatType?: string;
}

/** Allowed image and document MIME types */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Known dangerous extensions (executable or server-side scripts) */
const DANGEROUS_EXTENSIONS_REGEX = /\.(php|php3|php4|php5|phtml|exe|sh|bat|cmd|vbs|cgi|pl|jsp|asp|aspx|dll|so|jar|py|rb)$/i;

/** Magic Bytes signatures */
const MAGIC_BYTES: Array<{ mime: string; bytes: number[] }> = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

/** Binary webshell patterns */
const WEBSHELL_BINARY_PATTERNS = [
  /<\?php/i,
  /<\?=/i,
  /<script[^>]*>/i,
  /eval\s*\(/i,
  /system\s*\(/i,
  /shell_exec/i,
  /passthru/i,
  /base64_decode/i,
  /__import__/i,
  /os\.system/i,
  /subprocess\.Popen/i,
];

/**
 * Inspect uploaded file for malicious content, magic bytes spoofing, and webshell payloads
 */
export async function inspectUploadedFile(
  file: File,
  user?: { id?: string; name?: string; email?: string },
  endpoint = '/app/upload'
): Promise<FileInspectionResult> {
  if (!file) {
    return { safe: false, error: 'الملف غير موجود' };
  }

  // 1. Check size boundaries (max 15MB)
  if (file.size > 15 * 1024 * 1024) {
    return { safe: false, error: '🚨 حجم الملف كبير جداً (الحد الأقصى 15 ميجابايت)' };
  }

  // 2. Check extension & double extension tricks (e.g. avatar.php.png)
  const filename = file.name.toLowerCase();
  const parts = filename.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length - 1; i++) {
      if (['php', 'exe', 'sh', 'bat', 'vbs', 'cgi', 'pl', 'jsp', 'asp', 'py'].includes(parts[i])) {
        threatEngine.logThreat({
          user_id: user?.id,
          user_name: user?.name || file.name,
          user_email: user?.email,
          attack_type: 'CODE_INJECTION',
          severity: 'CRITICAL',
          endpoint: `${endpoint} [File Upload Double Extension]`,
          payload_sample: `[MALICIOUS FILE UPLOAD] Double Extension Trick: ${file.name} (Type: ${file.type})`,
        });
        return {
          safe: false,
          error: '🚨 محاولة رفع ملف مشبوه باختراق الامتداد المزدوج (Double Extension). تم حظر العملية وتبليغ الأمن.',
          threatType: 'Double Extension Webshell',
        };
      }
    }
  }

  if (DANGEROUS_EXTENSIONS_REGEX.test(filename)) {
    threatEngine.logThreat({
      user_id: user?.id,
      user_name: user?.name || file.name,
      user_email: user?.email,
      attack_type: 'CODE_INJECTION',
      severity: 'CRITICAL',
      endpoint: `${endpoint} [Executable Upload]`,
      payload_sample: `[MALICIOUS FILE UPLOAD] Executable Extension: ${file.name}`,
    });
    return {
      safe: false,
      error: '🚨 غير مسموح برفع ملفات برمجية أو تنفيذية. تم إلغاء الرفع وتبليغ قسم السايبر.',
      threatType: 'Executable Upload',
    };
  }

  // 3. Inspect binary content & Magic Bytes
  try {
    const buffer = await file.slice(0, 8192).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check magic bytes for images/PDF
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      let magicMatched = false;
      for (const sig of MAGIC_BYTES) {
        if (file.type === sig.mime || file.name.endsWith(sig.mime.split('/')[1])) {
          let match = true;
          for (let i = 0; i < sig.bytes.length; i++) {
            if (bytes[i] !== sig.bytes[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            magicMatched = true;
            break;
          }
        }
      }

      // If it claims to be an image but lacks real image header
      if (!magicMatched && file.type.startsWith('image/')) {
        threatEngine.logThreat({
          user_id: user?.id,
          user_name: user?.name || file.name,
          user_email: user?.email,
          attack_type: 'HEADER_TAMPERING',
          severity: 'HIGH',
          endpoint: `${endpoint} [Magic Bytes Spoofing]`,
          payload_sample: `[FILE HEADER SPOOFING] File ${file.name} claims to be ${file.type} but signature mismatch.`,
        });
        return {
          safe: false,
          error: '🚨 ترويسة الملف التنسيقية غير متطابقة (تزييف نوع الملف). تم حظر الرفع.',
          threatType: 'MIME Type Spoofing',
        };
      }
    }

    // 4. Scan binary sample text for embedded WebShell signatures
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const textSample = decoder.decode(bytes);

    for (const pattern of WEBSHELL_BINARY_PATTERNS) {
      if (pattern.test(textSample)) {
        threatEngine.logThreat({
          user_id: user?.id,
          user_name: user?.name || file.name,
          user_email: user?.email,
          attack_type: 'CODE_INJECTION',
          severity: 'CRITICAL',
          endpoint: `${endpoint} [Embedded WebShell Payload]`,
          payload_sample: `[WEBSHELL DETECTED IN FILE] ${file.name} -> Matches pattern ${pattern.source}`,
        });
        return {
          safe: false,
          error: '🚨 تم الكشف عن أثر كود برمجي خبيث (Embedded WebShell) داخل الملف! تم حظره فوراً وتبليغ قسم السايبر سيكيورتي.',
          threatType: 'Embedded WebShell Payload',
        };
      }
    }
  } catch (e: any) {
    // If reading array buffer fails
    return { safe: false, error: 'فشل قراءة وفحص ملف البيانات' };
  }

  return { safe: true };
}
