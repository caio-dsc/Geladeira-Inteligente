import React from 'react';
import { NavigationTab } from '../../types';
import { 
  Home, 
  Camera, 
  UtensilsCrossed, 
  BookOpen, 
  User as UserIcon 
} from 'lucide-react';

export interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  inventoryCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  inventoryCount = 0,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#05140c]/90 backdrop-blur-2xl border-t border-emerald-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-3 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Início */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-emerald-300 font-extrabold'
              : 'text-emerald-600/70 hover:text-emerald-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.3)]' : ''
          }`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Início</span>
        </button>

        {/* Minha geladeira */}
        <button
          onClick={() => onTabChange('inventory')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'text-emerald-300 font-extrabold'
              : 'text-emerald-600/70 hover:text-emerald-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            activeTab === 'inventory' ? 'bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.3)]' : ''
          }`}>
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Geladeira</span>
          {inventoryCount > 0 && (
            <span className="absolute top-0 right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-400 text-stone-950 font-black text-[9px] flex items-center justify-center shadow-[0_0_8px_rgba(52,211,153,0.6)]">
              {inventoryCount}
            </span>
          )}
        </button>

        {/* Scanner Center Action Button with Glow */}
        <button
          onClick={() => onTabChange('scanner')}
          className="relative -top-5 flex flex-col items-center justify-center group focus:outline-none cursor-pointer"
          aria-label="Escanear geladeira"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
            activeTab === 'scanner'
              ? 'bg-gradient-to-tr from-emerald-400 via-emerald-300 to-emerald-400 text-stone-950 shadow-[0_0_30px_rgba(52,211,153,0.7)] ring-4 ring-emerald-400/30 scale-105'
              : 'bg-gradient-to-tr from-emerald-500 via-emerald-400 to-emerald-500 text-stone-950 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] hover:scale-105'
          }`}>
            <Camera className="w-7 h-7" />
          </div>
          <span className={`text-[10px] mt-1 font-bold ${
            activeTab === 'scanner' ? 'text-emerald-300' : 'text-emerald-400/70'
          }`}>
            Escanear
          </span>
        </button>

        {/* Receitas */}
        <button
          onClick={() => onTabChange('recipes')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'recipes'
              ? 'text-emerald-300 font-extrabold'
              : 'text-emerald-600/70 hover:text-emerald-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            activeTab === 'recipes' ? 'bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.3)]' : ''
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Receitas</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'text-emerald-300 font-extrabold'
              : 'text-emerald-600/70 hover:text-emerald-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            activeTab === 'profile' ? 'bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.3)]' : ''
          }`}>
            <UserIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Perfil</span>
        </button>
      </div>
    </div>
  );
};
