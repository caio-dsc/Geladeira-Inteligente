import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { User, NavigationTab } from '../../types';
import { 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Mail, 
  Plus, 
  UtensilsCrossed, 
  ShieldCheck, 
  Zap, 
  Lock, 
  ShoppingCart, 
  BookOpen, 
  Users, 
  Copy, 
  Check, 
  ArrowRight,
  Eye,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  Share2,
  Clock,
  UserCheck,
  UserX
} from 'lucide-react';

export type BlockedFeatureType = 'scanner' | 'shoppingList' | 'recipes' | 'other' | null;

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  blockedFeature?: BlockedFeatureType;
  onOpenFoodModal?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToAdmin?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  user,
  blockedFeature = null,
  onOpenFoodModal,
  onNavigateToInventory,
  onNavigateToAdmin,
}) => {
  const isAdmin = Boolean(user?.isAdmin);
  const isPremium = Boolean(user?.scanEnabled || user?.isAdmin);
  const isFree = !isAdmin && !user?.scanEnabled;

  // Abas disponíveis dependendo do perfil:
  // Free: 'my_plan' | 'premium_plan'
  // Premium: 'my_plan' | 'premium_plan' (ou visão unificada)
  // Admin: 'my_plan' | 'premium_plan' | 'admin_panel'
  type TabType = 'my_plan' | 'premium_plan' | 'admin_panel';
  const [activeTab, setActiveTab] = useState<TabType>('my_plan');
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Se abrir motivado por clique em recurso bloqueado, abre na aba 'premium_plan' para explicar o desbloqueio
  useEffect(() => {
    if (isOpen) {
      setShowContactDetails(false);
      if (blockedFeature && isFree) {
        setActiveTab('premium_plan');
      } else if (isAdmin) {
        setActiveTab('my_plan');
      } else {
        setActiveTab('my_plan');
      }
    }
  }, [isOpen, blockedFeature, isFree, isAdmin]);

  const handleClose = () => {
    setShowContactDetails(false);
    onClose();
  };

  const getFeatureLabel = (feature: BlockedFeatureType) => {
    switch (feature) {
      case 'scanner':
        return 'Reconhecimento por Imagem (Scan com IA)';
      case 'shoppingList':
        return 'Lista de Mercado Inteligente';
      case 'recipes':
        return 'Catálogo de Receitas & Match de Ingredientes';
      default:
        return 'Recurso Premium';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={blockedFeature ? 'Recurso Premium' : 'Planos & Funcionalidades'}
      subtitle={
        blockedFeature
          ? 'Adquira o plano Premium para desbloquear este recurso.'
          : 'Gerencie seu acesso e conheça os recursos da Geladeira Inteligente'
      }
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} className="w-full sm:w-auto">
            Fechar
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isFree && onOpenFoodModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleClose();
                  onOpenFoodModal();
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto text-xs"
              >
                Adicionar Alimento Manual
              </Button>
            )}

            {isFree && onNavigateToInventory && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleClose();
                  onNavigateToInventory();
                }}
                leftIcon={<UtensilsCrossed className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto text-xs font-bold"
              >
                Minha Geladeira
              </Button>
            )}

            {isAdmin && onNavigateToAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleClose();
                  onNavigateToAdmin();
                }}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto text-xs font-bold"
              >
                Abrir Painel Admin
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-left">
        {/* Banner de Aviso quando clicou em recurso bloqueado */}
        {blockedFeature && isFree && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Recurso Bloqueado
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span className="text-xs font-semibold text-amber-900">
                  {getFeatureLabel(blockedFeature)}
                </span>
              </div>
              <h4 className="text-sm font-bold text-text-primary mt-0.5">
                Recurso Premium
              </h4>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                Adquira o plano Premium para desbloquear este recurso.
              </p>
            </div>
          </div>
        )}

        {/* Abas de Navegação no Topo do Popup */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-muted rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('my_plan')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer select-none ${
              activeTab === 'my_plan'
                ? 'bg-surface text-primary shadow-subtle border border-border/80'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Meu plano
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('premium_plan')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer select-none flex items-center justify-center gap-1.5 ${
              activeTab === 'premium_plan'
                ? 'bg-surface text-primary shadow-subtle border border-border/80'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>Plano Premium</span>
            {isFree && <Lock className="w-3 h-3 text-amber-600" />}
            {isPremium && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin_panel')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                activeTab === 'admin_panel'
                  ? 'bg-surface text-purple-700 shadow-subtle border border-border/80'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: MEU PLANO                                                          */}
        {/* ========================================================================= */}
        {activeTab === 'my_plan' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header de Status do Plano Atual */}
            <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-secondary">Plano Atual:</span>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Administrador
                    </span>
                  ) : isPremium ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Plano Premium Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      <Lock className="w-3 h-3 text-amber-700" />
                      Plano Free
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {isAdmin
                    ? 'Acesso total com permissões de gestão do sistema e usuários.'
                    : isPremium
                    ? 'Acesso irrestrito a todos os recursos inteligentes e receitas.'
                    : 'Acesso às funcionalidades essenciais da sua geladeira.'}
                </p>
              </div>

              {isFree && (
                <button
                  type="button"
                  onClick={() => setActiveTab('premium_plan')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark cursor-pointer shrink-0"
                >
                  <span>Ver vantagens do Premium</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* CONTEÚDO PARA USUÁRIO FREE: SOMENTE RECURSOS DISPONÍVEIS NO FREE */}
            {isFree && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Recursos disponíveis no seu plano Free:
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Acesso Gratuito
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* 1. Visualização dos alimentos */}
                  <div className="p-3 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-subtle">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">Visualização dos alimentos</h5>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        Consulte todos os ingredientes cadastrados com filtros por categoria e busca rápida.
                      </p>
                    </div>
                  </div>

                  {/* 2. Controle de quantidade */}
                  <div className="p-3 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-subtle">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">Controle de quantidade</h5>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        Monitore a quantidade e unidades (kg, g, L, un) de cada alimento em estoque.
                      </p>
                    </div>
                  </div>

                  {/* 3. Acompanhamento de validade */}
                  <div className="p-3 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-subtle">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">Acompanhar validade</h5>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        Veja status de frescor, alimentos vencendo e evite o desperdício em casa.
                      </p>
                    </div>
                  </div>

                  {/* 4. Organização da geladeira */}
                  <div className="p-3 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-subtle">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">Organização da geladeira</h5>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        Organize itens por compartimentos: prateleiras, freezer, gavetas e despensa.
                      </p>
                    </div>
                  </div>

                  {/* 5. Adição manual de alimentos */}
                  <div className="p-3 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-subtle sm:col-span-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">Adição manual de alimentos</h5>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        Cadastre e edite qualquer alimento da sua casa manualmente a qualquer momento, sem limites.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Destaque para o usuário Free sobre o Premium */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Deseja Scan com IA, Lista de Mercado e Receitas automáticas?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('premium_plan')}
                    className="font-bold underline hover:text-amber-950 cursor-pointer shrink-0"
                  >
                    Conhecer Premium
                  </button>
                </div>
              </div>
            )}

            {/* CONTEÚDO PARA USUÁRIO PREMIUM OU ADMIN */}
            {isPremium && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Seu plano possui acesso completo liberado!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Você pode utilizar a Lista de Mercado inteligente, o Scan fotográfico com IA e o Catálogo de Receitas em qualquer dispositivo.
                  </p>
                </div>

                {/* Explicação detalhada da LISTA DE COMPRAS existente */}
                <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">
                      Como funciona sua Lista de Compras:
                    </h4>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Adicionar elementos</strong>: Insira itens rapidamente pelo campo de busca ou com modal detalhado.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Definir quantidade</strong>: Especifique unidades (un, kg, g, L, ml, pct, fatias).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Informar preço</strong>: Insira o valor unitário em R$ e veja o total calculado em tempo real.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Visualizar itens</strong>: Filtre entre todos os itens, pendentes ou concluídos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Copiar lista</strong>: Exporte o texto formatado para a área de transferência para enviar no WhatsApp.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span><strong>Mover para a Geladeira</strong>: Ao finalizar as compras, transfira os itens direto para seu estoque.</span>
                    </li>
                  </ul>
                </div>

                {/* Outros Recursos Premium Ativos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-surface border border-border shadow-subtle space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <Camera className="w-4 h-4 text-primary" />
                      <span>Scan com Inteligência Artificial</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      Fotografe prateleiras para reconhecimento automático dos alimentos, com estimativa de validade e importação em lote.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface border border-border shadow-subtle space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span>Receitas & Match Culinário</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      Sugestões de pratos calculadas com base no que você tem na geladeira, filtros de dieta e temporizador culinário integrado.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: PLANO PREMIUM                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'premium_plan' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header da Aba Premium */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent border border-primary/20">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Experiência Completa da Geladeira Inteligente</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-text-primary mt-1">
                Recursos desbloqueados pelo Plano Premium
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Utilize ferramentas inteligentes que economizam tempo e evitam o desperdício de alimentos.
              </p>
            </div>

            {/* Lista dos Recursos Premium existentes */}
            <div className="space-y-3">
              {/* 1. Lista de Mercado Completa */}
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                        Lista de Mercado Completa
                      </h4>
                      <span className="text-[10px] font-semibold text-primary">Planejamento & Economia</span>
                    </div>
                  </div>
                  {isPremium ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Liberado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Bloqueado no Free
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Crie e organize suas compras de supermercado com controle total:
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-text-secondary pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Adicionar elementos rapidamente à lista</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Definir quantidade e unidades de medida</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Informar preço e calcular valor total em R$</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Visualizar e filtrar itens por status</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Copiar a lista formatada para a área de transferência</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Finalizar compra e transferir para a geladeira</span>
                  </li>
                </ul>
              </div>

              {/* 2. Reconhecimento por Imagem (Scan) */}
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                        Reconhecimento por Imagem (Scan IA)
                      </h4>
                      <span className="text-[10px] font-semibold text-primary">Visão Computacional</span>
                    </div>
                  </div>
                  {isPremium ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Liberado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Bloqueado no Free
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  Fotografe prateleiras ou gavetas da geladeira para identificar alimentos automaticamente. A IA sugere nomes, categorias, estimativas de validade e permite cadastrar tudo com poucos cliques.
                </p>
              </div>

              {/* 3. Catálogo de Receitas com Match de Ingredientes */}
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                        Catálogo de Receitas & Possibilidades
                      </h4>
                      <span className="text-[10px] font-semibold text-primary">Culinária Inteligente</span>
                    </div>
                  </div>
                  {isPremium ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Liberado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Bloqueado no Free
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  O aplicativo cruza os alimentos presentes na sua geladeira e calcula pratos que você já pode cozinhar agora, com porcentagem de ingredientes disponíveis, filtros dietéticos (Vegano, Sem Glúten, Low Carb) e temporizador de preparo culinário.
                </p>
              </div>
            </div>

            {/* Como Adquirir / Contato com Administrador (apenas para Free) */}
            {isFree && (
              <div className="pt-2">
                {!showContactDetails ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-bold shadow-soft"
                    onClick={() => setShowContactDetails(true)}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Adquira o plano Premium para desbloquear este recurso
                  </Button>
                ) : (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                        Como ativar seu Plano Premium:
                      </h4>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Entre em contato diretamente com o administrador para confirmar a ativação. Seu e-mail será liberado no painel administrativo e todos os recursos Premium ficarão disponíveis de forma imediata.
                    </p>
                    <a
                      href="mailto:b75282353@gmail.com?subject=Ativa%C3%A7%C3%A3o%20Plano%20Premium%20-%20Geladeira%20Inteligente"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-subtle hover:bg-primary-hover transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Solicitar Ativação por E-mail</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: ADMIN (SOMENTE PARA ADMINISTRADORES)                              */}
        {/* ========================================================================= */}
        {isAdmin && activeTab === 'admin_panel' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Painel de Administração</span>
              </div>
              <h3 className="text-base font-black text-purple-950 mt-1">
                Recursos do Painel Administrativo
              </h3>
              <p className="text-xs text-purple-900/80 mt-0.5">
                Funções exclusivas para gestão dos usuários e do catálogo de receitas da plataforma.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-subtle flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Visualizar usuários cadastrados</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Consulte a lista de todos os usuários com dados de perfil, status de conta e barra de pesquisa por nome ou e-mail.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-subtle flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Transformar usuários Free em Premium</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Ative o acesso completo e ilimitado (Scan, Lista de Mercado e Receitas) para qualquer usuário com um único clique.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-subtle flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Remover o Premium e retornar para Free</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Revogue o status Premium retornando a conta para o plano Free a qualquer momento com segurança.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-subtle flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Pré-cadastro de clientes pagos</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Cadastre e-mails que realizaram compra prévia para que o plano Premium seja ativado automaticamente no primeiro acesso.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-subtle flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Gestão de catálogo e fotos de receitas</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    Adicione fotos personalizadas para as receitas do sistema e mantenha a base sincronizada com o Firestore.
                  </p>
                </div>
              </div>
            </div>

            {onNavigateToAdmin && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full font-bold shadow-soft"
                  onClick={() => {
                    handleClose();
                    onNavigateToAdmin();
                  }}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Abrir Painel Administrativo Completo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
