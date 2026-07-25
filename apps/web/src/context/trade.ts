import { createContext } from 'react';

export interface TradeContextValue {
  currentAsset: string;
  setAsset: (asset: string) => void;
}

export const TradeContext = createContext<TradeContextValue | undefined>(undefined);
