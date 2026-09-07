import React, { useState, useRef } from 'react';
import { User, NavigationTab, CANONICAL_DIETARY_RESTRICTIONS } from '../../types';
import { authService } from '../../services/authService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CreditBadge } from '../common/CreditBadge';
import { 
  User as UserIcon, 
  Mail, 
  Sparkles, 
  LogOut, 
  ChefHat, 
  Plus, 
  Check,
  Database,
  Camera,
  Edit3,
  Calendar,
  Scale,
  Ruler,
  ShieldCheck,
  HelpCircle,
  X
} from 'lucide-react';

const fileToResizedJpegDataUrl = async (file: File, maxSize = 256, quality = 0.8): Promise<string> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
      i.src = objectUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas não suportado.');

    ctx.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const withTimeout = async <T,>(p: Promise<T>, ms: number, msg: string): Promise<T> => {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
};

export interface ProfileViewProps {
  user: User;
  onSignOut: () => void;
  onUpdateUser: (user: User) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenQuickGuide?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onSignOut,
  onUpdateUser,
  onNavigateTab,
  onOpenQuickGuide,
}) => {
  // Profile info editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState<string>(user.age !== undefined && user.age !== null ? String(user.age) : '');
  const [weightKg, setWeightKg] = useState<string>(user.weightKg !== undefined && user.weightKg !== null ? String(user.weightKg) : '');
  const [heightCm, setHeightCm] = useState<string>(user.heightCm !== undefined && user.heightCm !== null ? String(user.heightCm) : '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences editing state
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [cookingLevel, setCookingLevel] = useState(user.preferences.cookingLevel);
  const [servings, setServings] = useState(user.preferences.defaultServings);
  const [restrictions, setRestrictions] = useState<string[]>(user.preferences.dietaryRestrictions || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const availableRestrictions = CANONICAL_DIETARY_RESTRICTIONS;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfileError('Por favor selecione um arquivo de imagem válido.');
        return;
      }
      setProfileError(null);
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    if (!name.trim()) {
      setProfileError('O nome não pode ficar vazio.');
      return;
    }

    try {
      setIsSavingProfile(true);
      let newAvatarUrl = user.avatarUrl;

      // Se houver novo arquivo selecionado, gera uma imagem pequena para não estourar o doc do Firestore
      if (avatarFile) {
        newAvatarUrl = await withTimeout(
          fileToResizedJpegDataUrl(avatarFile, 256, 0.8),
          8000,
          'A foto demorou demais para processar. Tente uma imagem menor.'
        );
      }

      const parsedAge = age.trim() !== '' ? Math.max(0, parseInt(age, 10)) : null;
      const parsedWeight = weightKg.trim() !== '' ? Math.max(0, parseFloat(weightKg.replace(',', '.'))) : null;
      const parsedHeight = heightCm.trim() !== '' ? Math.max(0, parseInt(heightCm, 10)) : null;

      if (heightCm.trim() !== '') {
        const hVal = Number(heightCm);
        if (isNaN(hVal) || hVal < 30 || hVal > 280) {
          setProfileError('Por favor informe uma altura válida entre 30 cm e 280 cm.');
          return;
        }
      }

      const updated = await withTimeout(
        authService.updateUser({
          name: name.trim(),
          avatarUrl: newAvatarUrl,
          age: parsedAge,
          weightKg: parsedWeight,
          heightCm: parsedHeight,
        }),
        8000,
        'Salvar perfil demorou demais. Verifique sua conexão e tente novamente.'
      );

      onUpdateUser(updated);
      setIsEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setProfileMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setProfileMessage(null), 3500);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setProfileError(err?.message || 'Falha ao salvar alterações de perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setName(user.name);
    setAge(user.age !== undefined && user.age !== null ? String(user.age) : '');
    setWeightKg(user.weightKg !== undefined && user.weightKg !== null ? String(user.weightKg) : '');
    setHeightCm(user.heightCm !== undefined && user.heightCm !== null ? String(user.heightCm) : '');
    setAvatarFile(null);
    setAvatarPreview(null);
    setProfileError(null);
    setIsEditingProfile(false);
  };

  const handleToggleRestriction = (item: string) => {
    if (restrictions.includes(item)) {
      setRestrictions(restrictions.filter((r) => r !== item));
    } else {
      setRestrictions([...restrictions, item]);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      const updated = await authService.updateUser({
        preferences: {
          ...user.preferences,
          cookingLevel,
          defaultServings: Number(servings),
          dietaryRestrictions: restrictions,
        },
      });
      onUpdateUser(updated);
      setIsEditingPreferences(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert('Erro ao salvar preferências: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDemoCredits = async (amount: number) => {
    try {
      await authService.addCredits(amount);
      const updated = await authService.getCurrentUser();
      if (updated) onUpdateUser(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24 md:pb-10 text-text-primary text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-1.5 shadow-subtle">
          <UserIcon className="w-3.5 h-3.5 text-primary" />
          <span>Configurações da Conta</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
          Perfil & Preferências
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Gerencie seus dados pessoais, créditos e preferências gastronômicas.
        </p>
      </div>

      {profileMessage && (
        <div className="p-3.5 bg-primary/10 border border-primary/30 rounded-2xl text-xs text-primary font-bold flex items-center gap-2 shadow-subtle animate-in fade-in">
          <Check className="w-4 h-4 text-primary shrink-0" />
          <span>{profileMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-primary/10 border border-primary/30 rounded-2xl text-xs text-primary font-bold flex items-center gap-2 shadow-subtle animate-in fade-in">
          <Check className="w-4 h-4 text-primary shrink-0" />
          <span>Preferências atualizadas com sucesso!</span>
        </div>
      )}

      {/* User Info Card */}
      <Card variant="default" padding="md" className="space-y-5 shadow-subtle border-border">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />

        {!isEditingProfile ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative group">
              <img
                src={avatarPreview || user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-3xl object-cover ring-2 ring-primary/40 shadow-soft"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shadow-subtle">
                ✓
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-lg font-bold text-text-primary">{user.name}</h3>
              </div>
              <p className="text-xs text-text-secondary flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {user.email}
              </p>
              
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {user.age !== undefined && user.age !== null && (
                  <span className="text-[11px] font-bold bg-surface-muted text-text-primary px-2.5 py-0.5 rounded-lg border border-border flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    {user.age} anos
                  </span>
                )}
                {user.weightKg !== undefined && user.weightKg !== null && (
                  <span className="text-[11px] font-bold bg-surface-muted text-text-primary px-2.5 py-0.5 rounded-lg border border-border flex items-center gap-1">
                    <Scale className="w-3 h-3 text-primary" />
                    {user.weightKg} kg
                  </span>
                )}
                {user.heightCm !== undefined && user.heightCm !== null && (
                  <span className="text-[11px] font-bold bg-surface-muted text-text-primary px-2.5 py-0.5 rounded-lg border border-border flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-primary" />
                    {user.heightCm} cm
                  </span>
                )}
                <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg border border-primary/25">
                  Nível {user.preferences.cookingLevel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 items-center sm:items-end w-full sm:w-auto justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setName(user.name);
                  setAge(user.age !== undefined && user.age !== null ? String(user.age) : '');
                  setWeightKg(user.weightKg !== undefined && user.weightKg !== null ? String(user.weightKg) : '');
                  setHeightCm(user.heightCm !== undefined && user.heightCm !== null ? String(user.heightCm) : '');
                  setIsEditingProfile(true);
                }}
                leftIcon={<Edit3 className="w-3.5 h-3.5 text-primary" />}
                className="text-xs font-bold"
              >
                Editar perfil
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={onSignOut}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                className="text-xs font-bold"
              >
                Sair da Conta
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                Editar Dados do Perfil
              </h3>
              <button
                type="button"
                onClick={handleCancelProfileEdit}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img
                    src={avatarPreview || user.avatarUrl}
                    alt={name || user.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-3xl object-cover ring-2 ring-primary/40 shadow-soft"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-subtle hover:bg-primary-dark transition cursor-pointer"
                    title="Trocar foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Camera className="w-3.5 h-3.5" />}
                  className="text-[11px] py-1 px-2.5"
                >
                  Trocar foto
                </Button>
              </div>

              <div className="flex-1 w-full space-y-3">
                <Input
                  label="Nome"
                  placeholder="Seu nome completo ou de chef"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Idade (anos)"
                    type="number"
                    placeholder="Ex: 32"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={1}
                    max={120}
                  />

                  <Input
                    label="Peso (kg)"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 72.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    min={1}
                    max={300}
                  />

                  <Input
                    label="Altura (cm)"
                    type="number"
                    placeholder="Ex: 170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    min={30}
                    max={280}
                  />
                </div>
              </div>
            </div>

            {profileError && (
              <div className="text-xs font-semibold text-rose-700 bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3">
                {profileError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelProfileEdit}
                disabled={isSavingProfile}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSavingProfile}
                className="text-xs font-bold"
              >
                Salvar Perfil
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Credits Card */}
      <Card variant="default" padding="md" className="space-y-4 shadow-subtle border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Saldo de Créditos</h3>
              <p className="text-xs text-text-secondary">Utilizados para escaneamentos de geladeira</p>
            </div>
          </div>

          <CreditBadge credits={user.credits} size="md" />
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
          <span>Cada foto analisada consome 1 crédito do seu saldo.</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddDemoCredits(5)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              +5 Créditos
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAddDemoCredits(10)}
              leftIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
              className="text-xs font-bold"
            >
              +10 Créditos
            </Button>
          </div>
        </div>
      </Card>

      {/* Cooking & Dietary Preferences */}
      <Card variant="default" padding="md" className="space-y-4 shadow-subtle border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Preferências Culinárias</h3>
              <p className="text-xs text-text-secondary">Personalize recomendações e porções</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingPreferences(!isEditingPreferences)}
            className="text-xs font-bold text-primary"
          >
            {isEditingPreferences ? 'Cancelar' : 'Alterar'}
          </Button>
        </div>

        {isEditingPreferences ? (
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary">Nível na Cozinha</label>
                <select
                  value={cookingLevel}
                  onChange={(e) => setCookingLevel(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Iniciante">Iniciante (Receitas simples e rápidas)</option>
                  <option value="Intermediário">Intermediário (Receitas do dia a dia)</option>
                  <option value="Chef">Chef (Técnicas elaboradas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary">Porções Padrão</label>
                <select
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value={1}>1 pessoa</option>
                  <option value={2}>2 pessoas</option>
                  <option value={3}>3 a 4 pessoas</option>
                  <option value={5}>5+ pessoas (Família)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-primary">Restrições e Preferências</label>
              <div className="flex flex-wrap gap-2">
                {availableRestrictions.map((item) => {
                  const isChecked = restrictions.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleRestriction(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-primary text-white shadow-subtle'
                          : 'bg-surface-muted text-text-secondary hover:text-text-primary border border-border'
                      }`}
                    >
                      {isChecked ? `✓ ${item}` : `+ ${item}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePreferences}
                isLoading={isSaving}
                className="font-bold"
              >
                Salvar Preferências
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-border text-xs">
            <div className="flex items-center justify-between text-text-secondary">
              <span className="font-medium">Nível culinário:</span>
              <span className="font-bold text-text-primary">{user.preferences.cookingLevel}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span className="font-medium">Rendimento padrão:</span>
              <span className="font-bold text-text-primary">{user.preferences.defaultServings} porções</span>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-text-secondary block">Restrições ativas:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {user.preferences.dietaryRestrictions.length > 0 ? (
                  user.preferences.dietaryRestrictions.map((r) => (
                    <span key={r} className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-[11px]">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-text-secondary/60 italic">Nenhuma restrição cadastrada</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Guia Rápido - Acesso Direto */}
      {onOpenQuickGuide && (
        <Card className="flex items-center justify-between p-4 sm:p-5 border-border bg-surface shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Guia Rápido</h4>
              <p className="text-xs text-text-secondary">Veja em poucos passos como aproveitar melhor sua Geladeira Inteligente</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQuickGuide}
            className="text-xs font-bold"
          >
            Abrir Guia
          </Button>
        </Card>
      )}

      {/* Admin Panel Entry - apenas para administradores */}
      {user?.isAdmin && onNavigateTab && (
        <Card className="flex items-center justify-between p-5 border-border bg-surface shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Painel Administrativo</h4>
              <p className="text-xs text-text-secondary">Gerenciamento de receitas e base de dados</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('admin')}
            className="text-xs font-bold"
          >
            Abrir Painel
          </Button>
        </Card>
      )}
    </div>
  );
};
