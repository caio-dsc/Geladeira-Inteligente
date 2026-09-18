import React from 'react';
import { NavigationTab, User } from '../../types';
import { CreditBadge } from '../common/CreditBadge';
import { AppLogo } from '../common/AppLogo';
import { 
  Home, 
  Camera, 
  UtensilsCrossed, 
  ShoppingCart, 
  BookOpen, 
  User as UserIcon,
  ShieldCheck, 
  LogOut,
  Sparkles,
  Lock
} from 'lucide-react';

export interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  user: User | null;
  onSignOut: () => void;
  onOpenUpgradeModal?: () => void;
  onOpenCreditsModal?: () => void;
  onBlockedTabClick?: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  user,
  onSignOut,
  onOpenUpgradeModal,
  onOpenCreditsModal,
  onBlockedTabClick,
}) => {
  const handleUpgradeClick = onOpenUpgradeModal || onOpenCreditsModal;
  const isFreeUser = Boolean(user && !user.isAdmin && !user.scanEnabled);

  const isTabBlockedForUser = (tab: NavigationTab) => {
    if (!isFreeUser) return false;
    return tab === 'scanner' || tab === 'shoppingList' || tab === 'recipes';
  };

  const handleTabClick = (tab: NavigationTab) => {
    if (isTabBlockedForUser(tab)) {
      if (onBlockedTabClick) {
        onBlockedTabClick(tab);
      } else if (handleUpgradeClick) {
        handleUpgradeClick();
      }
      return;
    }
    onTabChange(tab);
  };

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Início', icon: Home, isPremiumOnly: false },
    { id: 'inventory' as NavigationTab, label: 'Minha Geladeira', icon: UtensilsCrossed, isPremiumOnly: false },
    { id: 'scanner' as NavigationTab, label: 'Scanner', icon: Camera, isPremiumOnly: true },
    { id: 'shoppingList' as NavigationTab, label: 'Lista de Mercado', icon: ShoppingCart, isPremiumOnly: true },
    { id: 'recipes' as NavigationTab, label: 'Receitas', icon: BookOpen, isPremiumOnly: true },
    { id: 'profile' as NavigationTab, label: 'Perfil', icon: UserIcon, isPremiumOnly: false },
    ...(user?.isAdmin ? [{ id: 'admin' as NavigationTab, label: 'Admin', icon: ShieldCheck, isPremiumOnly: false }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-border shadow-subtle transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand logo & title with custom symbol */}
        <div 
          onClick={() => onTabChange('dashboard')}
          className="cursor-pointer select-none group focus-visible:outline-hidden"
        >
          <AppLogo size="md" />
        </div>

        {/* Desktop navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-muted p-1 rounded-xl border border-border">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isBlocked = isFreeUser && item.isPremiumOnly;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                  isActive
                    ? 'bg-surface text-primary shadow-subtle font-bold border border-border/70'
                    : isBlocked
                    ? 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                }`}
                title={isBlocked ? `${item.label} (Recurso Premium - Bloqueado)` : item.label}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                <span>{item.label}</span>
                {isBlocked && (
                  <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-100/90 border border-amber-300/80 px-1.5 py-0.2 rounded-md font-bold">
                    <Lock className="w-2.5 h-2.5 mr-0.5" />
                    Premium
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right action area: credits & user profile */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <CreditBadge
                scanEnabled={user.scanEnabled}
                isAdmin={user.isAdmin}
                onClick={handleUpgradeClick}
                size="sm"
              />

              {/* Mobile Shopping List button */}
              <button
                onClick={() => handleTabClick('shoppingList')}
                className={`relative md:hidden p-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'shoppingList'
                    ? 'border-primary/50 bg-primary/10 text-primary shadow-subtle'
                    : 'border-border bg-surface hover:bg-surface-muted text-text-secondary hover:text-text-primary'
                }`}
                title={isFreeUser ? 'Lista de Mercado (Recurso Premium)' : 'Lista de Mercado'}
                aria-label="Abrir Lista de Mercado"
              >
                <ShoppingCart className="w-4 h-4" />
                {isFreeUser && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black shadow-subtle">
                    <Lock className="w-2 h-2" />
                  </span>
                )}
              </button>

              {/* User avatar / profile button */}
              <button
                onClick={() => onTabChange('profile')}
                className={`flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-full border transition-all text-left group cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/10 shadow-subtle'
                    : 'border-border hover:border-primary/30 bg-surface hover:bg-surface-muted shadow-subtle'
                }`}
                title="Abrir perfil"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-border group-hover:scale-105 transition-transform"
                />
                <span className="hidden sm:inline text-xs font-semibold text-text-primary max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
