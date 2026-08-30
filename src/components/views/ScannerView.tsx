import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Image as ImageIcon,
  ImageOff,
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
  Loader2,
  History,
  Trash2,
  FolderOpen,
} from 'lucide-react';

import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { FoodItem, DetectedFoodItem, CategoryType, FreshnessState, StorageLocation, ScanSession } from '../../types';
import { foodService } from '../../services/foodService';
import { scannerService, mergeDetectedItems } from '../../services/scannerService';
import { firestoreService } from '../../services/firestoreService';
import { storageService } from '../../services/storageService';
import { auth } from '../../services/firebaseConfig';
import {
  getCategoryIcon,
  getCategoryLabel,
} from '../food/FoodCard';
import { EmptyState } from '../common/EmptyState';
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

  const [scanHistory, setScanHistory] = useState<ScanSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setHistoryLoading(false);
      return;
    }

    const unsub = firestoreService.subscribeScans(uid, 10, (scans) => {
      setScanHistory(scans);
      setHistoryLoading(false);
    });

    return () => unsub();
  }, []);

  const makeScanId = () =>
    `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

  const sampleImages =
    scannerService.getSampleImages();

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

  const handleSelectSample = (
    url: string
  ) => {
    setSelectedImage(url);
    setScanStatus('idle');
    setDetectedItems([]);
    setErrorMessage('');
  };

  const runScan = async (imageToScan: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Usuário não autenticado.');

    const scanId = makeScanId();
    const timestamp = new Date().toISOString();

    // 1) cria registro inicial (processing)
    await firestoreService.saveScanRecord(uid, {
      id: scanId,
      imageUrl: '',           // vamos preencher depois
      timestamp,
      status: 'processing',
      progressMessage: 'Preparando análise...',
      detectedItems: [],
    });

    // 2) se for dataURL, faz upload para Storage e usa URL https (melhor pro histórico)
    let imageUrlForScan = imageToScan;
    let imageUrlForHistory = '';

    if (imageToScan.startsWith('data:image/')) {
      try {
        setProgressMessage('Salvando foto do scan...');
        const blob = storageService.dataUrlToBlob(imageToScan);
        const up = await storageService.uploadScanImage(uid, scanId, blob);
        imageUrlForScan = up.downloadUrl;
        imageUrlForHistory = up.downloadUrl;
      } catch (e) {
        // fallback: continua o scan, mas sem foto no histórico
        console.warn('Upload falhou, continuando sem salvar foto no histórico:', e);
        imageUrlForScan = imageToScan;
        imageUrlForHistory = '';
      }
    } else {
      // já é URL (reprocessar ou imagem de exemplo)
      imageUrlForScan = imageToScan;
      imageUrlForHistory = imageToScan;
    }

    // atualiza registro com imageUrl
    await firestoreService.saveScanRecord(uid, {
      id: scanId,
      imageUrl: imageUrlForHistory,
      timestamp,
      status: 'processing',
      progressMessage: 'Analisando alimentos com IA...',
      detectedItems: [],
    });

    // 3) chama IA com retries do cliente
    let results: DetectedFoodItem[] | null = null;

    for (let attempt = 1; attempt <= MAX_CLIENT_ATTEMPTS; attempt++) {
      setScanAttempt(attempt);

      try {
        setProgressMessage(`Tentativa ${attempt}/${MAX_CLIENT_ATTEMPTS} — Preparando análise...`);

        results = await scannerService.simulateScan(
          imageUrlForScan,
          (stage) => setProgressMessage(`Tentativa ${attempt}/${MAX_CLIENT_ATTEMPTS} — ${stage}`),
          simulatedErrorToggle
        );

        break; // sucesso
      } catch (err: any) {
        const isRetriable = err?.name === 'ScanServiceError' && err?.retriable;

        if (isRetriable && attempt < MAX_CLIENT_ATTEMPTS) {
          const waitSec = typeof err.retryAfterSeconds === 'number' ? err.retryAfterSeconds : 2;
          setProgressMessage(`Servidor ocupado. Tentando de novo em ${waitSec}s...`);
          await sleep(waitSec * 1000);
          continue;
        }

        throw err; // erro final
      }
    }

    if (!results) throw new Error('Falha ao obter resultado da IA.');

    let sanitized = sanitizeDetectedItems(results);
    sanitized = mergeDetectedItems(sanitized);

    if (sanitized.length === 0) {
      throw new Error('Nenhum alimento foi identificado com clareza. Tente uma foto mais próxima.');
    }

    // 4) cobrar crédito no sucesso
    const deducted = await onDeductCredit(1);
    if (!deducted) {
      onOpenCreditsModal();
      throw new Error('Sem créditos para concluir a análise.');
    }

    // 5) atualiza UI
    setDetectedItems(sanitized);
    setScanStatus('success');

    // 6) salva sucesso no histórico
    await firestoreService.saveScanRecord(uid, {
      id: scanId,
      imageUrl: imageUrlForHistory,
      timestamp,
      status: 'success',
      progressMessage: 'Concluído',
      detectedItems: sanitized,
    });
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

      const uid = auth.currentUser?.uid;
      if (uid) {
        await firestoreService.saveScanRecord(uid, {
          id: makeScanId(),
          imageUrl: '',
          timestamp: new Date().toISOString(),
          status: 'error',
          progressMessage,
          detectedItems: [],
          errorMessage: err?.message || 'Falha ao processar imagem.',
        });
      }
    }
  };

  const handleOpenScan = (scan: ScanSession) => {
    // Reusa a imagem no preview
    if (scan.imageUrl) setSelectedImage(scan.imageUrl);

    // Se o scan foi bem-sucedido, carrega os itens direto na tela de revisão
    if (scan.status === 'success' && scan.detectedItems && scan.detectedItems.length > 0) {
      setDetectedItems(scan.detectedItems);
      setErrorMessage('');
      setScanStatus('success');
      return;
    }

    // Caso contrário, cai no reprocessar
    handleReprocess(scan);
  };

  const handleReprocess = async (scan: ScanSession) => {
    if (!scan.imageUrl) return;

    // mostra a mesma foto no preview
    setSelectedImage(scan.imageUrl);
    setScanStatus('idle');
    setDetectedItems([]);
    setErrorMessage('');

    // reprocessa usando a mesma imagem
    try {
      setScanStatus('scanning');
      setProgressMessage('Reprocessando scan...');
      await runScan(scan.imageUrl);
    } catch (err: any) {
      setScanStatus('error');
      setErrorMessage(err?.message || 'Falha ao reprocessar.');
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await firestoreService.deleteScanRecord(uid, scanId);
    await storageService.deleteScanImage(uid, scanId); // best-effort
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

  const formatScanDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getStatusStyle = (status: ScanSession['status']) => {
    switch (status) {
      case 'success':
        return {
          label: 'Sucesso',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'error':
        return {
          label: 'Erro',
          icon: <XCircle className="w-3.5 h-3.5" />,
          className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'processing':
      default:
        return {
          label: 'Processando',
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-10 text-emerald-100 text-left">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 mb-1.5 backdrop-blur-md">

            <Scan className="w-3.5 h-3.5" />

            <span>
              Visão Computacional de Alimentos
            </span>

          </div>

          <div className="text-xs font-bold text-rose-300">
            DEBUG SCANNER VERSION: 2026-08-29
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Escanear Geladeira
          </h1>

          <p className="text-xs sm:text-sm text-emerald-300/70">
            Identifique ingredientes automaticamente a partir de fotografias.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-[#081e13] px-3.5 py-2 rounded-2xl border border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">

          <Sparkles className="w-4 h-4 text-emerald-400" />

          <span>
            Custo: 1 crédito por análise
          </span>

        </div>

      </div>

      {/* UPLOAD */}

      {scanStatus !== 'success' && (
        <Card
          variant="default"
          padding="none"
          className="overflow-hidden"
        >

          {!selectedImage ? (

            <div className="p-6 sm:p-10 text-center space-y-6">

              <div
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-8 sm:p-12 cursor-pointer bg-[#081d12]/70 hover:bg-[#0c2a1b]/90 transition-all flex flex-col items-center justify-center group shadow-[0_0_30px_rgba(0,0,0,0.4)]"
              >

                <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-stone-950 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(16,185,129,0.5)]">

                  <Camera className="w-9 h-9" />

                </div>

                <h3 className="text-base sm:text-xl font-extrabold text-white">
                  Tirar foto ou selecionar arquivo
                </h3>

                <p className="text-xs sm:text-sm text-emerald-300/70 mt-1 max-w-sm">
                  Formatos aceitos: JPG, PNG ou tire uma foto direta da sua câmera.
                </p>

                <div className="mt-5 flex items-center gap-2">

                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={
                      <Upload className="w-4 h-4 text-stone-950" />
                    }
                  >
                    Escolher Imagem
                  </Button>

                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />

              </div>

              <div className="space-y-3 pt-2 text-center">

                <div className="flex items-center gap-2 justify-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider">

                  <ImageIcon className="w-3.5 h-3.5" />

                  <span>
                    Ou use uma foto de exemplo para teste
                  </span>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">

                  {sampleImages.map(
                    (sample) => (
                      <div
                        key={sample.id}
                        onClick={() =>
                          handleSelectSample(
                            sample.url
                          )
                        }
                        className="p-3 rounded-2xl border border-emerald-500/20 hover:border-emerald-400 bg-[#081e13]/80 hover:bg-[#0c2a1b] transition-all cursor-pointer flex items-center gap-3 text-left group"
                      >

                        <img
                          src={sample.url}
                          alt={sample.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-emerald-500/30"
                        />

                        <div className="flex-1 min-w-0">

                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 line-clamp-1">
                            {sample.name}
                          </h4>

                          <p className="text-[11px] text-emerald-300/60 line-clamp-2 mt-0.5">
                            {sample.description}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

          ) : (

            <div>

              <div className="relative aspect-16/10 sm:aspect-21/9 w-full bg-[#05130b] overflow-hidden">

                <img
                  src={selectedImage}
                  alt="Geladeira para análise"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {scanStatus === 'scanning' && (

                  <div className="absolute inset-0 bg-[#05130b]/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">

                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_#34d399] animate-bounce" />

                    <div className="relative w-16 h-16 rounded-full border-4 border-emerald-400/30 flex items-center justify-center mb-4">

                      <div className="w-10 h-10 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />

                    </div>

                    <h4 className="text-lg font-bold text-white">
                      Analisando alimentos...
                    </h4>

                    <p className="text-xs text-emerald-300 mt-1 max-w-sm animate-pulse">
                      {progressMessage ||
                        'Identificando alimentos...'}
                    </p>

                  </div>

                )}

                {scanStatus !== 'scanning' && (

                  <button
                    onClick={handleResetScanner}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md transition-colors"
                    title="Remover imagem"
                  >

                    <X className="w-4 h-4" />

                  </button>

                )}

              </div>

              {scanStatus !== 'scanning' && (

                <div className="p-4 sm:p-6 bg-[#081e13] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-emerald-500/20">

                  <div className="text-xs text-emerald-300/70 text-center sm:text-left">

                    <span className="font-bold text-white block">
                      Imagem pronta para reconhecimento
                    </span>

                    A IA identificará apenas alimentos. Você confirmará as quantidades.

                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">

                    <Button
                      variant="outline"
                      onClick={handleResetScanner}
                      className="flex-1 sm:flex-none text-xs"
                      leftIcon={
                        <RotateCcw className="w-3.5 h-3.5" />
                      }
                    >
                      Trocar Foto
                    </Button>

                    <Button
                      variant="primary"
                      onClick={handleStartScan}
                      className="flex-1 sm:flex-none font-bold"
                      leftIcon={
                        <Sparkles className="w-4 h-4 text-stone-950" />
                      }
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
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-3xl border border-amber-500/30 bg-[#1f1508]/85 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <div className="w-14 h-14 rounded-2xl bg-amber-950 text-amber-400 flex items-center justify-center mb-3.5 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Clock className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${retryIn ? 'animate-spin' : ''}`} />
                {retryIn ? `Aguardando cooldown (${retryIn}s)` : 'Alta Demanda do Modelo de IA'}
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mb-1.5">
                Servidor temporariamente ocupado
              </h4>
              <p className="text-xs sm:text-sm text-amber-200/80 max-w-md mb-5 leading-relaxed">
                O modelo de IA recebeu muitas requisições simultâneas. <strong>Sua foto continua preservada</strong> para que você possa tentar novamente sem precisar tirar outra.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={handleStartScan}
                  disabled={retryIn !== null && retryIn > 0}
                  variant="primary"
                  size="md"
                  leftIcon={<RefreshCw className={`w-4 h-4 text-stone-950 ${retryIn ? 'animate-spin' : ''}`} />}
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

        <div className="space-y-6">

          <div className="p-4 sm:p-5 rounded-3xl bg-[#0a2618] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">

                <CheckCircle2 className="w-6 h-6" />

              </div>

              <div>

                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {detectedItems.length} {detectedItems.length === 1 ? 'Alimento Identificado' : 'Alimentos Identificados'} com Sucesso!
                </h3>

                <p className="text-xs text-emerald-300/80">
                  Revise a lista abaixo e selecione quais deseja sincronizar com o estoque.
                </p>

              </div>

            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetScanner}
              leftIcon={
                <RotateCcw className="w-3.5 h-3.5" />
              }
              className="text-xs"
            >
              Nova Análise
            </Button>

          </div>

          <Card
            variant="default"
            padding="none"
            className="overflow-hidden"
          >

            {/* CABEÇALHO */}

            <div className="p-3.5 sm:p-4 border-b border-emerald-500/15 flex items-center justify-between bg-emerald-950/40">

              <button
                onClick={() =>
                  handleSelectAll(
                    !allSelected
                  )
                }
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white cursor-pointer"
              >

                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-emerald-700" />
                )}

                <span>
                  Selecionar todos
                </span>

              </button>

              <span className="text-xs text-emerald-300/70 font-medium">
                {selectedCount} de {detectedItems.length} selecionados
              </span>

            </div>

            {/* LISTA */}

            <div className="divide-y divide-emerald-500/10">

              {detectedItems.map(
                (item) => {

                  const isFrozen =
                    item.state ===
                    'frozen';

                  const isInt = isIntegerUnit(item.unit);
                  const delta = getDelta(item.unit);
                  const minQty = getMinQty(item.unit);

                  return (

                    <div
                      key={item.id}
                      onClick={() =>
                        handleToggleItem(
                          item.id
                        )
                      }
                      className={`p-4 sm:p-5 transition-all cursor-pointer rounded-2xl border ${
                        item.selected
                          ? 'bg-[#0b281b]/95 border-emerald-500/40 shadow-sm'
                          : 'bg-[#081e13]/60 border-emerald-900/40 opacity-75'
                      }`}
                    >

                      <div className="flex items-start gap-3">

                        {/* CHECKBOX */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItem(
                              item.id
                            );
                          }}
                          className="mt-1 shrink-0 cursor-pointer text-emerald-400 hover:text-emerald-300 transition-colors"
                          aria-label={
                            item.selected
                              ? 'Desmarcar alimento'
                              : 'Selecionar alimento'
                          }
                        >
                          {item.selected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-emerald-800" />
                          )}
                        </button>

                        {/* ÍCONE DA CATEGORIA */}
                        <div className="mt-0.5 w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          {getCategoryIcon(
                            item.category
                          )}
                        </div>

                        {/* BLOCO DO ITEM COM NOME, CATEGORIA, PRECISÃO E CONTROLE DE QUANTIDADE */}
                        <div className="min-w-0 flex-1">
                          {/* LINHA 1: Nome à esquerda + Controles de quantidade (- input +) à direita */}
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm sm:text-base font-bold text-white truncate">
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
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-emerald-500/30 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm transition-colors"
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
                                className="w-12 sm:w-14 h-7 sm:h-8 rounded-lg border border-emerald-500/30 bg-[#05130b] text-white text-center text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                aria-label={`Quantidade de ${item.name}`}
                              />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.id, delta);
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-emerald-500/30 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
                                aria-label={`Aumentar quantidade de ${item.name}`}
                              >
                                +
                              </button>

                              <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-400/80 ml-0.5 min-w-[20px] text-center">
                                {item.unit}
                              </span>
                            </div>
                          </div>

                          {/* LINHA 2: Categoria + Confiança + Botão Editar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300/70 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{getCategoryLabel(item.category)}</span>
                              <span className="text-emerald-600">•</span>

                              <span className="text-[11px] text-emerald-400 font-semibold">
                                {(item.confidence * 100).toFixed(0)}% de precisão
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900 px-2 py-0.5 rounded-md border border-emerald-500/30 transition-colors shadow-sm"
                              aria-label={`Editar ${item.name}`}
                            >
                              <Pencil className="w-3 h-3 text-emerald-400" />
                              Editar
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

            {/* RODAPÉ */}

            <div className="p-4 bg-emerald-950/50 border-t border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-3">

              <div className="text-xs text-emerald-300/70 text-center sm:text-left">

                Os itens adicionados atualizarão instantaneamente o cálculo das receitas compatíveis.

              </div>

              <Button
                variant="primary"
                size="md"
                onClick={
                  handleSaveToInventory
                }
                isLoading={isSaving}
                disabled={
                  selectedCount === 0
                }
                leftIcon={
                  <Plus className="w-4 h-4 text-stone-950" />
                }
                className="w-full sm:w-auto font-bold"
              >

                Adicionar {selectedCount}{' '}
                {selectedCount === 1
                  ? 'Item'
                  : 'Itens'}{' '}
                à Geladeira

              </Button>

            </div>

          </Card>

        </div>

      )}

      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <History className="w-4 h-4 text-white/80" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Histórico de scans</h3>
              <p className="text-xs text-white/50">Últimos 10 scans do seu usuário</p>
            </div>
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-10 text-white/60 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando histórico...</span>
          </div>
        ) : scanHistory.length === 0 ? (
          <EmptyState
            title="Nenhum scan ainda"
            message="Quando você fizer um scan, ele aparecerá aqui e poderá ser reaberto ou reprocessado."
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {scanHistory.map((scan) => {
              const status = getStatusStyle(scan.status);
              const canOpen = scan.status === 'success' && (scan.detectedItems?.length ?? 0) > 0;
              const canReprocess = !!scan.imageUrl;

              return (
                <li
                  key={scan.id}
                  className="py-3 flex items-center gap-3"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                    {scan.imageUrl ? (
                      <img
                        src={scan.imageUrl}
                        alt="Scan"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageOff className="w-5 h-5 text-white/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${status.className}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                      <span className="text-xs text-white/50 truncate">
                        {formatScanDate(scan.timestamp)}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-white/80 truncate">
                      {scan.status === 'success'
                        ? `${scan.detectedItems?.length ?? 0} item(ns) identificado(s)`
                        : scan.status === 'error'
                        ? scan.errorMessage || 'Falha no scan'
                        : scan.progressMessage || 'Processando...'}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenScan(scan)}
                      disabled={!canOpen && !canReprocess}
                      leftIcon={<FolderOpen className="w-3.5 h-3.5" />}
                    >
                      Abrir
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReprocess(scan)}
                      disabled={!canReprocess}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reprocessar
                    </Button>

                    <button
                      onClick={() => handleDeleteScan(scan.id)}
                      className="p-2 rounded-lg text-white/60 hover:text-rose-300 hover:bg-white/5 transition"
                      title="Excluir scan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* MODO DEMONSTRAÇÃO */}

      <div className="p-3.5 rounded-2xl bg-[#081e13]/70 border border-emerald-500/20 text-xs text-emerald-300/70 flex items-center justify-between">

        <span className="flex items-center gap-1.5 font-medium">

          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />

          Modo Demonstração: Simular falha de captura de foto

        </span>

        <label className="relative inline-flex items-center cursor-pointer">

          <input
            type="checkbox"
            checked={
              simulatedErrorToggle
            }
            onChange={(e) =>
              setSimulatedErrorToggle(
                e.target.checked
              )
            }
            className="sr-only peer"
          />

          <div className="w-9 h-5 bg-emerald-950 border border-emerald-500/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />

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
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
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
                <label className="block text-xs font-semibold text-emerald-200/90">
                  Categoria *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CategoryType)}
                  className="w-full rounded-2xl border border-emerald-500/25 bg-[#081d12]/90 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md"
                >
                  <option value="vegetables" className="bg-stone-900">Legumes & Verduras</option>
                  <option value="fruits" className="bg-stone-900">Frutas</option>
                  <option value="dairy" className="bg-stone-900">Laticínios</option>
                  <option value="proteins" className="bg-stone-900">Proteínas & Ovos</option>
                  <option value="drinks" className="bg-stone-900">Bebidas</option>
                  <option value="pantry" className="bg-stone-900">Despensa & Grãos</option>
                  <option value="condiments" className="bg-stone-900">Temperos & Molhos</option>
                  <option value="bakery" className="bg-stone-900">Pães & Massas</option>
                  <option value="other" className="bg-stone-900">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-emerald-200/90">
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
                    className="w-full rounded-2xl border border-emerald-500/25 bg-[#081d12]/90 px-3 py-2.5 text-sm text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-emerald-200/90">
                    Unidade *
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as FoodItem['unit'])}
                    className="w-full rounded-2xl border border-emerald-500/25 bg-[#081d12]/90 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md"
                  >
                    <option value="un" className="bg-stone-900">un</option>
                    <option value="kg" className="bg-stone-900">kg</option>
                    <option value="g" className="bg-stone-900">g</option>
                    <option value="L" className="bg-stone-900">L</option>
                    <option value="ml" className="bg-stone-900">ml</option>
                    <option value="pct" className="bg-stone-900">pct</option>
                    <option value="fatias" className="bg-stone-900">fatias</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-emerald-200/90">
                  Local de Armazenamento
                </label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value as StorageLocation)}
                  className="w-full rounded-2xl border border-emerald-500/25 bg-[#081d12]/90 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md"
                >
                  <option value="geladeira" className="bg-stone-900">Geladeira (Principal)</option>
                  <option value="freezer" className="bg-stone-900">Freezer / Congelador</option>
                  <option value="gaveta_legumes" className="bg-stone-900">Gaveta de Legumes</option>
                  <option value="porta" className="bg-stone-900">Porta da Geladeira</option>
                  <option value="despensa" className="bg-stone-900">Despensa</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-emerald-200/90">
                  Estado
                </label>
                <select
                  value={editState}
                  onChange={(e) => setEditState(e.target.value as FreshnessState)}
                  className="w-full rounded-2xl border border-emerald-500/25 bg-[#081d12]/90 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md"
                >
                  <option value="fresh" className="bg-stone-900">Fresco / Refrigerado</option>
                  <option value="frozen" className="bg-stone-900">Congelado</option>
                </select>
              </div>
            </div>

            <Input
              type="date"
              label="Data de Validade (opcional)"
              value={editExpiryDate}
              onChange={(e) => setEditExpiryDate(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
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
                leftIcon={<Save className="w-4 h-4 text-stone-950" />}
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
