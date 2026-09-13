import React from 'react';
import { UpgradeModal, UpgradeModalProps } from './UpgradeModal';

export interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits?: number;
  onAddCredits?: (amount: number) => Promise<void>;
  onOpenFoodModal?: () => void;
  onNavigateToInventory?: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  onClose,
  onOpenFoodModal,
  onNavigateToInventory,
}) => {
  return (
    <UpgradeModal
      isOpen={isOpen}
      onClose={onClose}
      onOpenFoodModal={onOpenFoodModal}
      onNavigateToInventory={onNavigateToInventory}
    />
  );
};

