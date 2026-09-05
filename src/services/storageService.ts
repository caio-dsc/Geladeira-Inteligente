import { ref, uploadBytes, getDownloadURL, deleteObject, UploadMetadata } from 'firebase/storage';
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
   */
  public async uploadRecipeImage(
    recipeId: string,
    fileOrBlob: Blob | File
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

    try {
      const snapshot = await uploadBytes(storageRef, fileOrBlob, customMetadata);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error: any) {
      console.error('Erro ao realizar upload da imagem da receita no Cloud Storage:', error);
      throw new Error(`Falha no armazenamento da foto da receita: ${error?.message || 'Erro de permissão ou rede'}`);
    }
  }
}

export const storageService = new StorageService();
