import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Plus,
  Minus,
  X,
  XCircle,
  Scan,
  Pencil,
  Save,
  AlertCircle,
  Clock,
  RefreshCw,
  Smartphone,
  Monitor,
} from 'lucide-react';

import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { FoodItem, DetectedFoodItem, CategoryType, FreshnessState, StorageLocation } from '../../types';
import { foodService } from '../../services/foodService';
import { scannerService, mergeDetectedItems } from '../../services/scannerService';
import {
  getCategoryIcon,
  getCategoryLabel,
} from '../food/FoodCard';
import { ErrorState } from '../common/ErrorState';

export interface ScannerViewProps {
  userCredits: number;
  onDeductCredit: (amount: number) => Promise<boolean>;
  onItemsAdded: (count: number) => void;
  onNavigateToInventory: () => void;
  onOpenCreditsModal: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  userCredits,
  onDeductCredit,
  onItemsAdded,
  onNavigateToInventory,
  onOpenCreditsModal,
}) => {
  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [scanStatus, setScanStatus] = useState<
    'idle' | 'scanning' | 'success' | 'error'
  >('idle');

  const [progressMessage, setProgressMessage] =
    useState('');

  const [detectedItems, setDetectedItems] =
    useState<DetectedFoodItem[]>([]);

  console.log('DETECTED ITEMS NO RENDER:', {
    scanStatus,
    itemsCount: detectedItems.length,
    items: detectedItems,
  });

  const [errorMessage, setErrorMessage] =
    useState('');

  const MAX_CLIENT_ATTEMPTS = 3;
  const [scanAttempt, setScanAttempt] = useState(0);
  const [retryIn, setRetryIn] = useState<number | null>(null);

  useEffect(() => {
    if (retryIn === null) return;
    if (retryIn <= 0) {
      setRetryIn(null);
      return;
    }
    const t = setTimeout(() => setRetryIn((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const [isSaving, setIsSaving] =
    useState(false);

  const [simulatedErrorToggle, setSimulatedErrorToggle] =
    useState(false);

  // Estado para Edição do Item Detectado
  const [editingItem, setEditingItem] = useState<DetectedFoodItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>('vegetables');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<FoodItem['unit']>('un');
  const [editState, setEditState] = useState<FreshnessState>('fresh');
  const [editLocation, setEditLocation] = useState<StorageLocation>('geladeira');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editError, setEditError] = useState('');

  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const cameraInputRef =
    useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] =
    useState(false);

  // Filtra imagens de amostra para exibir apenas referências de alimentos reais da geladeira
  const sampleImages =
    scannerService.getSampleImages().filter(
      (sample) => sample.mockDetections && sample.mockDetections.length > 0
    );

  /*
   * ============================================================
   * FILTRO DE SEGURANÇA DO FRONTEND
   * ============================================================
   *
   * Mesmo que a IA retorne objetos, o frontend não deve mostrar
   * esses elementos como alimentos.
   */

  const NON_FOOD_NAMES = [
    'objeto',
    'objetos',
    'alimento',
    'alimentos',
    'cores',
    'cor',
    'caracteristicas',
    'características',
    'caracteristicas visuais',
    'características visuais',
    'cena',
    'fundo',
    'iluminacao',
    'iluminação',
    'mesa',
    'bancada',
    'prato',
    'prato vazio',
    'computador',
    'notebook',
    'celular',
    'telefone',
    'tablet',
    'medicamento',
    'medicamentos',
    'remedio',
    'remédio',
    'frasco de sal',
    'frasco de pimenta',
    'sal',
    'pimenta',
    'bandeja',
    'panela',
    'frigideira',
    'geladeira',
    'freezer',
    'fogao',
    'fogão',
    'forno',
    'microondas',
    'micro-ondas',
    'liquidificador',
    'cafeteira',
    'talher',
    'talheres',
    'faca',
    'garfo',
    'colher',
    'tábua',
    'tabua',
    'escorredor',
    'escorredor de macarrão',
    'escorredor de macarrao',
    'pote vazio',
    'recipiente vazio',
    'embalagem vazia',
    'caixa vazia',
    'saco vazio',
    'garrafa vazia',
  ];

  /*
   * Remove Markdown que eventualmente venha da IA.
   *
   * Exemplos:
   *
   * **Bananas** -> Bananas
   * *Bananas*   -> Bananas
   * - Bananas   -> Bananas
   */

  const cleanFoodName = (name: string): string => {
    return name
      .replace(/[*_`#]/g, '')
      .replace(/^[-•]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /*
   * Verifica se o nome retornado pela IA parece ser
   * um objeto que não deve entrar no inventário.
   */

  const isClearlyNonFood = (name: string): boolean => {
    const normalized = cleanFoodName(name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (!normalized) {
      return true;
    }

    return NON_FOOD_NAMES.some((blocked) => {
      const normalizedBlocked = blocked
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      return (
        normalized === normalizedBlocked ||
        normalized.includes(normalizedBlocked)
      );
    });
  };

  /*
   * Normaliza o estado.
   *
   * O projeto passa a trabalhar apenas com:
   *
   * fresh
   * frozen
   */

  const normalizeFreshness = (
    state: DetectedFoodItem['state']
  ): 'fresh' | 'frozen' => {
    if (state === 'frozen') {
      return 'frozen';
    }

    return 'fresh';
  };

  /*
   * Filtra e normaliza os resultados vindos da IA.
   */

  const sanitizeDetectedItems = (
  results: DetectedFoodItem[]
): DetectedFoodItem[] => {

  const validItems: DetectedFoodItem[] = [];

  for (const item of results) {

    if (!item || !item.name) {
      continue;
    }

    // Remove Markdown da resposta da IA
    const cleanedName = item.name
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/^[-•]\s*/, '')
      .trim();

    const normalizedName = cleanedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // =====================================================
    // DESCARTAR QUALQUER COISA QUE NÃO SEJA ALIMENTO
    // =====================================================

    const blockedWords = [
      'objeto',
      'objetos',
      'alimento',
      'alimentos',
      'cor',
      'cores',
      'caracteristica',
      'caracteristicas',
      'características',
      'características visuais',
      'cena',
      'fundo',
      'mesa',
      'bancada',
      'prato',
      'prato vazio',
      'computador',
      'notebook',
      'celular',
      'telefone',
      'tablet',
      'medicamento',
      'medicamentos',
      'remedio',
      'remédio',
      'sal',
      'pimenta',
      'bandeja',
      'panela',
      'frigideira',
      'geladeira',
      'freezer',
      'fogao',
      'fogão',
      'forno',
      'microondas',
      'micro-ondas',
      'liquidificador',
      'cafeteira',
      'talher',
      'talheres',
      'faca',
      'garfo',
      'colher',
      'tabua',
      'tábua',
      'escorredor',
      'recipiente',
      'frasco',
      'embalagem',
      'caixa',
      'garrafa',
      'computador',
      'celular',
      'mesa'
    ];

    const isBlocked = blockedWords.some(
      (blocked) =>
        normalizedName === blocked ||
        normalizedName.includes(blocked)
    );

    if (isBlocked) {
      console.log(
        'ITEM DESCARTADO PELO FRONTEND:',
        cleanedName
      );

      continue;
    }

    // =====================================================
    // ALIMENTOS CONHECIDOS
    // =====================================================

    const knownFoods = [
      'banana',
      'bananas',

      'abacate',
      'abacates',

      'limao',
      'limoes',

      'maca',
      'macas',

      'pera',
      'peras',

      'manga',
      'mangas',

      'laranja',
      'laranjas',

      'mamao',
      'mamaos',

      'melancia',
      'melancias',

      'melao',
      'meloes',

      'uva',
      'uvas',

      'morango',
      'morangos',

      'abacaxi',
      'abacaxis',

      'kiwi',
      'kiwis',

      'coco',
      'cocos',

      'tomate',
      'tomates',

      'batata',
      'batatas',

      'cenoura',
      'cenouras',

      'cebola',
      'cebolas',

      'alho',

      'pepino',
      'pepinos',

      'pimentao',
      'pimentoes',

      'alface',

      'brocolis',

      'couve',

      'espinafre',

      'milho',

      'ervilha',
      'ervilhas',

      'feijao',

      'arroz',

      'macarrao',

      'carne',

      'frango',

      'peixe',

      'ovo',
      'ovos',

      'queijo',

      'leite',

      'iogurte',

      'manteiga',

      'presunto',

      'pao',

      'azeitona',
      'azeitonas'
    ];

    const isFood = knownFoods.some(
      (food) => {
        return (
          normalizedName === food ||
          normalizedName.includes(food)
        );
      }
    );

    // Se não for alimento conhecido,
    // NÃO aparece na tela.
    if (!isFood) {

      console.log(
        'ITEM NÃO RECONHECIDO COMO ALIMENTO:',
        cleanedName
      );

      continue;
    }

    // =====================================================
    // ADICIONA O ALIMENTO
    // =====================================================

    validItems.push({
      ...item,

      name: cleanedName,

      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,

      unit: item.unit || 'un',

      state:
        item.state === 'frozen'
          ? 'frozen'
          : 'fresh',

      confidence:
        typeof item.confidence === 'number'
          ? item.confidence
          : 0.5,

      selected: true
    });
  }

  // =====================================================
  // MESCLA E AGRUPA ITENS REPETIDOS (mergeDetectedItems)
  // =====================================================

  return mergeDetectedItems(validItems);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(
            event.target.result as string
          );

          setScanStatus('idle');
          setDetectedItems([]);
          setErrorMessage('');
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setScanStatus('idle');
          setDetectedItems([]);
          setErrorMessage('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (
    url: string
  ) => {
    setSelectedImage(url);
    setScanStatus('idle');
    setDetectedItems([]);
    setErrorMessage('');
  };

  const runScan = async (imageToScan: string) => {
    let results: DetectedFoodItem[] | null = null;

    for (let attempt = 1; attempt <= MAX_CLIENT_ATTEMPTS; attempt++) {
      setScanAttempt(attempt);

      try {
        setProgressMessage(`Tentativa ${attempt}/${MAX_CLIENT_ATTEMPTS} — Analisando...`);

        results = await scannerService.simulateScan(
          imageToScan,
          (stage) => setProgressMessage(`Tentativa ${attempt}/${MAX_CLIENT_ATTEMPTS} — ${stage}`),
          simulatedErrorToggle
        );

        break;
      } catch (err: any) {
        const isRetriable = err?.name === 'ScanServiceError' && err?.retriable;
        if (isRetriable && attempt < MAX_CLIENT_ATTEMPTS) {
          const waitSec = typeof err.retryAfterSeconds === 'number' ? err.retryAfterSeconds : 2;
          setProgressMessage(`Servidor ocupado. Tentando de novo em ${waitSec}s...`);
          await sleep(waitSec * 1000);
          continue;
        }
        throw err;
      }
    }

    if (!results) throw new Error('Falha ao obter resultado da IA.');

    let sanitized = sanitizeDetectedItems(results);
    sanitized = mergeDetectedItems(sanitized);

    if (sanitized.length === 0) {
      throw new Error('Nenhum alimento foi identificado com clareza. Tente uma foto mais próxima.');
    }

    const deducted = await onDeductCredit(1);
    if (!deducted) {
      onOpenCreditsModal();
      throw new Error('Sem créditos para concluir a análise.');
    }

    setDetectedItems(sanitized);
    setScanStatus('success');
  };

  const handleStartScan = async () => {
    if (!selectedImage) return;

    if (userCredits <= 0) {
      onOpenCreditsModal();
      return;
    }

    try {
      setScanStatus('scanning');
      setErrorMessage('');
      setRetryIn(null);
      setProgressMessage('Preparando análise...');

      await runScan(selectedImage);
    } catch (err: any) {
      if (err?.name === 'ScanServiceError' && err?.status === 503) {
        const waitSec = typeof err.retryAfterSeconds === 'number' ? err.retryAfterSeconds : 3;
        setRetryIn(waitSec);
      }

      setScanStatus('error');
      setErrorMessage(err?.message || 'Falha ao processar imagem.');
    }
  };

  /*
   * Selecionar / desselecionar alimento.
   */

  const handleToggleItem = (
    id: string
  ) => {
    setDetectedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              selected: !item.selected,
            }
          : item
      )
    );
  };

  /*
   * Helper para verificar se a unidade trabalha estritamente com inteiros.
   */

  const isIntegerUnit = (unit?: string): boolean => {
    if (!unit) return true;
    return ['un', 'pct', 'fatias', 'g', 'ml'].includes(unit.toLowerCase().trim());
  };

  /*
   * Retorna o delta inteligente por unidade para os botões + e -.
   * un -> 1 | g -> 50 | kg -> 0.1 | ml -> 100 | L -> 0.1
   */
  const getDelta = (unit?: string): number => {
    const u = (unit || 'un').toLowerCase().trim();
    if (u === 'un' || u === 'pct' || u === 'fatias') return 1;
    if (u === 'g') return 50;
    if (u === 'kg') return 0.1;
    if (u === 'ml') return 100;
    if (u === 'l' || u === 'l/ml') return 0.1;
    return 1;
  };

  /*
   * Retorna a quantidade mínima permitida por unidade.
   */
  const getMinQty = (unit?: string): number => {
    const u = (unit || 'un').toLowerCase().trim();
    if (u === 'g') return 50;
    if (u === 'ml') return 100;
    if (u === 'kg' || u === 'l' || u === 'l/ml') return 0.1;
    return 1;
  };

  /*
   * Formata a unidade de forma compacta (ex: 'uni', 'kg', 'pct').
   */

  const formatUnitShort = (unit?: string): string => {
    const u = (unit || 'un').toLowerCase().trim();
    switch (u) {
      case 'un':
        return 'uni';
      case 'pct':
        return 'pct';
      case 'fatias':
        return 'fat';
      case 'kg':
        return 'kg';
      case 'g':
        return 'g';
      case 'l':
        return 'L';
      case 'ml':
        return 'ml';
      default:
        return unit || 'uni';
    }
  };

  /*
   * Alterar quantidade via botões - e +.
   */

  const handleQuantityChange = (
    id: string,
    delta: number
  ) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const isInt = isIntegerUnit(item.unit);
        const minQty = getMinQty(item.unit);
        let newQuantity: number;

        if (isInt) {
          newQuantity = Math.max(
            minQty,
            Math.round(item.quantity + delta)
          );
        } else {
          const updated = parseFloat((item.quantity + delta).toFixed(2));
          newQuantity = Math.max(minQty, updated);
        }

        return {
          ...item,
          quantity: newQuantity,
        };
      })
    );
  };

  /*
   * Alterar quantidade via digitação direta no campo numérico.
   */

  const handleQuantityInputChange = (
    id: string,
    rawValue: string
  ) => {
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const minQty = getMinQty(item.unit);

        if (rawValue === '') {
          return {
            ...item,
            quantity: minQty,
          };
        }

        const isInt = isIntegerUnit(item.unit);
        let parsed: number;
        if (isInt) {
          const intVal = parseInt(rawValue, 10);
          parsed = isNaN(intVal) ? minQty : Math.max(minQty, intVal);
        } else {
          const floatVal = parseFloat(rawValue.replace(',', '.'));
          parsed = isNaN(floatVal) ? minQty : Math.max(minQty, floatVal);
        }

        return {
          ...item,
          quantity: parsed,
        };
      })
    );
  };

  /*
   * Abrir modal para editar alimento detectado.
   */
  const handleOpenEditModal = (item: DetectedFoodItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditState(item.state);
    setEditLocation(item.location || 'geladeira');
    setEditExpiryDate(item.expiryDate || '');
    setEditError('');
  };

  /*
   * Salvar alterações feitas no modal de edição.
   */
  const handleSaveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editName.trim()) {
      setEditError('Por favor, informe o nome do alimento.');
      return;
    }

    const finalQty = Number(editQuantity);
    if (isNaN(finalQty) || finalQty <= 0) {
      setEditError('Informe uma quantidade válida maior que zero.');
      return;
    }

    setDetectedItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: editName.trim(),
              category: editCategory,
              quantity: finalQty,
              unit: editUnit,
              state: editState,
              location: editLocation,
              expiryDate: editExpiryDate.trim() ? editExpiryDate.trim() : undefined,
            }
          : item
      )
    );

    setEditingItem(null);
  };

  /*
   * Selecionar todos.
   */

  const handleSelectAll = (
    select: boolean
  ) => {
    setDetectedItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: select,
      }))
    );
  };

  /*
   * Salvar no estoque.
   *
   * Aqui usamos a quantidade que o usuário
   * confirmou através dos botões.
   */

  const handleSaveToInventory =
    async () => {
      const selected =
        detectedItems.filter(
          (i) => i.selected
        );

      if (selected.length === 0) {
        return;
      }

      try {
        setIsSaving(true);

        const itemsToAdd:
          Array<
            Omit<FoodItem, 'id' | 'addedAt'>
          > = selected.map((d) => ({
            name: d.name,
            category: d.category,
            quantity: d.quantity,
            unit: d.unit,
            state:
              d.state === 'frozen'
                ? 'frozen'
                : 'fresh',
            location: d.location,
            notes: `Detectado via Scanner (${(
              d.confidence * 100
            ).toFixed(0)}% de precisão)`,
          }));

        await foodService.addMultipleItems(
          itemsToAdd
        );

        onItemsAdded(selected.length);

        onNavigateToInventory();
      } catch (e: any) {
        alert(
          'Erro ao salvar alimentos: ' +
            e.message
        );
      } finally {
        setIsSaving(false);
      }
    };

  const handleResetScanner = () => {
    setSelectedImage(null);
    setScanStatus('idle');
    setDetectedItems([]);
    setErrorMessage('');
    setProgressMessage('');
  };

  const selectedCount =
    detectedItems.filter(
      (i) => i.selected
    ).length;

  const allSelected =
    detectedItems.length > 0 &&
    detectedItems.every(
      (i) => i.selected
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-10 text-text-primary text-left">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-2 backdrop-blur-xs">
            <Scan className="w-3.5 h-3.5" />
            <span>Visão Computacional de Alimentos</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Escanear Geladeira
          </h1>

          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Identifique ingredientes automaticamente a partir de fotografias.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-surface px-3.5 py-2 rounded-xl border border-border shadow-subtle">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Custo: 1 crédito por análise</span>
        </div>
      </div>

      {/* UPLOAD */}
      {scanStatus !== 'success' && (
        <Card
          variant="default"
          padding="none"
          className="overflow-hidden shadow-subtle border-border"
        >
          {!selectedImage ? (
            <div className="p-5 sm:p-8 space-y-6">
              {/* EXPERIÊNCIA MOBILE: Foco em Abrir Câmera */}
              <div className="sm:hidden space-y-4">
                <div className="text-center p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary text-white flex items-center justify-center shadow-soft">
                    <Camera className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      Fotografar Geladeira
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Aponte a câmera para as prateleiras ou gavetas de alimentos.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2.5">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full justify-center font-bold shadow-subtle py-3"
                      leftIcon={<Camera className="w-5 h-5" />}
                    >
                      Abrir Câmera
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full justify-center text-xs"
                      leftIcon={<Upload className="w-4 h-4" />}
                    >
                      Selecionar Foto da Galeria
                    </Button>
                  </div>
                </div>
              </div>

              {/* EXPERIÊNCIA DESKTOP: Foco em Selecionar Foto / Arrastar Arquivo */}
              <div className="hidden sm:block">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 cursor-pointer transition-all flex flex-col items-center justify-center group ${
                    isDragging
                      ? 'border-primary bg-primary/5 shadow-soft scale-[1.01]'
                      : 'border-border hover:border-primary/40 bg-surface hover:bg-surface-muted shadow-subtle'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>

                  <h3 className="text-lg font-bold text-text-primary">
                    Selecione ou arraste a foto da geladeira
                  </h3>

                  <p className="text-xs text-text-secondary mt-1 max-w-sm text-center">
                    Formatos aceitos: JPG, PNG ou WebP com visualização nítida dos alimentos.
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      leftIcon={<Upload className="w-4 h-4" />}
                    >
                      Selecionar Foto do Computador
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      leftIcon={<Camera className="w-4 h-4" />}
                    >
                      Usar Câmera / Webcam
                    </Button>
                  </div>
                </div>
              </div>

              {/* INPUTS DE CAPTURA/ARQUIVO */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* FOTOS DE AMOSTRA DE ALIMENTOS PARA TESTES RÁPIDOS */}
              {sampleImages.length > 0 && (
                <div className="space-y-3 pt-2 text-center">
                  <div className="flex items-center gap-2 justify-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Fotos de alimentos para teste rápido</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {sampleImages.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample.url)}
                        className="p-3 rounded-2xl border border-border hover:border-primary/40 bg-surface hover:bg-surface-muted transition-all cursor-pointer flex items-center gap-3 text-left group shadow-subtle"
                      >
                        <img
                          src={sample.url}
                          alt={sample.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-border"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-text-primary group-hover:text-primary line-clamp-1 transition-colors">
                            {sample.name}
                          </h4>

                          <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">
                            {sample.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="relative aspect-16/10 sm:aspect-21/9 w-full bg-surface-muted overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Geladeira para análise"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {scanStatus === 'scanning' && (
                  <div className="absolute inset-0 bg-surface/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-text-primary">
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(22,160,133,0.6)] pointer-events-none"
                    />

                    <div className="relative w-14 h-14 rounded-full border-4 border-primary/20 flex items-center justify-center mb-4">
                      <div className="w-9 h-9 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    </div>

                    <h4 className="text-base font-bold text-text-primary">
                      Analisando alimentos com IA...
                    </h4>

                    <p className="text-xs text-text-secondary mt-1 max-w-sm animate-pulse font-medium">
                      {progressMessage || 'Identificando alimentos...'}
                    </p>
                  </div>
                )}

                {scanStatus !== 'scanning' && (
                  <button
                    onClick={handleResetScanner}
                    className="absolute top-3 right-3 p-2 rounded-full bg-surface/90 hover:bg-surface text-text-primary border border-border shadow-subtle backdrop-blur-md transition-colors cursor-pointer"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {scanStatus !== 'scanning' && (
                <div className="p-4 sm:p-5 bg-surface flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
                  <div className="text-xs text-text-secondary text-center sm:text-left">
                    <span className="font-bold text-text-primary block">
                      Imagem pronta para reconhecimento
                    </span>
                    A IA identificará apenas alimentos. Você confirmará as quantidades.
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleResetScanner}
                      className="flex-1 sm:flex-none text-xs"
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Trocar Foto
                    </Button>

                    <Button
                      variant="primary"
                      onClick={handleStartScan}
                      className="flex-1 sm:flex-none font-bold"
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Analisar Geladeira (1 Crédito)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ERROR / MODEL BUSY (503) */}
      {scanStatus === 'error' && (
        <div className="space-y-4">
          {errorMessage.toLowerCase().includes('ocupado') ||
          errorMessage.toLowerCase().includes('busy') ||
          errorMessage.toLowerCase().includes('503') ||
          errorMessage.toLowerCase().includes('demanda') ? (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xs shadow-subtle">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center mb-3 border border-amber-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-800 text-xs font-semibold mb-2">
                <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${retryIn ? 'animate-spin' : ''}`} />
                {retryIn ? `Aguardando cooldown (${retryIn}s)` : 'Alta Demanda do Modelo de IA'}
              </div>
              <h4 className="text-base font-bold text-text-primary mb-1">
                Servidor temporariamente ocupado
              </h4>
              <p className="text-xs sm:text-sm text-text-secondary max-w-md mb-5 leading-relaxed">
                O modelo de IA recebeu muitas requisições simultâneas. <strong>Sua foto continua preservada</strong> para que você possa tentar novamente sem precisar tirar outra.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={handleStartScan}
                  disabled={retryIn !== null && retryIn > 0}
                  variant="primary"
                  size="md"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${retryIn ? 'animate-spin' : ''}`} />}
                >
                  {retryIn !== null && retryIn > 0
                    ? `Aguarde ${retryIn}s para tentar...`
                    : 'Tentar novamente com a mesma foto'}
                </Button>
                <Button
                  onClick={handleResetScanner}
                  variant="ghost"
                  size="md"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Trocar foto
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ErrorState
                title="Falha na análise da imagem"
                message={errorMessage}
                retryLabel={
                  retryIn !== null && retryIn > 0
                    ? `Aguarde ${retryIn}s...`
                    : 'Tentar novamente com a mesma foto'
                }
                retryDisabled={retryIn !== null && retryIn > 0}
                retryHint={
                  retryIn !== null && retryIn > 0
                    ? `Aguarde o término do cooldown (${retryIn}s) para reenviar`
                    : undefined
                }
                onRetry={handleStartScan}
              />
              <div className="flex justify-center">
                <Button
                  onClick={handleResetScanner}
                  variant="ghost"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Escolher outra foto
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULTADOS */}
      {scanStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="p-4 sm:p-5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-subtle shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-text-primary">
                  {detectedItems.length} {detectedItems.length === 1 ? 'Alimento Identificado' : 'Alimentos Identificados'} com Sucesso!
                </h3>

                <p className="text-xs text-text-secondary">
                  Revise a lista abaixo e selecione quais deseja sincronizar com o estoque.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetScanner}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs shrink-0"
            >
              Nova Análise
            </Button>
          </div>

          <Card
            variant="default"
            padding="none"
            className="overflow-hidden shadow-subtle border-border"
          >
            {/* CABEÇALHO */}
            <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-surface-muted/60">
              <button
                onClick={() => handleSelectAll(!allSelected)}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-primary hover:text-primary cursor-pointer transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-text-secondary" />
                )}

                <span>Selecionar todos</span>
              </button>

              <span className="text-xs text-text-secondary font-medium">
                {selectedCount} de {detectedItems.length} selecionados
              </span>
            </div>

            {/* LISTA */}
            <div className="divide-y divide-border/60">
              {detectedItems.map((item) => {
                const delta = getDelta(item.unit);
                const minQty = getMinQty(item.unit);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`p-4 sm:p-5 transition-all cursor-pointer ${
                      item.selected
                        ? 'bg-primary/5 hover:bg-primary/8'
                        : 'bg-surface hover:bg-surface-muted/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* CHECKBOX */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleItem(item.id);
                        }}
                        className="mt-1 shrink-0 cursor-pointer text-primary transition-colors"
                        aria-label={
                          item.selected
                            ? 'Desmarcar alimento'
                            : 'Selecionar alimento'
                        }
                      >
                        {item.selected ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-border" />
                        )}
                      </button>

                      {/* ÍCONE DA CATEGORIA */}
                      <div className="mt-0.5 w-10 h-10 rounded-xl bg-surface-muted border border-border flex items-center justify-center shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>

                      {/* BLOCO DO ITEM COM NOME, CATEGORIA, PRECISÃO E CONTROLE DE QUANTIDADE */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm sm:text-base font-bold text-text-primary truncate">
                            {item.name}
                          </h4>

                          <div
                            className="flex items-center gap-1 sm:gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item.id, -delta);
                              }}
                              disabled={item.quantity <= minQty}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                              aria-label={`Diminuir quantidade de ${item.name}`}
                            >
                              −
                            </button>

                            <input
                              type="number"
                              min={minQty}
                              step={delta}
                              value={item.quantity}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleQuantityInputChange(item.id, e.target.value);
                              }}
                              className="w-12 sm:w-14 h-7 sm:h-8 rounded-lg border border-border bg-surface text-text-primary text-center text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                              aria-label={`Quantidade de ${item.name}`}
                            />

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item.id, delta);
                              }}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-muted flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                              aria-label={`Aumentar quantidade de ${item.name}`}
                            >
                              +
                            </button>

                            <span className="text-[10px] sm:text-xs font-bold uppercase text-primary ml-0.5 min-w-[20px] text-center">
                              {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* LINHA 2: Categoria + Confiança + Botão Editar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary mt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-secondary">{getCategoryLabel(item.category)}</span>
                            <span className="text-border">•</span>

                            <span className="text-[11px] text-primary font-semibold">
                              {(item.confidence * 100).toFixed(0)}% de precisão
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(item);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/15 px-2 py-0.5 rounded-md border border-primary/20 transition-colors shadow-xs cursor-pointer"
                            aria-label={`Editar ${item.name}`}
                          >
                            <Pencil className="w-3 h-3 text-primary" />
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RODAPÉ */}
            <div className="p-4 bg-surface-muted/60 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-text-secondary text-center sm:text-left">
                Os itens adicionados atualizarão instantaneamente o cálculo das receitas compatíveis.
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleSaveToInventory}
                isLoading={isSaving}
                disabled={selectedCount === 0}
                leftIcon={<Plus className="w-4 h-4" />}
                className="w-full sm:w-auto font-bold"
              >
                Adicionar {selectedCount}{' '}
                {selectedCount === 1 ? 'Item' : 'Itens'} à Geladeira
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* MODO DEMONSTRAÇÃO */}
      <div className="p-3.5 rounded-2xl bg-surface border border-border text-xs text-text-secondary flex items-center justify-between shadow-subtle">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Modo Demonstração: Simular falha de captura de foto
        </span>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={simulatedErrorToggle}
            onChange={(e) => setSimulatedErrorToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
        </label>
      </div>

      {/* MODAL DE EDIÇÃO DO ITEM DETECTADO */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Alimento Detectado"
        subtitle="Ajuste o nome, categoria e detalhes do alimento antes de salvar"
        maxWidth="md"
      >
        {editingItem && (
          <form onSubmit={handleSaveEditModal} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{editError}</span>
              </div>
            )}

            <Input
              label="Nome do Alimento *"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                setEditError('');
              }}
              placeholder="Ex: Banana, Leite, Tomate..."
              autoFocus
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-text-primary">
                  Categoria *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CategoryType)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                >
                  <option value="vegetables">Legumes & Verduras</option>
                  <option value="fruits">Frutas</option>
                  <option value="dairy">Laticínios</option>
                  <option value="proteins">Proteínas & Ovos</option>
                  <option value="drinks">Bebidas</option>
                  <option value="pantry">Despensa & Grãos</option>
                  <option value="condiments">Temperos & Molhos</option>
                  <option value="bakery">Pães & Massas</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-text-primary">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min={getMinQty(editUnit)}
                    step={getDelta(editUnit)}
                    value={editQuantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEditQuantity(isNaN(val) ? 1 : val);
                      setEditError('');
                    }}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-text-primary">
                    Unidade *
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as FoodItem['unit'])}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                  >
                    <option value="un">un</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pct">pct</option>
                    <option value="fatias">fatias</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-text-primary">
                  Local de Armazenamento
                </label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value as StorageLocation)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                >
                  <option value="geladeira">Geladeira (Principal)</option>
                  <option value="freezer">Freezer / Congelador</option>
                  <option value="gaveta_legumes">Gaveta de Legumes</option>
                  <option value="porta">Porta da Geladeira</option>
                  <option value="despensa">Despensa</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-text-primary">
                  Estado
                </label>
                <select
                  value={editState}
                  onChange={(e) => setEditState(e.target.value as FreshnessState)}
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                >
                  <option value="fresh">Fresco / Refrigerado</option>
                  <option value="frozen">Congelado</option>
                </select>
              </div>
            </div>

            <Input
              type="date"
              label="Data de Validade (opcional)"
              value={editExpiryDate}
              onChange={(e) => setEditExpiryDate(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setEditingItem(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
