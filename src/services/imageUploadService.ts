/**
 * Serviço de upload de imagens integrado ao Cloudinary.
 * Substitui o Firebase Storage para imagens de receitas do catálogo,
 * permitindo upload direto, seguro e de alta performance no plano gratuito.
 */

export interface CloudinaryUploadResponse {
  asset_id?: string;
  public_id?: string;
  version?: number;
  version_id?: string;
  signature?: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  tags?: string[];
  bytes?: number;
  type?: string;
  etag?: string;
  placeholder?: boolean;
  url?: string;
  secure_url?: string;
  folder?: string;
  original_filename?: string;
  error?: {
    message?: string;
  };
}

export interface IImageUploadService {
  uploadRecipeImage(
    recipeId: string,
    fileOrBlob: File | Blob,
    onProgress?: (progressPercent: number) => void,
    timeoutMs?: number
  ): Promise<string>;
}

export class ImageUploadService implements IImageUploadService {
  private readonly cloudName = 'vlqg76jp';
  private readonly uploadPreset = 'geladeira_recipe_images';
  private readonly uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  /**
   * Realiza o upload de uma imagem para o Cloudinary utilizando o preset unsigned.
   * Suporta acompanhamento de progresso byte a byte e cancelamento por timeout.
   *
   * @param recipeId Identificador da receita (usado em metadados de contexto)
   * @param fileOrBlob Arquivo ou Blob otimizado a ser enviado
   * @param onProgress Callback opcional de progresso percentual (0 a 100)
   * @param timeoutMs Tempo limite em milissegundos (padrão: 35 segundos)
   * @returns Promise que resolve com a secure_url pública HTTPS da imagem
   */
  public async uploadRecipeImage(
    recipeId: string,
    fileOrBlob: File | Blob,
    onProgress?: (progressPercent: number) => void,
    timeoutMs = 35000
  ): Promise<string> {
    if (!recipeId) {
      throw new Error('Identificador da receita (recipeId) não fornecido para o upload.');
    }

    if (!fileOrBlob) {
      throw new Error('Nenhum arquivo de imagem foi selecionado para upload.');
    }

    // Validação de tipo MIME e formato permitido (JPEG, PNG, WebP)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (fileOrBlob.type && !allowedMimeTypes.includes(fileOrBlob.type.toLowerCase())) {
      throw new Error(
        `Formato de imagem não suportado (${fileOrBlob.type}). Utilize fotos nos formatos JPG, PNG ou WebP.`
      );
    }

    // Validação de tamanho máximo (limite de 10MB para uploads de receita)
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
    if (fileOrBlob.size && fileOrBlob.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Tamanho da imagem excede o limite permitido de 10MB (arquivo atual: ${(fileOrBlob.size / (1024 * 1024)).toFixed(1)}MB).`
      );
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let isSettled = false;

      // Monta o formulário de envio multipart
      const formData = new FormData();
      formData.append('file', fileOrBlob);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('tags', 'recipe,geladeira_inteligente');
      formData.append('context', `recipe_id=${recipeId}`);

      // Configuração de timeout seguro
      xhr.timeout = timeoutMs;

      // Monitoramento de progresso do envio
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event: ProgressEvent) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = (event.loaded / event.total) * 100;
            onProgress(Math.min(100, Math.max(0, percent)));
          }
        };
      }

      xhr.onload = () => {
        if (isSettled) return;
        isSettled = true;

        let responseJson: CloudinaryUploadResponse | null = null;
        try {
          responseJson = JSON.parse(xhr.responseText);
        } catch {
          // Erro de parse JSON na resposta
        }

        // Sucesso HTTP (200-299)
        if (xhr.status >= 200 && xhr.status < 300) {
          const finalUrl = responseJson?.secure_url || responseJson?.url;
          if (finalUrl && typeof finalUrl === 'string') {
            if (onProgress) onProgress(100);
            return resolve(finalUrl);
          }

          return reject(
            new Error(
              'Resposta inesperada do serviço de imagens: a URL segura da foto não foi retornada pelo Cloudinary.'
            )
          );
        }

        // Erro retornado pela API do Cloudinary
        const errorMessage =
          responseJson?.error?.message ||
          `Erro no servidor de imagens (HTTP ${xhr.status}: ${xhr.statusText || 'Falha no envio'}).`;

        reject(new Error(`Falha no upload da foto: ${errorMessage}`));
      };

      xhr.onerror = () => {
        if (isSettled) return;
        isSettled = true;
        reject(
          new Error(
            'Erro de rede ao conectar com o serviço de imagens. Verifique sua conexão com a internet e tente novamente.'
          )
        );
      };

      xhr.ontimeout = () => {
        if (isSettled) return;
        isSettled = true;
        reject(
          new Error(
            `Tempo limite de envio excedido (${Math.round(
              timeoutMs / 1000
            )}s). O upload demorou muito para responder. Tente novamente.`
          )
        );
      };

      xhr.onabort = () => {
        if (isSettled) return;
        isSettled = true;
        reject(new Error('O envio da foto foi cancelado.'));
      };

      try {
        xhr.open('POST', this.uploadUrl, true);
        xhr.send(formData);
      } catch (err: any) {
        if (isSettled) return;
        isSettled = true;
        reject(new Error(`Não foi possível iniciar o envio da imagem: ${err?.message || err}`));
      }
    });
  }
}

export const imageUploadService = new ImageUploadService();
