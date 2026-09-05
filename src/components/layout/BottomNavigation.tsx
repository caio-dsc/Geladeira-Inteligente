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
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/92 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-2px_rgba(16,32,28,0.06)] px-2 py-1.5"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Início */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 select-none ${
            activeTab === 'dashboard'
              ? 'text-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all duration-150 ${
            activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-text-secondary'
          }`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Início</span>
        </button>

        {/* Minha geladeira */}
        <button
          onClick={() => onTabChange('inventory')}
          className={`relative min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 select-none ${
            activeTab === 'inventory'
              ? 'text-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all duration-150 ${
            activeTab === 'inventory' ? 'bg-primary/10 text-primary' : 'text-text-secondary'
          }`}>
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Geladeira</span>
          {inventoryCount > 0 && (
            <span className="absolute top-0.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-white font-bold text-[9px] flex items-center justify-center shadow-subtle">
              {inventoryCount}
            </span>
          )}
        </button>

        {/* Scanner Center Action Button */}
        <button
          onClick={() => onTabChange('scanner')}
          className="relative -top-3.5 flex flex-col items-center justify-center group focus-visible:outline-hidden cursor-pointer select-none"
          aria-label="Escanear geladeira"
        >
          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-95 shadow-soft border ${
            activeTab === 'scanner'
              ? 'bg-primary text-white shadow-elevated border-primary-dark/20 scale-105 ring-3 ring-primary/20'
              : 'bg-primary hover:bg-[#138a72] text-white border-primary-dark/15 hover:scale-105'
          }`}>
            <Camera className="w-6 h-6" />
          </div>
          <span className={`text-[10px] mt-0.5 font-bold transition-colors ${
            activeTab === 'scanner' ? 'text-primary' : 'text-text-secondary'
          }`}>
            Escanear
          </span>
        </button>

        {/* Receitas */}
        <button
          onClick={() => onTabChange('recipes')}
          className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 select-none ${
            activeTab === 'recipes'
              ? 'text-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all duration-150 ${
            activeTab === 'recipes' ? 'bg-primary/10 text-primary' : 'text-text-secondary'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Receitas</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => onTabChange('profile')}
          className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 select-none ${
            activeTab === 'profile'
              ? 'text-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all duration-150 ${
            activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-text-secondary'
          }`}>
            <UserIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Perfil</span>
        </button>
      </div>
    </div>
  );
};
