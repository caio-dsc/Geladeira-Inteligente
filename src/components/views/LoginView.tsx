import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { AppLogo } from '../common/AppLogo';

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

  return (
    <div className="min-h-screen bg-[#05130b] text-emerald-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-stone-950 relative overflow-hidden">
      {/* Ambient background glows */}
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
        {/* Large Concentric Glowing Hero Icon Container */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-emerald-500/20 animate-pulse blur-xl" />
          <div className="absolute w-28 h-28 rounded-full border border-emerald-400/30 animate-spin-slow" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#0e3320] to-[#081e13] border-2 border-emerald-400/50 flex items-center justify-center p-3 shadow-[0_0_35px_rgba(34,197,94,0.45)] backdrop-blur-md">
            <AppLogo size="lg" showText={false} />
          </div>
        </div>

        {/* Hero badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Gestão Inteligente de Alimentos & Receitas</span>
        </div>

        {/* Title & description */}
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight max-w-2xl leading-[1.2]">
          Descubra o que cozinhar com o que você <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">já tem</span> em casa.
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-emerald-200/80 max-w-xl leading-relaxed">
          Fotografe as prateleiras da sua geladeira para catalogar ingredientes automaticamente, monitorar validades e desbloquear receitas práticas.
        </p>

        {/* Action card */}
        <div className="mt-6 w-full max-w-md bg-[#0a2316]/90 rounded-3xl p-6 sm:p-7 border border-emerald-500/25 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-left">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm sm:text-base py-3.5"
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
            <div className="h-px flex-1 bg-emerald-500/15" />
            <span className="text-[11px] font-bold text-emerald-300/60">ou</span>
            <div className="h-px flex-1 bg-emerald-500/15" />
          </div>

          {/* Email/Password Form */}
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage('');
              setInfoMessage('');

              try {
                setIsLoading(true);

                if (!email.trim() || !password) {
                  setErrorMessage('Preencha email e senha.');
                  return;
                }

                if (mode === 'signup') {
                  if (!name.trim()) {
                    setErrorMessage('Informe seu nome.');
                    return;
                  }
                  await onSignUpWithEmail(name.trim(), email.trim(), password);
                } else {
                  await onLoginWithEmail(email.trim(), password);
                }
              } catch (err: any) {
                setErrorMessage(err?.message || 'Falha ao autenticar.');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {mode === 'signup' && (
              <Input
                label="Nome"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            )}

            <Input
              label="Email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />

            <Input
              label="Senha"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="p-1 rounded-md hover:bg-emerald-900/40 text-sm"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              }
            />

            {errorMessage && (
              <div className="text-xs font-semibold text-rose-300 bg-rose-950/30 border border-rose-500/25 rounded-2xl p-3">
                {errorMessage}
              </div>
            )}

            {infoMessage && (
              <div className="text-xs font-semibold text-emerald-200 bg-emerald-950/40 border border-emerald-500/25 rounded-2xl p-3">
                {infoMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full justify-center text-sm sm:text-base py-3.5"
              isLoading={isLoading}
            >
              {mode === 'signup' ? 'Criar conta' : 'Entrar com Email'}
            </Button>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                  setErrorMessage('');
                  setInfoMessage('');
                }}
                disabled={isLoading}
              >
                {mode === 'signin' ? 'Criar nova conta' : 'Já tenho conta'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={async () => {
                  setErrorMessage('');
                  setInfoMessage('');
                  try {
                    if (!email.trim()) {
                      setErrorMessage('Digite seu email para recuperar a senha.');
                      return;
                    }
                    setIsLoading(true);
                    await onResetPassword(email.trim());
                    setInfoMessage('Se o email existir, enviamos um link de recuperação.');
                  } catch (err: any) {
                    setErrorMessage(err?.message || 'Falha ao enviar recuperação.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                Esqueci a senha
              </Button>
            </div>
          </form>

          {/* Feature points */}
          <div className="mt-5 pt-4 border-t border-emerald-500/15 space-y-2 text-[11px] text-emerald-200/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Controle visual de estoque e frescor</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Calculadora dinâmica de receitas compatíveis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Scanner de geladeira com reconhecimento por foto</span>
            </div>
          </div>
        </div>

        {/* Cloud Architecture Note */}
        <div className="mt-6 p-3.5 rounded-2xl bg-[#081e13]/80 border border-emerald-500/20 max-w-md text-xs text-emerald-300/80 flex items-start gap-3 text-left backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Arquitetura de Nuvem Segura</span>
            Integrado com Firebase Authentication e Cloud Firestore. Todos os dados permanecem protegidos e sincronizados.
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


