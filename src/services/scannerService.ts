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
      'Resposta do Hugging Face:',
      data.result
    );

    return this.parseDetectionResult(data.result);
  }

  private parseDetectionResult(
    result: string
  ): DetectedFoodItem[] {
    const items: DetectedFoodItem[] = [];

    const lines = result
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      /*
       * Esperamos inicialmente algo parecido com:
       *
       * - Banana: Quantidade: 6-8 unidades; Unidade: unidades; Confiança: 0.95
       *
       * ou:
       *
       * Banana: Quantidade: 6-8 unidades; Unidade: unidades; Confiança: 0.95
       */

      const cleanLine = line
        .replace(/^[-•*]\s*/, '')
        .trim();

      if (!cleanLine) {
        continue;
      }

      const nameMatch = cleanLine.match(
        /^([^:]+):/
      );

      if (!nameMatch) {
        continue;
      }

      const name = nameMatch[1].trim();

      if (
        !name ||
        name.toLowerCase().includes('não foram identificados')
      ) {
        continue;
      }

      const quantityMatch = cleanLine.match(
        /Quantidade:\s*([^;]+)/i
      );

      const unitMatch = cleanLine.match(
        /Unidade:\s*([^;]+)/i
      );

      const confidenceMatch = cleanLine.match(
        /Confiança:\s*(0(?:\.\d+)?|1(?:\.0+)?)/i
      );

      const rawQuantity =
        quantityMatch?.[1]?.trim() ?? '';

      const unit =
        unitMatch?.[1]?.trim() ?? 'un';

      const confidence = confidenceMatch
        ? Number(confidenceMatch[1])
        : 0.5;

      let quantity = 1;

      /*
       * Se vier algo como "6-8", usamos a média:
       *
       * 6-8 → 7
       *
       * Se vier "6", usamos 6.
       */
      const rangeMatch = rawQuantity.match(
        /(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)/ 
      );

      if (rangeMatch) {
        const min = Number(
          rangeMatch[1].replace(',', '.')
        );

        const max = Number(
          rangeMatch[2].replace(',', '.')
        );

        quantity = Math.round(
          (min + max) / 2
        );
      } else {
        const numberMatch =
          rawQuantity.match(
            /\d+(?:[.,]\d+)?/
          );

        if (numberMatch) {
          quantity = Number(
            numberMatch[0].replace(',', '.')
          );
        }
      }

      const normalizedUnit =
        this.normalizeUnit(unit);

      const category =
        this.guessCategory(name);

      const detectedItem: DetectedFoodItem = {
        id: `det_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,

        name,

        category,

        quantity,

        unit: normalizedUnit,

        state: 'fresh',

        location: 'geladeira',

        confidence: Math.min(
          Math.max(confidence, 0),
          1
        ),

        selected: true,
      };

      items.push(detectedItem);
    }

    if (items.length === 0) {
      throw new Error(
        'A IA analisou a imagem, mas não conseguiu identificar alimentos com clareza.'
      );
    }

    return items;
  }

  private normalizeUnit(unit: string): DetectedFoodItem['unit'] {
    const normalized =
      unit
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (
      normalized.includes('unidade') ||
      normalized === 'un' ||
      normalized === 'unidades'
    ) {
      return 'un';
    }

    if (
      normalized === 'kg' ||
      normalized.includes('quilo')
    ) {
      return 'kg';
    }

    if (
      normalized === 'g' ||
      normalized.includes('gram')
    ) {
      return 'g';
    }

    if (
      normalized === 'l' ||
      normalized.includes('litro')
    ) {
      return 'L';
    }

    if (
      normalized === 'ml' ||
      normalized.includes('mililitro')
    ) {
      return 'ml';
    }

    if (
      normalized === 'pct' ||
      normalized.includes('pacote')
    ) {
      return 'pct';
    }

    if (
      normalized === 'fatias' ||
      normalized.includes('fatia')
    ) {
      return 'fatias';
    }

    return 'un';
  }

  private guessCategory(
    name: string
  ): DetectedFoodItem['category'] {
    const normalized =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (
      /banana|maca|laranja|mamao|manga|uva|morango|abacaxi|limao|pera|melancia|fruta/.test(
        normalized
      )
    ) {
      return 'fruits';
    }

    if (
      /tomate|alface|cenoura|batata|cebola|alho|pepino|brocolis|couve|pimentao|legume|verdura/.test(
        normalized
      )
    ) {
      return 'vegetables';
    }

    if (
      /leite|queijo|iogurte|manteiga|requeijao|creme de leite|laticinio/.test(
        normalized
      )
    ) {
      return 'dairy';
    }

    if (
      /ovo|frango|carne|bife|peixe|presunto|linguica|salsicha|proteina/.test(
        normalized
      )
    ) {
      return 'proteins';
    }

    if (
      /arroz|feijao|macarrao|farinha|aveia|cereal|pao|massa|grao/.test(
        normalized
      )
    ) {
      return 'pantry';
    }

    if (
      /suco|refrigerante|agua|cha|cafe|cerveja|bebida/.test(
        normalized
      )
    ) {
      return 'drinks';
    }

    return 'other';
  }
}

export const scannerService =
  new HuggingFaceScannerService();
