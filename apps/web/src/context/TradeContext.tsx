import React, { createContext, useContext, useState } from 'react';

interface TradeContextType {
    currentAsset: string;
    setAsset: (asset: string) => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentAsset, setAsset] = useState<string>('BTC');

    return (
        <TradeContext.Provider value={{ currentAsset, setAsset }}>
            {children}
        </TradeContext.Provider>
    );
};

export const useTrade = () => {
    const context = useContext(TradeContext);
    if (context === undefined) {
        throw new Error('useTrade must be used within a TradeProvider');
    }
    return context;
};
