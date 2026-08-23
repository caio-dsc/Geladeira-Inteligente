import React, { useState, useRef } from 'react';
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
  X,
  Scan,
  AlertCircle
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FoodItem, DetectedFoodItem } from '../../types';
import { foodService } from '../../services/foodService';
import { scannerService } from '../../services/scannerService';
import { getCategoryIcon, getCategoryLabel, getFreshnessBadge } from '../food/FoodCard';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [detectedItems, setDetectedItems] = useState<DetectedFoodItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [simulatedErrorToggle, setSimulatedErrorToggle] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleImages = scannerService.getSampleImages();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleSelectSample = (url: string) => {
    setSelectedImage(url);
    setScanStatus('idle');
    setDetectedItems([]);
    setErrorMessage('');
  };

  const handleStartScan = async () => {
    if (!selectedImage) return;

    if (userCredits <= 0) {
      onOpenCreditsModal();
      return;
    }

    const deducted = await onDeductCredit(1);
    if (!deducted) {
      onOpenCreditsModal();
      return;
    }

    try {
      setScanStatus('scanning');
      setErrorMessage('');

      const results = await scannerService.simulateScan(
        selectedImage,
        (stage) => {
          setProgressMessage(stage);
        },
        simulatedErrorToggle
      );

      setDetectedItems(
        results.map((item) => ({
          ...item,
          selected: true,
        }))
      );
      setScanStatus('success');
    } catch (err: any) {
      setScanStatus('error');
      setErrorMessage(err?.message || 'Falha ao processar imagem.');
    }
  };

  const handleToggleItem = (id: string) => {
    setDetectedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelectAll = (select: boolean) => {
    setDetectedItems((prev) =>
      prev.map((item) => ({ ...item, selected: select }))
    );
  };

  const handleSaveToInventory = async () => {
    const selected = detectedItems.filter((i) => i.selected);
    if (selected.length === 0) return;

    try {
      setIsSaving(true);
      const itemsToAdd: Array<Omit<FoodItem, 'id' | 'addedAt'>> = selected.map((d) => ({
        name: d.name,
        category: d.category,
        quantity: d.quantity,
        unit: d.unit,
        state: d.state,
        location: d.location,
        notes: `Detectado via Scanner (${(d.confidence * 100).toFixed(0)}% de precisão)`,
      }));

      await foodService.addMultipleItems(itemsToAdd);
      onItemsAdded(selected.length);
      onNavigateToInventory();
    } catch (e: any) {
      alert('Erro ao salvar alimentos: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetScanner = () => {
    setSelectedImage(null);
    setScanStatus('idle');
    setDetectedItems([]);
    setErrorMessage('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-10 text-emerald-100 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 mb-1.5 backdrop-blur-md">
            <Scan className="w-3.5 h-3.5" />
            <span>Visão Computacional de Alimentos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Escanear Geladeira
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/70">
            Identifique ingredientes automaticamente a partir de fotografias.
          </p>
        </div>

        {/* Custo de créditos */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-[#081e13] px-3.5 py-2 rounded-2xl border border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Custo: 1 crédito por análise</span>
        </div>
      </div>

      {/* Main Upload / Scanner Box */}
      {scanStatus !== 'success' && (
        <Card variant="default" padding="none" className="overflow-hidden">
          {!selectedImage ? (
            <div className="p-6 sm:p-10 text-center space-y-6">
              {/* Drag & Drop / Click to Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
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
                  <Button variant="primary" size="md" leftIcon={<Upload className="w-4 h-4 text-stone-950" />}>
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

              {/* Sample images for rapid testing */}
              <div className="space-y-3 pt-2 text-center">
                <div className="flex items-center gap-2 justify-center text-xs font-bold text-emerald-400/80 uppercase tracking-wider">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Ou use uma foto de exemplo para teste</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {sampleImages.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => handleSelectSample(sample.url)}
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
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Image Preview & Controls */}
              <div className="relative aspect-16/10 sm:aspect-21/9 w-full bg-[#05130b] overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Geladeira para análise"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {/* Overlay Scanning Animation */}
                {scanStatus === 'scanning' && (
                  <div className="absolute inset-0 bg-[#05130b]/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
                    {/* Laser Scanner Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_#34d399] animate-bounce" />

                    <div className="relative w-16 h-16 rounded-full border-4 border-emerald-400/30 flex items-center justify-center mb-4">
                      <div className="w-10 h-10 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                    </div>

                    <h4 className="text-lg font-bold text-white">Analisando compartimentos...</h4>
                    <p className="text-xs text-emerald-300 mt-1 max-w-sm animate-pulse">
                      {progressMessage || 'Identificando alimentos e quantidades...'}
                    </p>
                  </div>
                )}

                {/* Close/Remove Image Button */}
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

              {/* Bottom Action Bar */}
              {scanStatus !== 'scanning' && (
                <div className="p-4 sm:p-6 bg-[#081e13] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-emerald-500/20">
                  <div className="text-xs text-emerald-300/70 text-center sm:text-left">
                    <span className="font-bold text-white block">Imagem pronta para reconhecimento</span>
                    A análise identificará laticínios, verduras, carnes e validade aproximada.
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
                      leftIcon={<Sparkles className="w-4 h-4 text-stone-950" />}
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

      {/* Error State */}
      {scanStatus === 'error' && (
        <ErrorState
          title="Falha na análise da imagem"
          message={errorMessage}
          retryLabel="Tentar novamente"
          onRetry={handleStartScan}
        />
      )}

      {/* Success State: Detected Items List */}
      {scanStatus === 'success' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0a2618] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {detectedItems.length} Alimentos Identificados com Sucesso!
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
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Nova Análise
            </Button>
          </div>

          {/* Table / List of items */}
          <Card variant="default" padding="none" className="overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-emerald-500/15 flex items-center justify-between bg-emerald-950/40">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAll(!detectedItems.every((i) => i.selected))}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white cursor-pointer"
                >
                  {detectedItems.every((i) => i.selected) ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>Selecionar todos</span>
                </button>
              </div>

              <span className="text-xs text-emerald-300/70 font-medium">
                {detectedItems.filter((i) => i.selected).length} de {detectedItems.length} selecionados
              </span>
            </div>

            <div className="divide-y divide-emerald-500/10">
              {detectedItems.map((item) => {
                const freshness = getFreshnessBadge(item.state);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      item.selected ? 'bg-[#0b281b]/80' : 'bg-[#081e13]/60 hover:bg-[#0b281b]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 text-emerald-400">
                        {item.selected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-emerald-800" />
                        )}
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-300/70 mt-0.5">
                          <span>{getCategoryLabel(item.category)}</span>
                          <span>•</span>
                          <span>{item.quantity} {item.unit}</span>
                          <span>•</span>
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            {(item.confidence * 100).toFixed(0)}% de precisão
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${freshness.classes}`}>
                      {freshness.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer action */}
            <div className="p-4 bg-emerald-950/50 border-t border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-emerald-300/60">
                Os itens adicionados atualizarão instantaneamente o cálculo das receitas compatíveis.
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleSaveToInventory}
                isLoading={isSaving}
                disabled={detectedItems.filter((i) => i.selected).length === 0}
                leftIcon={<Plus className="w-4 h-4 text-stone-950" />}
                className="w-full sm:w-auto font-bold"
              >
                Adicionar {detectedItems.filter((i) => i.selected).length} Itens à Geladeira
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Developer testing toggle */}
      <div className="p-3.5 rounded-2xl bg-[#081e13]/70 border border-emerald-500/20 text-xs text-emerald-300/70 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Modo Demonstração: Simular falha de captura de foto
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={simulatedErrorToggle}
            onChange={(e) => setSimulatedErrorToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-emerald-950 border border-emerald-500/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
        </label>
      </div>
    </div>
  );
};
