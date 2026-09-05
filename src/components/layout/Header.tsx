import React from 'react';
import { NavigationTab, User } from '../../types';
import { CreditBadge } from '../common/CreditBadge';
import { AppLogo } from '../common/AppLogo';
import { 
  Home, 
  Camera, 
  UtensilsCrossed, 
  BookOpen, 
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';

export interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  user: User | null;
  onSignOut: () => void;
  onOpenCreditsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  user,
  onSignOut,
  onOpenCreditsModal,
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Início', icon: Home },
    { id: 'scanner' as NavigationTab, label: 'Scanner', icon: Camera },
    { id: 'inventory' as NavigationTab, label: 'Minha Geladeira', icon: UtensilsCrossed },
    { id: 'recipes' as NavigationTab, label: 'Receitas', icon: BookOpen },
    { id: 'profile' as NavigationTab, label: 'Perfil', icon: UserIcon },
    ...(user?.isAdmin ? [{ id: 'admin' as NavigationTab, label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-border shadow-subtle transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand logo & title with custom symbol */}
        <div 
          onClick={() => onTabChange('dashboard')}
          className="cursor-pointer select-none group focus-visible:outline-hidden"
        >
          <AppLogo 
            size="md" 
            className="[&_.text-white]:!text-text-primary [&_.text-emerald-400]:!text-primary [&_.text-emerald-400\/80]:!text-text-secondary" 
          />
        </div>

        {/* Desktop navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-muted p-1 rounded-xl border border-border">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                  isActive
                    ? 'bg-surface text-primary shadow-subtle font-bold border border-border/70'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right action area: credits & user profile */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <CreditBadge
                credits={user.credits}
                onClick={onOpenCreditsModal}
                size="sm"
              />

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
