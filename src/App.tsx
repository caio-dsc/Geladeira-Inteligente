import React, { useState, useEffect, useCallback } from 'react';
import { 
  NavigationTab, 
  User, 
  FoodItem, 
  RecipeMatch 
} from './types';
import { authService } from './services/authService';
import { foodService } from './services/foodService';
import { recipeService } from './services/recipeService';

import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { LoadingState } from './components/common/LoadingState';
import { CreditsModal } from './components/common/CreditsModal';

import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { ScannerView } from './components/views/ScannerView';
import { InventoryView } from './components/views/InventoryView';
import { RecipesView } from './components/views/RecipesView';
import { ProfileView } from './components/views/ProfileView';

import { FoodFormModal } from './components/food/FoodFormModal';
import { RecipeDetailModal } from './components/recipe/RecipeDetailModal';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Re-calculate recipes match when inventory changes
  const updateRecipeMatches = useCallback(async (currentInventory: FoodItem[]) => {
    try {
      const matches = await recipeService.getMatchingRecipes(currentInventory);
      setRecipes(matches);
    } catch (e) {
      console.error('Erro ao calcular receitas:', e);
    }
  }, []);

  // Initialize data subscriptions
  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeFood: (() => void) | undefined;

    const init = async () => {
      try {
        setIsLoading(true);
        unsubscribeAuth = authService.subscribe((updatedUser) => {
          setUser(updatedUser);
        });

        unsubscribeFood = foodService.subscribe(async (items) => {
          setInventory(items);
          await updateRecipeMatches(items);
        });
      } catch (err) {
        console.error('Erro na inicialização:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFood) unsubscribeFood();
    };
  }, [updateRecipeMatches]);

  // Auth Handlers
  const handleLogin = async () => {
    const loggedUser = await authService.signInWithGoogle();
    setUser(loggedUser);
    setActiveTab('dashboard');
    showToast(`Bem-vindo, ${loggedUser.name}!`);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
    setActiveTab('dashboard');
  };

  // Inventory CRUD Handlers
  const handleSaveFood = async (foodData: Omit<FoodItem, 'id' | 'addedAt'>) => {
    if (editingFoodItem) {
      await foodService.updateItem(editingFoodItem.id, foodData);
      showToast(`"${foodData.name}" atualizado com sucesso!`);
    } else {
      await foodService.addItem(foodData);
      showToast(`"${foodData.name}" adicionado à geladeira!`);
    }
    setEditingFoodItem(null);
    setIsFoodModalOpen(false);
  };

  const handleDeleteFood = async (id: string) => {
    const item = inventory.find((i) => i.id === id);
    const confirmed = window.confirm(`Deseja realmente remover "${item?.name || 'este item'}" da sua geladeira?`);
    if (confirmed) {
      await foodService.deleteItem(id);
      showToast('Item removido com sucesso.');
    }
  };

  const handleResetDefaultInventory = async () => {
    const confirmed = window.confirm('Deseja restaurar a lista inicial de alimentos de demonstração?');
    if (confirmed) {
      await foodService.resetToDefault();
      showToast('Lista de demonstração restaurada.');
    }
  };

  const handleAddCredits = async (amount: number) => {
    await authService.addCredits(amount);
    showToast(`+${amount} créditos adicionados com sucesso!`);
  };

  if (isLoading) {
    return <LoadingState message="Inicializando Geladeira Inteligente..." fullscreen />;
  }

  // If user is not logged in, display the LoginView
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#05130b] text-emerald-100 flex flex-col selection:bg-emerald-500 selection:text-stone-950 font-sans antialiased relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[300px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onSignOut={handleSignOut}
        onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-8 relative z-10">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            inventory={inventory}
            recipes={recipes}
            onNavigate={setActiveTab}
            onOpenFoodModal={() => {
              setEditingFoodItem(null);
              setIsFoodModalOpen(true);
            }}
            onSelectRecipe={setSelectedRecipe}
            onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
          />
        )}

        {activeTab === 'scanner' && (
          <ScannerView
            userCredits={user.credits}
            onDeductCredit={async (amount) => {
              try {
                await authService.deductCredit(amount);
                return true;
              } catch {
                return false;
              }
            }}
            onItemsAdded={(count) => {
              showToast(`${count} alimentos adicionados à sua geladeira!`);
            }}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            onOpenAddModal={() => {
              setEditingFoodItem(null);
              setIsFoodModalOpen(true);
            }}
            onEditItem={(item) => {
              setEditingFoodItem(item);
              setIsFoodModalOpen(true);
            }}
            onDeleteItem={handleDeleteFood}
            onResetDefault={handleResetDefaultInventory}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            inventory={inventory}
            onSelectRecipe={setSelectedRecipe}
            onNavigateToInventory={() => setActiveTab('inventory')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            onSignOut={handleSignOut}
            onUpdateUser={setUser}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inventoryCount={inventory.length}
      />

      {/* Modals */}
      <FoodFormModal
        isOpen={isFoodModalOpen}
        onClose={() => {
          setIsFoodModalOpen(false);
          setEditingFoodItem(null);
        }}
        onSave={handleSaveFood}
        initialData={editingFoodItem}
      />

      <RecipeDetailModal
        recipe={selectedRecipe}
        isOpen={Boolean(selectedRecipe)}
        onClose={() => setSelectedRecipe(null)}
      />

      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        credits={user.credits}
        onAddCredits={handleAddCredits}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 bg-[#0b281b] text-white px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.35)] border border-emerald-400/40 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 p-1 text-emerald-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
