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
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#05130b]/85 backdrop-blur-xl border-b border-emerald-500/15 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand logo & title with custom symbol */}
        <div 
          onClick={() => onTabChange('dashboard')}
          className="cursor-pointer select-none group"
        >
          <AppLogo size="md" />
        </div>

        {/* Desktop navigation tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#081e13]/80 p-1.5 rounded-2xl border border-emerald-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-950' : 'text-emerald-400'}`} />
                {item.label}
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
                className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-full border border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 transition-all text-left group cursor-pointer"
                title="Abrir perfil"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-400/40 group-hover:scale-105 transition-transform"
                />
                <span className="hidden sm:inline text-xs font-bold text-emerald-100 max-w-[90px] truncate">
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
