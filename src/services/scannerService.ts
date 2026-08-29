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

interface HuggingFaceScanResponse {
  success: boolean;
  result?: string;
  error?: string;
}

interface StructuredFoodDetection {
  items: Array<{
    name: string;
    category: DetectedFoodItem['category'];
    quantity: number;
    unit: DetectedFoodItem['unit'];
    state: DetectedFoodItem['state'];
    location: DetectedFoodItem['location'] | null;
    confidence: number;
    expiryDate: string | null;
    expirySource: 'image' | null;
  }>;
}

const ALLOWED_CATEGORIES: DetectedFoodItem['category'][] = [
  'vegetables',
  'fruits',
  'dairy',
  'proteins',
  'drinks',
  'pantry',
  'condiments',
  'bakery',
];

class HuggingFaceScannerService implements IScannerService {
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

    onProgress?.('Analisando alimentos com IA...');

    const data: HuggingFaceScanResponse = await response.json();

    if (!response.ok || !data.success) {
      console.error(
        'Erro retornado pela função scan:',
        data
      );

      const details =
        typeof data === 'object'
          ? JSON.stringify(data, null, 2)
          : '';

      throw new Error(
        `${data.error || 'Não foi possível analisar a imagem.'}${
          details ? `\n\nDetalhes: ${details}` : ''
        }`
      );
    }

    if (!data.result) {
      throw new Error(
        'A IA não retornou nenhum resultado.'
      );
    }

    onProgress?.('Processando alimentos identificados...');

    console.log(
      'Resposta estruturada do Hugging Face:',
      data.result
    );

    return this.parseStructuredResult(data.result);
  }

  private parseStructuredResult(
    result: string
  ): DetectedFoodItem[] {
    let parsed: StructuredFoodDetection;

    try {
      parsed = JSON.parse(result);
    } catch (error) {
      console.error(
        'O Hugging Face retornou um JSON inválido:',
        result,
        error
      );

      throw new Error(
        'A IA retornou uma resposta inválida. Tente tirar a foto novamente.'
      );
    }

    if (
      !parsed ||
      !Array.isArray(parsed.items)
    ) {
      throw new Error(
        'A IA não retornou uma lista válida de alimentos.'
      );
    }

    const validItems: DetectedFoodItem[] = [];

    for (const item of parsed.items) {
      if (!this.isValidFoodItem(item)) {
        console.warn(
          'Item rejeitado pelo filtro de alimentos:',
          item
        );

        continue;
      }

      validItems.push({
        id: `det_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,

        name: item.name.trim(),

        category: item.category,

        quantity: item.quantity,

        unit: item.unit,

        state: item.state,

        location:
          item.location ?? 'geladeira',

        confidence: item.confidence,

        selected: true,
      });
    }

    if (validItems.length === 0) {
      throw new Error(
        'Nenhum alimento foi identificado na imagem.'
      );
    }

    return validItems;
  }

  private isValidFoodItem(
    item: StructuredFoodDetection['items'][number]
  ): boolean {
    if (!item) {
      return false;
    }

    if (
      typeof item.name !== 'string' ||
      !item.name.trim()
    ) {
      return false;
    }

    if (
      !ALLOWED_CATEGORIES.includes(
        item.category
      )
    ) {
      return false;
    }

    if (
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      return false;
    }

    if (
      typeof item.confidence !== 'number' ||
      !Number.isFinite(item.confidence) ||
      item.confidence < 0 ||
      item.confidence > 1
    ) {
      return false;
    }

    if (
      item.expiryDate !== null &&
      typeof item.expiryDate !== 'string'
    ) {
      return false;
    }

    if (
      item.expirySource !== null &&
      item.expirySource !== 'image'
    ) {
      return false;
    }

    return true;
  }
}

export const scannerService =
  new HuggingFaceScannerService();
