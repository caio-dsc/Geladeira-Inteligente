import React from 'react';
import { NavigationTab } from '../../types';
import { 
  Home, 
  Camera, 
  UtensilsCrossed, 
  BookOpen, 
  User as UserIcon,
  Lock
} from 'lucide-react';

export interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  inventoryCount?: number;
  isFreeUser?: boolean;
  onBlockedTabClick?: (tab: NavigationTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  inventoryCount = 0,
  isFreeUser = false,
  onBlockedTabClick,
}) => {
  const handleTabClick = (tab: NavigationTab) => {
    if (isFreeUser && (tab === 'scanner' || tab === 'recipes')) {
      if (onBlockedTabClick) {
        onBlockedTabClick(tab);
      }
      return;
    }
    onTabChange(tab);
  };

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/92 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-2px_rgba(16,32,28,0.06)] px-2 py-1.5"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Início */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 motion-reduce:transform-none select-none ${
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
          onClick={() => handleTabClick('inventory')}
          className={`relative min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 motion-reduce:transform-none select-none ${
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
          onClick={() => handleTabClick('scanner')}
          className="relative -top-3.5 flex flex-col items-center justify-center group focus-visible:outline-hidden cursor-pointer select-none"
          aria-label={isFreeUser ? "Escanear geladeira (Recurso Premium)" : "Escanear geladeira"}
        >
          <div className={`relative w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-95 motion-reduce:transform-none shadow-soft border ${
            activeTab === 'scanner'
              ? 'bg-primary text-white shadow-elevated border-primary-dark/20 scale-105 ring-3 ring-primary/20'
              : isFreeUser
              ? 'bg-[#10705c] hover:bg-primary text-white border-primary-dark/25'
              : 'bg-primary hover:bg-[#138a72] text-white border-primary-dark/15 hover:scale-105'
          }`}>
            <Camera className="w-6 h-6" />
            {isFreeUser && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-subtle border-2 border-surface">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-0.5 font-bold transition-colors flex items-center gap-0.5 ${
            activeTab === 'scanner' ? 'text-primary' : 'text-text-secondary'
          }`}>
            <span>Escanear</span>
            {isFreeUser && <Lock className="w-2.5 h-2.5 text-amber-600" />}
          </span>
        </button>

        {/* Receitas */}
        <button
          onClick={() => handleTabClick('recipes')}
          className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 motion-reduce:transform-none select-none ${
            activeTab === 'recipes'
              ? 'text-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className={`relative p-1 rounded-lg transition-all duration-150 ${
            activeTab === 'recipes' ? 'bg-primary/10 text-primary' : 'text-text-secondary'
          }`}>
            <BookOpen className="w-5 h-5" />
            {isFreeUser && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <Lock className="w-2 h-2" />
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${isFreeUser ? 'text-text-secondary' : ''}`}>
            <span>Receitas</span>
            {isFreeUser && <Lock className="w-2 h-2 text-amber-600" />}
          </span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => handleTabClick('profile')}
          className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 motion-reduce:transform-none select-none ${
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
