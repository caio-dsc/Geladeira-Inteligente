import React from 'react';

export interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const heightClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  return (
    <div className={`inline-flex items-center shrink-0 ${heightClasses[size]} ${className}`}>
      <img
        src="/Logo_GI.png"
        alt="Geladeira Inteligente - Alimentação & Receitas"
        className="h-full w-auto object-contain select-none pointer-events-none drop-shadow-xs"
      />
    </div>
  );
};
