import React, { useState } from 'react';
import { User } from '../../types';
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
  ShieldCheck, 
  ChefHat, 
  Plus, 
  Check,
  Database
} from 'lucide-react';

export interface ProfileViewProps {
  user: User;
  onSignOut: () => void;
  onUpdateUser: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onSignOut,
  onUpdateUser,
}) => {
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

      {saveSuccess && (
        <div className="p-3.5 bg-[#092b1a] border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Preferências atualizadas com sucesso!</span>
        </div>
      )}

      {/* User Info Card */}
      <Card variant="default" padding="md" className="space-y-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-3xl object-cover ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 text-stone-950 flex items-center justify-center text-xs font-black shadow-xs">
              ✓
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-bold text-white">{user.name}</h3>
            <p className="text-xs text-emerald-300/70 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              {user.email}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-bold bg-[#092416] text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Plano Base • Demonstração
              </span>
              <span className="text-[11px] font-bold bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                Nível {user.preferences.cookingLevel}
              </span>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={onSignOut}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            className="self-center sm:self-start text-xs font-bold"
          >
            Sair da Conta
          </Button>
        </div>
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

      {/* Cloud & Architecture Foundation Card */}
      <div className="p-5 rounded-3xl bg-[#081e13]/90 border border-emerald-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Database className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Fundação de Nuvem & Firebase</h4>
            <p className="text-xs text-emerald-300/70">Arquitetura desacoplada e pronta para persistência segura</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-emerald-300/70 pt-2">
          <div className="p-3 bg-[#05140c]/80 rounded-2xl border border-emerald-500/15">
            <span className="font-bold text-white block mb-0.5">Sem localStorage local</span>
            Os dados fluem através de repositórios e serviços padronizados, sem acoplamento a chaves de storage locais.
          </div>
          <div className="p-3 bg-[#05140c]/80 rounded-2xl border border-emerald-500/15">
            <span className="font-bold text-white block mb-0.5">Coleções Firestore Preparadas</span>
            Estrutura mapeada para coleções <code className="text-emerald-400 font-mono">users</code>, <code className="text-emerald-400 font-mono">inventory</code>, <code className="text-emerald-400 font-mono">recipes</code> e <code className="text-emerald-400 font-mono">scans</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
