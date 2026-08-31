import React, { useState, useRef } from 'react';
import { User, NavigationTab } from '../../types';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
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
  ShieldCheck,
  X
} from 'lucide-react';

export interface ProfileViewProps {
  user: User;
  onSignOut: () => void;
  onUpdateUser: (user: User) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onSignOut,
  onUpdateUser,
  onNavigateTab,
}) => {
  // Profile info editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState<string>(user.age !== undefined && user.age !== null ? String(user.age) : '');
  const [weightKg, setWeightKg] = useState<string>(user.weightKg !== undefined && user.weightKg !== null ? String(user.weightKg) : '');
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

  const availableRestrictions = [
    'Sem Frituras',
    'Vegetariano',
    'Sem Glúten',
    'Sem Lactose',
    'Low Carb',
    'Vegano',
    'Rico em Proteína',
  ];

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

      // Se houver novo arquivo selecionado, faz upload no Cloud Storage (users/{uid}/avatar.jpg)
      if (avatarFile) {
        newAvatarUrl = await storageService.uploadAvatarImage(user.id, avatarFile);
      }

      const parsedAge = age.trim() !== '' ? Math.max(0, parseInt(age, 10)) : null;
      const parsedWeight = weightKg.trim() !== '' ? Math.max(0, parseFloat(weightKg.replace(',', '.'))) : null;

      const updated = await authService.updateUser({
        name: name.trim(),
        avatarUrl: newAvatarUrl,
        age: parsedAge,
        weightKg: parsedWeight,
      });

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
    <div className="space-y-6 max-w-3xl mx-auto pb-24 md:pb-10 text-emerald-100 text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 mb-1.5 backdrop-blur-md">
          <UserIcon className="w-3.5 h-3.5" />
          <span>Configurações da Conta</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Perfil & Preferências
        </h1>
        <p className="text-xs sm:text-sm text-emerald-300/70">
          Gerencie seus dados pessoais, créditos e preferências gastronômicas.
        </p>
      </div>

      {profileMessage && (
        <div className="p-3.5 bg-[#092b1a] border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{profileMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-[#092b1a] border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Preferências atualizadas com sucesso!</span>
        </div>
      )}

      {/* User Info Card */}
      <Card variant="default" padding="md" className="space-y-5">
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
                className="w-20 h-20 rounded-3xl object-cover ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 text-stone-950 flex items-center justify-center text-xs font-black shadow-xs">
                ✓
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-lg font-bold text-white">{user.name}</h3>
              </div>
              <p className="text-xs text-emerald-300/70 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                {user.email}
              </p>
              
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {user.age !== undefined && user.age !== null && (
                  <span className="text-[11px] font-bold bg-[#092416] text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    {user.age} anos
                  </span>
                )}
                {user.weightKg !== undefined && user.weightKg !== null && (
                  <span className="text-[11px] font-bold bg-[#092416] text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-emerald-400" />
                    {user.weightKg} kg
                  </span>
                )}
                <span className="text-[11px] font-bold bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
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
                  setIsEditingProfile(true);
                }}
                leftIcon={<Edit3 className="w-3.5 h-3.5 text-emerald-400" />}
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
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Editar Dados do Perfil
              </h3>
              <button
                type="button"
                onClick={handleCancelProfileEdit}
                className="text-xs text-emerald-300/70 hover:text-white flex items-center gap-1"
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
                    className="w-20 h-20 rounded-3xl object-cover ring-2 ring-emerald-400/40 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center text-xs shadow-md hover:bg-emerald-400 transition"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>
              </div>
            </div>

            {profileError && (
              <div className="text-xs font-semibold text-rose-300 bg-rose-950/30 border border-rose-500/25 rounded-2xl p-3">
                {profileError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/15">
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
      <Card variant="default" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Saldo de Créditos</h3>
              <p className="text-xs text-emerald-300/70">Utilizados para escaneamentos de geladeira</p>
            </div>
          </div>

          <CreditBadge credits={user.credits} size="md" />
        </div>

        <div className="pt-3 border-t border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-300/70">
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
              leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-400" />}
              className="text-xs font-bold"
            >
              +10 Créditos
            </Button>
          </div>
        </div>
      </Card>

      {/* Cooking & Dietary Preferences */}
      <Card variant="default" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Preferências Culinárias</h3>
              <p className="text-xs text-emerald-300/70">Personalize recomendações e porções</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingPreferences(!isEditingPreferences)}
            className="text-xs font-bold text-emerald-400"
          >
            {isEditingPreferences ? 'Cancelar' : 'Alterar'}
          </Button>
        </div>

        {isEditingPreferences ? (
          <div className="space-y-4 pt-2 border-t border-emerald-500/15">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-emerald-200">Nível na Cozinha</label>
                <select
                  value={cookingLevel}
                  onChange={(e) => setCookingLevel(e.target.value as any)}
                  className="w-full rounded-2xl border border-emerald-500/30 bg-[#081e13] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                >
                  <option value="Iniciante">Iniciante (Receitas simples e rápidas)</option>
                  <option value="Intermediário">Intermediário (Receitas do dia a dia)</option>
                  <option value="Chef">Chef (Técnicas elaboradas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-emerald-200">Porções Padrão</label>
                <select
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full rounded-2xl border border-emerald-500/30 bg-[#081e13] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                >
                  <option value={1}>1 pessoa</option>
                  <option value={2}>2 pessoas</option>
                  <option value={3}>3 a 4 pessoas</option>
                  <option value={5}>5+ pessoas (Família)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-emerald-200">Restrições e Preferências</label>
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
                          ? 'bg-emerald-500 text-stone-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : 'bg-[#081e13] text-emerald-300/80 hover:bg-[#0c2a1a] border border-emerald-500/20'
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
          <div className="space-y-3 pt-2 border-t border-emerald-500/15 text-xs">
            <div className="flex items-center justify-between text-emerald-300/80">
              <span className="font-medium">Nível culinário:</span>
              <span className="font-bold text-white">{user.preferences.cookingLevel}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-300/80">
              <span className="font-medium">Rendimento padrão:</span>
              <span className="font-bold text-white">{user.preferences.defaultServings} porções</span>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-emerald-300/80 block">Restrições ativas:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {user.preferences.dietaryRestrictions.length > 0 ? (
                  user.preferences.dietaryRestrictions.map((r) => (
                    <span key={r} className="px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-emerald-500/50 italic">Nenhuma restrição cadastrada</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Admin Panel Entry */}
      {onNavigateTab && (
        <Card className="flex items-center justify-between p-5 border-emerald-500/20 bg-[#081e13]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Painel Administrativo</h4>
              <p className="text-xs text-emerald-300/70">Gerenciamento de receitas e base de dados</p>
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
