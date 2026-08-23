import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Camera } from 'lucide-react';
import { Button } from '../common/Button';
import { AppLogo } from '../common/AppLogo';

export interface LoginViewProps {
  onLogin: () => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await onLogin();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05130b] text-emerald-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-stone-950 relative overflow-hidden">
      {/* Ambient background glows matching image.png */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top micro banner */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto w-full relative z-10">
        <AppLogo size="md" />

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Visão Computacional & Culinária</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {/* Large Concentric Glowing Hero Icon Container (Inspired by image.png center visual) */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full bg-emerald-500/20 animate-pulse blur-xl" />
          <div className="absolute w-32 h-32 rounded-full border border-emerald-400/30 animate-spin-slow" />
          <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#0e3320] to-[#081e13] border-2 border-emerald-400/50 flex items-center justify-center p-3 shadow-[0_0_35px_rgba(34,197,94,0.45)] backdrop-blur-md">
            <AppLogo size="lg" showText={false} />
          </div>
        </div>

        {/* Hero badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-4 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Gestão Inteligente de Alimentos & Receitas</span>
        </div>

        {/* Title & description */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl leading-[1.15]">
          Descubra o que cozinhar com o que você <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">já tem</span> em casa.
        </h1>

        <p className="mt-4 text-sm sm:text-base text-emerald-200/80 max-w-xl leading-relaxed">
          Fotografe as prateleiras da sua geladeira para catalogar ingredientes automaticamente, monitorar validades e desbloquear receitas práticas.
        </p>

        {/* Action card */}
        <div className="mt-8 w-full max-w-md bg-[#0a2316]/85 rounded-3xl p-6 sm:p-8 border border-emerald-500/25 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-left">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-white">Acesse sua conta</h2>
            <p className="text-xs text-emerald-300/70 mt-1">
              Conecte-se para sincronizar seu inventário e sugestões
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm sm:text-base py-3.5"
            onClick={handleGoogleLogin}
            isLoading={isLoading}
            leftIcon={
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                <path
                  fill="#000000"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#000000"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#000000"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#000000"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            }
          >
            Entrar com Google
          </Button>

          {/* Feature points */}
          <div className="mt-6 pt-5 border-t border-emerald-500/15 space-y-2.5 text-xs text-emerald-200/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Controle visual de estoque e frescor</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Calculadora dinâmica de receitas compatíveis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Scanner de geladeira com reconhecimento por foto</span>
            </div>
          </div>
        </div>

        {/* Firebase Preparation Note */}
        <div className="mt-8 p-4 rounded-3xl bg-[#081e13]/80 border border-emerald-500/20 max-w-md text-xs text-emerald-300/80 flex items-start gap-3 text-left backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Arquitetura de Nuvem Pronta</span>
            Preparado para integração direta com Firebase Auth e Cloud Firestore. Todos os dados permanecem desacoplados de armazenamento local efêmero.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-emerald-400/60 relative z-10">
        Geladeira Inteligente © 2026 • Alimentação Sustentável e Prática
      </footer>
    </div>
  );
};
