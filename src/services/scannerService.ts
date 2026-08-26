import { DetectedFoodItem } from '../types';
import { SAMPLE_FRIDGE_IMAGES } from '../data/mockData';

export interface IScannerService {
  simulateScan(
    imageUrl: string,
    onProgress?: (msg: string) => void,
    forceError?: boolean
  ): Promise<DetectedFoodItem[]>;

  getSampleImages(): typeof SAMPLE_FRIDGE_IMAGES;
}

interface GeminiScanResponse {
  success: boolean;
  result?: string;
  error?: string;
}

class GeminiScannerService implements IScannerService {
  public getSampleImages() {
    return SAMPLE_FRIDGE_IMAGES;
  }

  public async simulateScan(
    imageUrl: string,
    onProgress?: (msg: string) => void,
    forceError: boolean = false
  ): Promise<DetectedFoodItem[]> {
    if (forceError) {
      throw new Error(
        'Não foi possível identificar alimentos com clareza. Tente tirar a foto com melhor iluminação e com a porta da geladeira aberta.'
      );
    }

    if (!imageUrl) {
      throw new Error('Nenhuma imagem foi selecionada.');
    }

    onProgress?.('Enviando imagem para análise...');

    const response = await fetch('/.netlify/functions/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
      }),
    });

    onProgress?.('Analisando alimentos com Gemini...');

    const data: GeminiScanResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || 'Não foi possível analisar a imagem.'
      );
    }

    onProgress?.('Processando alimentos identificados...');

    /*
     * Nesta primeira integração, a Function ainda retorna
     * texto livre do Gemini.
     *
     * A próxima etapa transformará essa resposta em
     * DetectedFoodItem[] usando JSON estruturado.
     */

    if (!data.result) {
      throw new Error('O Gemini não retornou nenhum resultado.');
    }

    console.log('Resposta do Gemini:', data.result);

    /*
     * Temporariamente retornamos uma lista vazia.
     *
     * Isso é proposital.
     * Primeiro vamos confirmar que:
     *
     * Scanner → Netlify → Gemini
     *
     * está funcionando.
     *
     * Na próxima etapa substituiremos isso pelo
     * JSON estruturado real.
     */

    return [];
  }
}

export const scannerService = new GeminiScannerService();
