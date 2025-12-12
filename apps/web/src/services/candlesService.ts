
import api from '../lib/api';
import type { Candle } from '../types';

export const candlesService = {
  get: async (asset: string, timeFrame: string): Promise<Candle[]> => {
    // Convert BTC -> BTCUSDT format
    const assetKey = asset.toUpperCase();
    const formattedAsset = assetKey.includes('USDT') ? assetKey : `${assetKey}USDT`;
    
    const response = await api.get<{ data: Candle[] }>('/candles', {
      params: { asset: formattedAsset, timeFrame },
    });
    return response.data.data;
  },
};
