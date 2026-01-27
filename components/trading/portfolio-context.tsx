'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit';
  createdAt: Date;
}

export interface PortfolioState {
  usdtBalance: number;
  positions: Position[];
  // Calculated
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
}

interface PortfolioContextType extends PortfolioState {
  addPosition: (position: Omit<Position, 'id' | 'createdAt'>) => void;
  removePosition: (id: string) => void;
  updatePrices: (prices: Record<string, number>) => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
}

const defaultState: PortfolioState = {
  usdtBalance: 10000, // Start with 10,000 USDT
  positions: [],
  totalValue: 10000,
  totalPnL: 0,
  totalPnLPercent: 0,
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortfolioState>(defaultState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('portfolio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          ...parsed,
          positions: parsed.positions.map((p: Position) => ({
            ...p,
            createdAt: new Date(p.createdAt),
          })),
        });
      } catch (e) {
        console.error('Failed to load portfolio:', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(state));
  }, [state]);

  // Recalculate totals
  const calculateTotals = (positions: Position[], usdtBalance: number): Partial<PortfolioState> => {
    const positionsValue = positions.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0);
    const positionsCost = positions.reduce((sum, p) => sum + (p.quantity * p.avgPrice), 0);
    const totalValue = usdtBalance + positionsValue;
    const totalPnL = positionsValue - positionsCost;
    const totalPnLPercent = positionsCost > 0 ? (totalPnL / positionsCost) * 100 : 0;
    
    return { totalValue, totalPnL, totalPnLPercent };
  };

  const addPosition = (newPos: Omit<Position, 'id' | 'createdAt'>) => {
    setState(prev => {
      const cost = newPos.quantity * newPos.currentPrice;
      if (cost > prev.usdtBalance) {
        console.error('Insufficient balance');
        return prev;
      }

      // Check if position exists
      const existingIdx = prev.positions.findIndex(p => p.symbol === newPos.symbol);
      let newPositions: Position[];
      
      if (existingIdx >= 0) {
        // Average down/up
        const existing = prev.positions[existingIdx];
        const totalQty = existing.quantity + newPos.quantity;
        const totalCost = (existing.quantity * existing.avgPrice) + (newPos.quantity * newPos.currentPrice);
        const newAvgPrice = totalCost / totalQty;
        
        newPositions = [...prev.positions];
        newPositions[existingIdx] = {
          ...existing,
          quantity: totalQty,
          avgPrice: newAvgPrice,
          currentPrice: newPos.currentPrice,
        };
      } else {
        const position: Position = {
          ...newPos,
          id: `${newPos.symbol}-${Date.now()}`,
          createdAt: new Date(),
        };
        newPositions = [...prev.positions, position];
      }

      const newBalance = prev.usdtBalance - cost;
      return {
        ...prev,
        positions: newPositions,
        usdtBalance: newBalance,
        ...calculateTotals(newPositions, newBalance),
      };
    });
  };

  const removePosition = (id: string) => {
    setState(prev => {
      const position = prev.positions.find(p => p.id === id);
      if (!position) return prev;

      const proceeds = position.quantity * position.currentPrice;
      const newPositions = prev.positions.filter(p => p.id !== id);
      const newBalance = prev.usdtBalance + proceeds;

      return {
        ...prev,
        positions: newPositions,
        usdtBalance: newBalance,
        ...calculateTotals(newPositions, newBalance),
      };
    });
  };

  const updatePrices = (prices: Record<string, number>) => {
    setState(prev => {
      const newPositions = prev.positions.map(p => ({
        ...p,
        currentPrice: prices[p.symbol] ?? p.currentPrice,
      }));
      
      return {
        ...prev,
        positions: newPositions,
        ...calculateTotals(newPositions, prev.usdtBalance),
      };
    });
  };

  const deposit = (amount: number) => {
    setState(prev => {
      const newBalance = prev.usdtBalance + amount;
      return {
        ...prev,
        usdtBalance: newBalance,
        ...calculateTotals(prev.positions, newBalance),
      };
    });
  };

  const withdraw = (amount: number) => {
    setState(prev => {
      if (amount > prev.usdtBalance) return prev;
      const newBalance = prev.usdtBalance - amount;
      return {
        ...prev,
        usdtBalance: newBalance,
        ...calculateTotals(prev.positions, newBalance),
      };
    });
  };

  return (
    <PortfolioContext.Provider value={{
      ...state,
      addPosition,
      removePosition,
      updatePrices,
      deposit,
      withdraw,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
