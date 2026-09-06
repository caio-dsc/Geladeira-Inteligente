/**
 * Utilitário de validação e otimização de imagens no navegador.
 * Redimensiona e comprime imagens de pratos e ingredientes para garantir
 * carregamento rápido, baixa latência e economia de armazenamento.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp';
  maxSizeBytes?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_RAW_SIZE = 15 * 1024 * 1024; // 15 MB para o arquivo original

/**
 * Valida o tipo MIME e o tamanho do arquivo antes do processamento.
 */
export function validateImageFile(
  file: { type?: string; size?: number; name?: string },
  maxSizeBytes = DEFAULT_MAX_RAW_SIZE
): ValidationResult {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo fornecido para validação.' };
  }

  const mimeType = (file.type || '').toLowerCase();
  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Formato de imagem não suportado. Por favor, envie uma imagem nos formatos JPG, PNG ou WebP.',
    };
  }

  const size = Number(file.size) || 0;
  if (size <= 0) {
    return { valid: false, error: 'O arquivo selecionado está vazio (0 bytes).' };
  }

  if (size > maxSizeBytes) {
    const sizeMb = (size / (1024 * 1024)).toFixed(1);
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `A imagem selecionada é muito grande (${sizeMb} MB). O limite máximo permitido é ${maxMb} MB.`,
    };
  }

  return { valid: true };
}

/**
 * Calcula as novas dimensões proporcionais preservando o aspect ratio.
 */
export function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  // Se a imagem for menor que os limites, mantém o tamanho original para evitar upscaling
  if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
    return { width: srcWidth, height: srcHeight };
  }

  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio)),
  };
}

/**
 * Otimiza uma imagem através do Canvas HTML5 no navegador.
 * Redimensiona para resolução máxima e comprime com qualidade balanceada.
 * Se o ambiente não suportar Canvas (ex: Node/SSR), retorna o arquivo original sem quebrar.
 */
export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File | Blob> {
  const validation = validateImageFile(file, options.maxSizeBytes);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Fallback seguro se executado fora do navegador (ex: testes de Node sem DOM Canvas)
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement) {
    return file;
  }

  const maxWidth = options.maxWidth || 1200;
  const maxHeight = options.maxHeight || 1200;
  const quality = options.quality !== undefined ? options.quality : 0.82;
  const targetFormat = options.format || 'image/jpeg';

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const { width, height } = calculateAspectRatioFit(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxWidth,
          maxHeight
        );

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Se não conseguir contexto 2D, retorna o arquivo original com segurança
          return resolve(file);
        }

        // Aplica suavização de imagem de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Para formatos com suporte a fundo transparente ou branco
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // Cria um File com nome apropriado mantendo compatibilidade de upload
            const ext = targetFormat === 'image/webp' ? '.webp' : '.jpg';
            const baseName = (file.name || 'recipe_photo').replace(/\.[^/.]+$/, '');
            const optimizedFile = new File([blob], `${baseName}_opt${ext}`, {
              type: targetFormat,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          targetFormat,
          quality
        );
      } catch (err) {
        console.warn('Falha no processamento Canvas, enviando arquivo original:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível carregar a imagem para otimização. O arquivo pode estar corrompido.'));
    };

    img.src = objectUrl;
  });
}
