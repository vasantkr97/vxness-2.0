import React, { useState } from 'react';
import { TradeContext } from './trade';

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentAsset, setAsset] = useState<string>('BTC');

    return (
        <TradeContext.Provider value={{ currentAsset, setAsset }}>
            {children}
        </TradeContext.Provider>
    );
};
