
import { useQuery } from '@tanstack/react-query';
import { candlesService } from '../services/candlesService';

export const useCandles = (asset: string, timeFrame: string) => {
  return useQuery({
    queryKey: ['candles', asset, timeFrame],
    queryFn: () => candlesService.get(asset, timeFrame),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    enabled: !!asset && !!timeFrame,
  });
};
