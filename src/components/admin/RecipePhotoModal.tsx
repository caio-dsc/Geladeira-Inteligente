import React, { useState, useRef, useEffect } from 'react';
import { Recipe } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { storageService } from '../../services/storageService';
import { firestoreService } from '../../services/firestoreService';
import { 
  Upload, 
  Image as ImageIcon, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  Camera,
  RotateCcw
} from 'lucide-react';

export interface RecipePhotoModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (recipeId: string, newImageUrl: string) => void;
}

export const RecipePhotoModal: React.FC<RecipePhotoModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Limpa estados ao fechar ou trocar de receita
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setErrorMessage(null);
      setIsUploading(false);
      setUploadStep('');
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!recipe) return null;

  const currentPlaceholder =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#052014"/>
            <stop offset="1" stop-color="#0b2b1b"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#7ef0b5" font-family="Arial" font-size="28" font-weight="700">
          Sem foto
        </text>
      </svg>
    `);

  const currentImgSrc = recipe.imageUrl?.trim() ? recipe.imageUrl : currentPlaceholder;

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Formato não suportado. Por favor, envie uma imagem JPEG, PNG ou WebP.');
      return;
    }

    // Limite razoável de 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('A imagem é muito grande. O tamanho máximo permitido é de 10 MB.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDiscardSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile || !recipe) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      // 1. Upload seguro para o Firebase Cloud Storage
      setUploadStep('Enviando imagem para o Firebase Storage...');
      const downloadUrl = await storageService.uploadRecipeImage(recipe.id, selectedFile);

      // 2. Atualização atômica no Cloud Firestore com merge
      setUploadStep('Gravando referência no Firestore...');
      await firestoreService.updateRecipeImage(recipe.id, downloadUrl);

      // 3. Notificação do sucesso
      setUploadStep('Foto atualizada com sucesso!');
      onSuccess(recipe.id, downloadUrl);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar foto da receita:', err);
      setErrorMessage(
        err?.message || 'Falha ao salvar a nova foto. Verifique a conexão e as permissões de administrador.'
      );
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleRemovePhoto = async () => {
    if (!recipe || !recipe.imageUrl) return;
    const confirm = window.confirm(`Deseja remover a foto personalizada da receita "${recipe.title}"?`);
    if (!confirm) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadStep('Removendo foto no Firestore...');

      await firestoreService.updateRecipeImage(recipe.id, '');
      onSuccess(recipe.id, '');
      onClose();
    } catch (err: any) {
      console.error('Erro ao remover foto da receita:', err);
      setErrorMessage(err?.message || 'Falha ao remover a foto.');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isUploading ? () => {} : onClose}
      title="Gerenciar Foto da Receita"
      subtitle={recipe.title}
      maxWidth="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            {recipe.imageUrl?.trim() && !previewUrl && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Remover Foto
              </Button>
            )}
            {previewUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscardSelection}
                disabled={isUploading}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Descartar Seleção
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePhoto}
              disabled={!selectedFile || isUploading}
              isLoading={isUploading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isUploading ? 'Salvando...' : 'Salvar Nova Foto'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-left">
        {/* Mensagem de Erro se houver */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mensagem de progresso do upload */}
        {isUploading && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-pulse">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{uploadStep}</span>
          </div>
        )}

        {/* Comparativo: Foto Atual vs. Nova Seleção */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Foto Atual */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300/80">Foto Atual do Prato</span>
              {recipe.imageUrl?.trim() ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Definida
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                  Sem Foto
                </span>
              )}
            </div>
            <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-[#07190f] border border-emerald-500/20">
              <img
                src={currentImgSrc}
                alt={recipe.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = currentPlaceholder;
                }}
              />
            </div>
          </div>

          {/* Nova Foto Selecionada */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300/80">Nova Foto (Pré-visualização)</span>
              {previewUrl && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/40">
                  Pronta para envio
                </span>
              )}
            </div>
            <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-[#07190f] border border-dashed border-emerald-500/30 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pré-visualização da nova foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-emerald-300/50">
                  <ImageIcon className="w-8 h-8 mb-1.5 opacity-40" />
                  <span className="text-xs">Nenhuma foto selecionada ainda</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zona de Drop & Seleção de Arquivo */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
              : 'border-emerald-500/25 bg-[#05130b]/60 hover:border-emerald-500/50 hover:bg-[#07190f]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {selectedFile ? 'Trocar arquivo selecionado' : 'Clique para escolher ou arraste uma foto'}
            </p>
            <p className="text-xs text-emerald-300/60 mt-0.5">
              Formatos aceitos: JPG, PNG ou WebP (máx. 10 MB)
            </p>
          </div>

          {selectedFile && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-xs">{selectedFile.name}</span>
              <span className="text-emerald-400/60">
                ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
