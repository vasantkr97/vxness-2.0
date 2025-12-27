
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, type ISeriesApi } from 'lightweight-charts';
import { useCandles } from '../hooks/useCandles';

interface ChartProps {
  asset: string;
}

const TIMEFRAMES = ['1m', '5m', '30m', '1h', '4h', '1d', '1w'];

export const Chart: React.FC<ChartProps> = ({ asset }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [series, setSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [timeFrame, setTimeFrame] = useState('1h');

 
  const { data: candles, isLoading, isError } = useCandles(asset, timeFrame);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartInstance = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111113' }, 
        textColor: '#71717a',
      },
      grid: {
        vertLines: { color: '#242428' },
        horzLines: { color: '#242428' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: '#242428',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#242428',
      },
    });

    const candlestickSeries = chartInstance.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });


    setSeries(candlestickSeries);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chartInstance.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.remove();
    };
  }, []);

 
  useEffect(() => {
    if (!series || !candles) return;

    const formattedData = candles.map((c: any) => {
      
      let time = c.time;
      if (typeof time === 'string') {
        
        time = Math.floor(new Date(time).getTime() / 1000);
      } else if (typeof time === 'number' && time > 1e12) {
        
        time = Math.floor(time / 1000);
      }

      return {
        time: time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      };
    }).sort((a: any, b: any) => (a.time as number) - (b.time as number));

    series.setData(formattedData);
  }, [series, candles]);

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600/50 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-dark-600/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg text-white">{asset}</h2>
          
          <div className="flex gap-1 bg-dark-700/50 p-1 rounded-lg overflow-x-auto max-w-full">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${timeFrame === tf
                    ? 'bg-dark-600 text-white shadow-sm'
                    : 'text-muted hover:text-white hover:bg-dark-600/50'
                  }`}
              >
                {tf.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="hidden sm:flex gap-2 text-sm text-muted">
          {isLoading ? (
            <span>Loading chart data...</span>
          ) : isError ? (
            <span className="text-danger">Failed to load chart</span>
          ) : (
            <>
            </>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full min-h-[400px]" />
    </div>
  );
};
