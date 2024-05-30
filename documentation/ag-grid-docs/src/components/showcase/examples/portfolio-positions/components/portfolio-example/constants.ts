import type { BasePortfolioItem } from '../../../types';

/**
 * How often the data updates (ms)
 */
export const UPDATE_INTERVAL = 60;

/**
 * Multiplier for how often to update
 */
export const INITIAL_UPDATE_INTERVAL_MULTIPLIER = 1;

/**
 * All base portfolio data for generated data
 */
export const PORTFOLIO_DATA: BasePortfolioItem[] = [
    // Stocks
    {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        ccy: 'USD',
        instrument: 'Stock',
        quantity: 150,
        buyDate: '2023-03-15',
        buyPrice: 135.67,
    },
    {
        ticker: 'TSLA',
        name: 'Tesla Inc.',
        ccy: 'USD',
        instrument: 'Stock',
        quantity: 75,
        buyDate: '2023-04-01',
        buyPrice: 623.89,
    },
    {
        ticker: 'NFLX',
        name: 'Netflix Inc.',
        ccy: 'USD',
        instrument: 'Stock',
        quantity: 60,
        buyDate: '2023-02-20',
        buyPrice: 498.45,
    },
    {
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        ccy: 'USD',
        instrument: 'Stock',
        quantity: 90,
        buyDate: '2023-01-10',
        buyPrice: 245.56,
    },

    // Futures
    {
        ticker: 'USOIL',
        name: 'Crude Oil WTI Futures',
        ccy: 'USD',
        instrument: 'Future',
        quantity: 40,
        buyDate: '2023-05-25',
        buyPrice: 65.78,
    },
    {
        ticker: 'GOLD',
        name: 'Gold Futures',
        ccy: 'USD',
        instrument: 'Future',
        quantity: 55,
        buyDate: '2023-06-15',
        buyPrice: 1800.45,
    },
    {
        ticker: 'SILVER',
        name: 'Silver Futures',
        ccy: 'USD',
        instrument: 'Future',
        quantity: 65,
        buyDate: '2023-07-10',
        buyPrice: 24.56,
    },
    {
        ticker: 'EURUSD',
        name: 'Euro to US Dollar',
        ccy: 'USD',
        instrument: 'Forex',
        quantity: 65,
        buyDate: '2023-07-10',
        buyPrice: 24.56,
    },
    {
        ticker: 'GBPUSD',
        name: 'Sterling to US Dollar',
        ccy: 'USD',
        instrument: 'Forex',
        quantity: 65,
        buyDate: '2023-07-10',
        buyPrice: 24.56,
    },
    {
        ticker: 'USDJPY',
        name: 'US Dollar to Japanese Yen',
        ccy: 'USD',
        instrument: 'Forex',
        quantity: 65,
        buyDate: '2023-07-10',
        buyPrice: 24.56,
    },
    {
        ticker: 'BTC',
        name: 'Bitcoin',
        ccy: 'USD',
        instrument: 'Crypto',
        quantity: 65,
        buyDate: '2023-07-10',
        buyPrice: 24.56,
    },
    {
        ticker: 'ETH',
        name: 'Ethereum',
        ccy: 'USD',
        instrument: 'Crypto',
        quantity: 65,
        buyDate: '2023-07-10',
        buyPrice: 24.56,
    },
];

/**
 * Maximum number for data values
 */
export const MAX_NUMBER = 2000;

/**
 * Number of values for timeline sparkline
 */
export const TIMELINE_SIZE = 20;
