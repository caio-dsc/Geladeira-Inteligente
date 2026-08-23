import { DetectedFoodItem, ScanSession } from '../types';
import { SAMPLE_FRIDGE_IMAGES } from '../data/mockData';

export interface IScannerService {
  simulateScan(imageUrl: string, onProgress?: (msg: string) => void, forceError?: boolean): Promise<DetectedFoodItem[]>;
  getSampleImages(): typeof SAMPLE_FRIDGE_IMAGES;
}

const DEFAULT_GENERIC_DETECTIONS: DetectedFoodItem[] = [
  {
    id: `det_${Date.now()}_1`,
    name: 'Ovos Frescos',
    category: 'proteins',
    quantity: 6,
    unit: 'un',
    state: 'fresh',
    location: 'porta',
    confidence: 0.96,
    selected: true,
  },
  {
    id: `det_${Date.now()}_2`,
    name: 'Queijo Muçarela',
    category: 'dairy',
    quantity: 200,
    unit: 'g',
    state: 'fresh',
    location: 'geladeira',
    confidence: 0.94,
    selected: true,
  },
  {
    id: `det_${Date.now()}_3`,
    name: 'Tomates Saladete',
    category: 'vegetables',
    quantity: 3,
    unit: 'un',
    state: 'fresh',
    location: 'gaveta_legumes',
    confidence: 0.91,
    selected: true,
  },
  {
    id: `det_${Date.now()}_4`,
    name: 'Iogurte Natural',
    category: 'dairy',
    quantity: 2,
    unit: 'un',
    state: 'attention',
    location: 'geladeira',
    confidence: 0.88,
    selected: true,
  },
  {
    id: `det_${Date.now()}_5`,
    name: 'Manteiga',
    category: 'dairy',
    quantity: 1,
    unit: 'un',
    state: 'fresh',
    location: 'porta',
    confidence: 0.95,
    selected: true,
  },
];

class MockScannerService implements IScannerService {
  public getSampleImages() {
    return SAMPLE_FRIDGE_IMAGES;
  }

  public async simulateScan(
    imageUrl: string,
    onProgress?: (msg: string) => void,
    forceError: boolean = false
  ): Promise<DetectedFoodItem[]> {
    // Etapa 1
    onProgress?.('Processando qualidade da imagem...');
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (forceError) {
      throw new Error('Não foi possível identificar alimentos com clareza. Tente tirar a foto com melhor iluminação e com a porta da geladeira aberta.');
    }

    // Etapa 2
    onProgress?.('Segmentando compartimentos e prateleiras...');
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Etapa 3
    onProgress?.('Identificando laticínios, vegetais e proteínas...');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Etapa 4
    onProgress?.('Estimando quantidades e estado de conservação...');
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Verificar se corresponde a um sample conhecido
    const sample = SAMPLE_FRIDGE_IMAGES.find((s) => s.url === imageUrl);
    if (sample) {
      return sample.mockDetections.map((d) => ({
        ...d,
        id: `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      }));
    }

    return DEFAULT_GENERIC_DETECTIONS.map((d) => ({
      ...d,
      id: `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    }));
  }
}

export const scannerService = new MockScannerService();
