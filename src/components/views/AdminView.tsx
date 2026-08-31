import React from 'react';
import { ShieldCheck, Database } from 'lucide-react';
import { Card } from '../common/Card';

export const AdminView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
      </div>

      <Card>
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Base de Receitas
        </h2>
        <p className="text-white/60 mb-4">
          Este painel será usado para importar e gerenciar a base unificada de receitas (Wikibooks, TheMealDB e Custom).
        </p>
        
        {/* Futuramente colocaremos os botões de importação aqui */}
        <button 
          className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-4 py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
          disabled
        >
          Módulo de importação em construção...
        </button>
      </Card>
    </div>
  );
};
