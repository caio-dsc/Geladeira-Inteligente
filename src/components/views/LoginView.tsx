import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Camera, 
  UtensilsCrossed, 
  ChefHat, 
  SlidersHorizontal, 
  Clock, 
  Leaf, 
  ArrowRight,
  ArrowDown,
  Check,
  Refrigerator,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { AppLogo } from '../common/AppLogo';
import { Card } from '../common/Card';

export interface LoginViewProps {
  onLoginWithGoogle: () => Promise<void>;
  onLoginWithEmail: (email: string, password: string) => Promise<void>;
  onSignUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginWithGoogle,
  onLoginWithEmail,
  onSignUpWithEmail,
  onResetPassword,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const scrollToAuth = () => {
    const el = document.getElementById('acesso-app');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('recursos-app');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted text-text-primary flex flex-col justify-between selection:bg-primary/20 selection:text-primary relative overflow-x-hidden font-sans">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[350px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ===================================================================== */}
      {/* TOP HEADER / NAVBAR                                                   */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <AppLogo size="md" />

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
            <a href="#proposta" className="hover:text-primary transition-colors">O que é</a>
            <a href="#recursos-app" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={scrollToAuth}
              className="font-bold text-xs shadow-subtle"
            >
              Entrar agora
            </Button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* HERO SECTION (SPATIAL UI 2D)                                          */}
      {/* ===================================================================== */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-primary text-xs font-bold mb-5 shadow-subtle hover:border-primary/40 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Inteligência Artificial & Gestão Gastronômica</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-text-primary tracking-tight max-w-3xl leading-[1.15]">
            Descubra o que cozinhar com o que você <span className="text-primary">já tem</span> na geladeira.
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed">
            Fotografe suas prateleiras para catalogar ingredientes automaticamente, monitorar prazos de validade e desbloquear receitas práticas sem desperdício de alimentos.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Button
              variant="primary"
              size="lg"
              onClick={scrollToAuth}
              className="font-bold text-sm sm:text-base px-8 py-3.5 shadow-soft hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none"
              leftIcon={<ArrowDown className="w-4 h-4" />}
            >
              Entrar agora
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={scrollToFeatures}
              className="text-xs sm:text-sm font-semibold py-3.5 px-6 hover:border-primary/40 transition-colors"
            >
              Conhecer recursos
            </Button>
          </div>
        </motion.div>

        {/* SPATIAL UI 2D VISUAL PREVIEW: Layered interactive card mockup */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="mt-12 sm:mt-16 w-full max-w-4xl relative"
        >
          <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-border shadow-elevated text-left relative overflow-hidden transition-all duration-200">
            {/* Header of mockup */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-text-secondary ml-2">Visão Geral da Geladeira</span>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                100% Sincronizado
              </span>
            </div>

            {/* Content grid preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left: Inventory items card (Surface Z1) */}
              <div className="md:col-span-6 p-4 rounded-2xl bg-surface-muted/70 border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                  <span className="flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                    Estoque Identificado (Exemplo)
                  </span>
                  <span className="text-primary font-bold">3 itens frescos</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border text-xs shadow-subtle hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-150 motion-reduce:transform-none">
                    <span className="font-semibold text-text-primary">🍅 Tomates Maduros</span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">Fresco • 4 un</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border text-xs shadow-subtle hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-150 motion-reduce:transform-none">
                    <span className="font-semibold text-text-primary">🥚 Ovos Caipiras</span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">Fresco • 6 un</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border text-xs shadow-subtle hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-150 motion-reduce:transform-none">
                    <span className="font-semibold text-text-primary">🧀 Queijo Mussarela</span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">Fresco • 200g</span>
                  </div>
                </div>
              </div>

              {/* Right: Recipe match result card (Surface Z2 elevated) */}
              <div className="md:col-span-6 p-4.5 rounded-2xl bg-gradient-to-br from-primary-dark via-[#0B3D35] to-[#082821] text-white shadow-floating border border-primary/30 space-y-3 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-200 motion-reduce:transform-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md">
                    100% Compatível
                  </span>
                  <span className="text-xs text-white/80 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 15 min
                  </span>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Omelete Caprese com Queijo e Ervas
                  </h4>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    Você possui todos os ingredientes necessários para preparar este prato agora mesmo!
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-white/15">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    Pronta para cozinhar
                  </span>
                  <span className="font-bold text-white underline decoration-white/40">
                    Modo de preparo passo a passo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===================================================================== */}
      {/* VALUE PROPOSITION: O QUE É A GELADEIRA INTELIGENTE (#proposta)        */}
      {/* ===================================================================== */}
      <section id="proposta" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-left">
        <div className="p-6 sm:p-10 rounded-3xl bg-surface border border-border shadow-soft grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <Refrigerator className="w-3.5 h-3.5" />
              <span>O que é a Geladeira Inteligente</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              A ponte perfeita entre o que você tem e o que vai saborear.
            </h2>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Quantas vezes você abriu a geladeira, viu vários itens espalhados e pensou <em>"não tem nada para comer"</em>? A Geladeira Inteligente resolve exatamente essa dor diária.
            </p>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Combinando <strong>visão computacional</strong>, catalogação de alimentos e um <strong>motor de matching de receitas</strong>, você transforma qualquer ingrediente avulso em refeições saborosas e nutritivas.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-3 text-xs font-bold text-text-primary">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Zero desperdício de comida</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Economia no mercado</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Receitas em poucos minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Filtros para sua dieta</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
              <span className="text-2xl font-black text-primary block">30%</span>
              <p className="text-xs text-text-secondary mt-1">
                dos alimentos comprados em média acabam no lixo por falta de planejamento.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
              <span className="text-2xl font-black text-primary block">Instantâneo</span>
              <p className="text-xs text-text-secondary mt-1">
                Basta tirar uma foto da geladeira para atualizar o estoque de uma só vez.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* RECURSOS PRINCIPAIS (SPATIAL UI 2D GRID) (#recursos-app)               */}
      {/* ===================================================================== */}
      <section id="recursos-app" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-left">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recursos Completos</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight">
            Tudo o que você precisa para uma rotina culinária prática
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-2">
            Tecnologia de ponta pensada para facilitar o seu dia a dia na cozinha.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Scanner */}
          <Card variant="default" padding="md" className="space-y-3 border-border shadow-subtle hover:shadow-elevated hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 group motion-reduce:transform-none cursor-default">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform duration-200 motion-reduce:transform-none">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
              Scanner com Visão IA
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Aponte a câmera para as prateleiras ou gavetas. O modelo de inteligência artificial reconhece os alimentos, quantidades e estado de conservação automaticamente.
            </p>
          </Card>

          {/* Card 2: Inventário */}
          <Card variant="default" padding="md" className="space-y-3 border-border shadow-subtle hover:shadow-elevated hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 group motion-reduce:transform-none cursor-default">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform duration-200 motion-reduce:transform-none">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
              Inventário Inteligente
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Acompanhe seus alimentos frescos, congelados e itens de despensa em tempo real. Saiba exatamente o que precisa ser consumido antes do vencimento.
            </p>
          </Card>

          {/* Card 3: Matching */}
          <Card variant="default" padding="md" className="space-y-3 border-border shadow-subtle hover:shadow-elevated hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 group motion-reduce:transform-none cursor-default">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform duration-200 motion-reduce:transform-none">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
              Matching de Receitas
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Nosso algoritmo cruza seu estoque com centenas de receitas catalogadas, indicando percentual de compatibilidade e destacando o que você já pode preparar.
            </p>
          </Card>

          {/* Card 4: Filtros & Dietas */}
          <Card variant="default" padding="md" className="space-y-3 border-border shadow-subtle hover:shadow-elevated hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 group motion-reduce:transform-none cursor-default">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform duration-200 motion-reduce:transform-none">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
              Filtros & Dietas
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Filtre por vegetarianas, veganas, sem glúten, sem lactose, low carb ou proteicas. Ajuste por porções e tempo de preparo de forma instantânea.
            </p>
          </Card>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* COMO FUNCIONA (#como-funciona)                                        */}
      {/* ===================================================================== */}
      <section id="como-funciona" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-left">
        <div className="p-6 sm:p-10 rounded-3xl bg-surface border border-border shadow-soft">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simples e Prático</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              Como funciona em 4 etapas
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Do escaneamento ao prato servido na mesa em poucos minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-muted/50 border border-border hover:border-primary/30 hover:bg-surface-muted hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
              <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center mb-3 shadow-subtle">
                1
              </span>
              <h4 className="text-sm font-bold text-text-primary">Adicione seus alimentos</h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Tire uma foto das prateleiras com o Scanner ou adicione manualmente em segundos.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-muted/50 border border-border hover:border-primary/30 hover:bg-surface-muted hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
              <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center mb-3 shadow-subtle">
                2
              </span>
              <h4 className="text-sm font-bold text-text-primary">Controle o inventário</h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Veja o frescor, quantidades e categorias organizadas na Minha Geladeira.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-muted/50 border border-border hover:border-primary/30 hover:bg-surface-muted hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
              <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center mb-3 shadow-subtle">
                3
              </span>
              <h4 className="text-sm font-bold text-text-primary">Descubra receitas</h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Nosso algoritmo lista as receitas compatíveis e destaca as prontas para fazer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-muted/50 border border-border hover:border-primary/30 hover:bg-surface-muted hover:-translate-y-0.5 transition-all duration-200 motion-reduce:transform-none">
              <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center mb-3 shadow-subtle">
                4
              </span>
              <h4 className="text-sm font-bold text-text-primary">Cozinhe sem desperdício</h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Siga as instruções passo a passo e economize dinheiro enquanto come bem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* AUTHENTICATION SECTION: ENTRAR AGORA (#acesso-app)                    */}
      {/* ===================================================================== */}
      <section id="acesso-app" className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center w-full">
        {/* Glowing concentric icon */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full bg-primary/10 animate-pulse blur-xl" />
          <div className="w-20 h-20 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center p-2.5 shadow-soft">
            <AppLogo size="lg" showText={false} />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
          Acesse sua Geladeira Inteligente
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
          Entre com sua conta para acessar seu inventário sincronizado, escanear alimentos e ver suas receitas personalizadas.
        </p>

        {/* Action card */}
        <div className="mt-6 w-full bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-elevated text-left">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm sm:text-base py-3.5 font-bold shadow-subtle cursor-pointer"
            onClick={async () => {
              setErrorMessage('');
              setInfoMessage('');
              try {
                setIsLoading(true);
                await onLoginWithGoogle();
              } catch (err: any) {
                setErrorMessage(err?.message || 'Falha ao entrar com Google.');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            isLoading={isLoading}
            leftIcon={
              <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#ffffff"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#ffffff"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#ffffff"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            }
          >
            Entrar com Google
          </Button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-bold text-text-secondary">ou use seu e-mail</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email/Password Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage('');
              setInfoMessage('');

              if (!email || !password) {
                setErrorMessage('Preencha todos os campos obrigatórios.');
                return;
              }

              try {
                setIsLoading(true);
                if (mode === 'signup') {
                  if (!name) {
                    setErrorMessage('Informe seu nome para criar a conta.');
                    setIsLoading(false);
                    return;
                  }
                  await onSignUpWithEmail(name, email, password);
                } else {
                  await onLoginWithEmail(email, password);
                }
              } catch (err: any) {
                setErrorMessage(err?.message || 'Falha ao autenticar.');
              } finally {
                setIsLoading(false);
              }
            }}
            className="space-y-3.5"
          >
            {mode === 'signup' && (
              <Input
                label="Seu Nome Completo"
                placeholder="Ex: Maria Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer flex items-center justify-center"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <Eye className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              }
            />

            {errorMessage && (
              <div className="text-xs font-semibold text-rose-700 bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3">
                {errorMessage}
              </div>
            )}

            {infoMessage && (
              <div className="text-xs font-semibold text-primary bg-primary/10 border border-primary/25 rounded-2xl p-3">
                {infoMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full justify-center text-sm sm:text-base py-3.5 font-bold cursor-pointer"
              isLoading={isLoading}
            >
              {mode === 'signup' ? 'Criar minha conta' : 'Entrar na minha conta'}
            </Button>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                onClick={() => {
                  setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                  setErrorMessage('');
                  setInfoMessage('');
                }}
              >
                {mode === 'signin' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
              </button>

              {mode === 'signin' && (
                <button
                  type="button"
                  className="text-xs text-text-secondary hover:text-text-primary cursor-pointer"
                  onClick={async () => {
                    setErrorMessage('');
                    setInfoMessage('');
                    if (!email) {
                      setErrorMessage('Digite seu e-mail no campo acima para redefinir.');
                      return;
                    }
                    try {
                      setIsLoading(true);
                      await onResetPassword(email);
                      setInfoMessage('Link de redefinição enviado para o e-mail informado.');
                    } catch (err: any) {
                      setErrorMessage(err?.message || 'Falha ao enviar e-mail de recuperação.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  Esqueci a senha
                </button>
              )}
            </div>
          </form>

          {/* Cloud Architecture Note */}
          <div className="mt-5 pt-4 border-t border-border flex items-start gap-2.5 text-[11px] text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              Ambiente protegido com Firebase Authentication e persistência em tempo real via Cloud Firestore.
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FOOTER                                                                */}
      {/* ===================================================================== */}
      <footer className="py-6 border-t border-border bg-surface text-center text-xs text-text-secondary relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Geladeira Inteligente © 2026 • Alimentação Sustentável e Prática</p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#proposta" className="hover:text-primary transition-colors">O que é</a>
            <a href="#recursos-app" className="hover:text-primary transition-colors">Recursos</a>
            <button onClick={scrollToAuth} className="hover:text-primary transition-colors cursor-pointer">
              Entrar agora
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
