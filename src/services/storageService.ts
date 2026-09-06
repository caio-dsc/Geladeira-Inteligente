import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadMetadata,
  UploadTask,
} from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Serviço de Cloud Storage
 * Estrutura preparada para fotos da geladeira:
 * users/{userId}/scans/{scanId}.jpg
 */

export interface StorageUploadResult {
  downloadUrl: string;
  storagePath: string;
  contentType?: string;
  size?: number;
}

export class StorageService {
  /**
   * Retorna a referência padrão para o avatar de um usuário:
   * users/{userId}/avatar.jpg
   */
  public getAvatarImageRef(userId: string) {
    const safePath = `users/${userId}/avatar.jpg`;
    return ref(storage, safePath);
  }

  /**
   * Faz upload da imagem de avatar do usuário para o Cloud Storage
   * e retorna a downloadUrl pública/autenticada gerada.
   */
  public async uploadAvatarImage(
    userId: string,
    fileOrBlob: Blob | Uint8Array | ArrayBuffer | File,
    metadata?: UploadMetadata
  ): Promise<string> {
    try {
      const storageRef = this.getAvatarImageRef(userId);
      const customMetadata: UploadMetadata = {
        contentType: 'image/jpeg',
        ...metadata,
      };

      const snapshot = await uploadBytes(storageRef, fileOrBlob, customMetadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error: any) {
      console.error('Erro ao realizar upload do avatar no Cloud Storage:', error);
      throw new Error(`Falha no envio da foto de perfil: ${error?.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Retorna a referência padrão para uma imagem de scan de um usuário.
   */
  public getScanImageRef(userId: string, scanId: string) {
    const safePath = `users/${userId}/scans/${scanId}.jpg`;
    return ref(storage, safePath);
  }

  /**
   * Faz upload de uma imagem para o Cloud Storage.
   * (Preparado para ser invocado sob demanda quando o usuário autorizar).
   */
  public async uploadScanImage(
    userId: string,
    scanId: string,
    fileOrBlob: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata
  ): Promise<StorageUploadResult> {
    try {
      const storageRef = this.getScanImageRef(userId, scanId);
      const customMetadata: UploadMetadata = {
        contentType: 'image/jpeg',
        ...metadata,
      };

      const snapshot = await uploadBytes(storageRef, fileOrBlob, customMetadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return {
        downloadUrl,
        storagePath: snapshot.ref.fullPath,
        contentType: snapshot.metadata.contentType,
        size: snapshot.metadata.size,
      };
    } catch (error: any) {
      console.error('Erro ao realizar upload no Cloud Storage:', error);
      throw new Error(`Falha no armazenamento da foto: ${error?.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Converte uma string base64/dataURL em Blob para futuro upload.
   */
  public dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Exclui uma imagem do Cloud Storage.
   */
  public async deleteScanImage(userId: string, scanId: string): Promise<boolean> {
    try {
      const storageRef = this.getScanImageRef(userId, scanId);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.warn('Imagem não encontrada para exclusão ou erro no Storage:', error);
      return false;
    }
  }

  /**
   * Faz upload da imagem de capa de uma receita para o Cloud Storage
   * Caminho isolado: recipes/{recipeId}/cover_{timestamp}.(jpg|png|webp)
   * Suporta acompanhamento de progresso e cancelamento automático por timeout
   */
  public async uploadRecipeImage(
    recipeId: string,
    fileOrBlob: Blob | File,
    onProgress?: (progressPercent: number) => void,
    timeoutMs: number = 20000
  ): Promise<string> {
    if (!recipeId) {
      throw new Error('ID da receita é obrigatório para envio da imagem.');
    }

    // Validação básica e segura de formato de imagem
    const rawType = (fileOrBlob.type || '').toLowerCase();
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (rawType && !allowedTypes.includes(rawType)) {
      throw new Error('Formato incompatível. Envie uma imagem JPEG, PNG ou WebP.');
    }

    const contentType = rawType || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const safePath = `recipes/${recipeId}/cover_${Date.now()}.${ext}`;
    const storageRef = ref(storage, safePath);

    const customMetadata: UploadMetadata = {
      contentType,
    };

    return new Promise<string>((resolve, reject) => {
      let isSettled = false;
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, fileOrBlob, customMetadata);

      // Timeout determinístico para evitar loop de 2 minutos do retry padrão do Firebase SDK
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            uploadTask.cancel();
          } catch {
            // Ignora erro de cancelamento
          }
          reject(
            new Error(
              'Tempo limite de conexão com o Firebase Storage excedido (timeout). O bucket de armazenamento pode não estar provisionado ou ativo no projeto.'
            )
          );
        }
      }, timeoutMs);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.min(100, Math.max(0, percent)));
          }
        },
        (error: any) => {
          clearTimeout(timer);
          if (isSettled) return;
          isSettled = true;

          let friendlyMsg = error?.message || 'Falha no upload para o Storage.';
          if (
            error?.code === 'storage/retry-limit-exceeded' ||
            error?.code === 'storage/canceled'
          ) {
            friendlyMsg =
              'Tempo limite de conexão excedido. O serviço do Firebase Storage não respondeu no tempo esperado (bucket não provisionado ou inacessível).';
          } else if (error?.code === 'storage/unauthorized') {
            friendlyMsg =
              'Permissão negada no Firebase Storage. Apenas administradores autorizados podem salvar fotos de receitas.';
          } else if (error?.code === 'storage/unknown') {
            friendlyMsg =
              'Erro de comunicação com o bucket do Firebase Storage (possível bucket inexistente ou bloqueio de rede).';
          }
          reject(new Error(`Falha no armazenamento da foto da receita: ${friendlyMsg}`));
        },
        async () => {
          clearTimeout(timer);
          if (isSettled) return;
          isSettled = true;

          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err: any) {
            reject(
              new Error(
                `Falha ao obter link público da imagem: ${err?.message || 'Erro desconhecido'}`
              )
            );
          }
        }
      );
    });
  }
}

export const storageService = new StorageService();
