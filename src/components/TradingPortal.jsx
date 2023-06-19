import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { priceData } from './priceData/priceData';

function TradingPortal() {
    const chartContainerRef = useRef();
    const chart = useRef();
    const resizeObserver = useRef();

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            layout: {
                backgroundColor: '#253248',
                textColor: 'rgba(255, 255, 255, 0.9)',
            },
            grid: {
                vertLines: {
                    color: '#334158',
                },
                horzLines: {
                    color: '#334158'
                },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            priceScale: {
                borderColor: '#485c7b'
            },
            timeScale: {
                borderColor: '#485c7b'
            },
        });

        const candleSeries = chart.current.addCandlestickSeries({
            upColor: '#4bffb5',
            downColor: '#ff4976',
            borderDownColor: '#ff4976',
            borderUpColor: '#4bffb5',
            wickDownColor: '#838ca1',
            wickUpColor: '#838ca1'
        });

        candleSeries.setData(priceData);
    }, []);

    useEffect(() => {
        resizeObserver.current = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            chart.current.resize(width, height);
        });

        resizeObserver.current.observe(chartContainerRef.current);

        return () => resizeObserver.current.disconnect();
    }, []);

  return (
    <div id='TradingPortal' className='w-full h-screen'>
        <div className='p-4 w-full h-full mx-auto p-2 flex justify-center items-center text-white'>
            <div ref={chartContainerRef} className='w-full h-full' />
        </div>
    </div>
  )
}

export default TradingPortal
