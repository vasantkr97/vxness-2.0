import { useContext } from 'react';
import { TradeContext } from '../context/trade';

export const useTrade = () => {
  const context = useContext(TradeContext);

  if (context === undefined) {
    throw new Error('useTrade must be used within a TradeProvider');
  }

  return context;
};
