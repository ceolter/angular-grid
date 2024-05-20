export function getData() {
    return [
        // Stocks
        {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            ccy: 'USD',
            instrument: 'Stock',
            quantity: 150,
            buyDate: '2023-03-15',
            buyPrice: 135.67,
            currentPrice: 145.23,
            change: [-0.12, 0.34, 0.22, -0.45, 0.67, 0.34, -0.29, 0.55, 0.76, -0.11, 0.22, 0.33],
        },
        {
            ticker: 'TSLA',
            name: 'Tesla Inc.',
            ccy: 'USD',
            instrument: 'Stock',
            quantity: 75,
            buyDate: '2023-04-01',
            buyPrice: 623.89,
            currentPrice: 710.45,
            change: [0.22, -0.56, 0.14, 0.33, -0.22, 0.45, 0.78, 0.15, -0.34, 0.56, 0.22, 0.67],
        },
        {
            ticker: 'NFLX',
            name: 'Netflix Inc.',
            ccy: 'USD',
            instrument: 'Stock',
            quantity: 60,
            buyDate: '2023-02-20',
            buyPrice: 498.45,
            currentPrice: 540.67,
            change: [-0.45, 0.12, 0.33, 0.44, -0.56, 0.22, 0.34, 0.67, -0.12, 0.45, 0.33, -0.22],
        },
        {
            ticker: 'NVDA',
            name: 'NVIDIA Corporation',
            ccy: 'USD',
            instrument: 'Stock',
            quantity: 90,
            buyDate: '2023-01-10',
            buyPrice: 245.56,
            currentPrice: 265.34,
            change: [0.34, 0.22, -0.12, 0.56, 0.33, 0.44, 0.22, -0.45, 0.67, 0.12, -0.33, 0.45],
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
            currentPrice: 68.90,
            change: [0.67, -0.22, 0.34, 0.22, 0.44, -0.45, 0.33, 0.56, 0.78, 0.12, -0.34, 0.22],
        },
        {
            ticker: 'GOLD',
            name: 'Gold Futures',
            ccy: 'USD',
            instrument: 'Future',
            quantity: 55,
            buyDate: '2023-06-15',
            buyPrice: 1800.45,
            currentPrice: 1850.67,
            change: [0.22, 0.33, -0.45, 0.56, 0.67, -0.12, 0.34, 0.22, 0.44, 0.33, 0.22, 0.56],
        },
        {
            ticker: 'SILVER',
            name: 'Silver Futures',
            ccy: 'USD',
            instrument: 'Future',
            quantity: 65,
            buyDate: '2023-07-10',
            buyPrice: 24.56,
            currentPrice: 26.34,
            change: [0.33, 0.22, 0.44, -0.56, 0.67, 0.12, 0.34, 0.22, 0.45, -0.12, 0.33, 0.22],
        },
        {
            ticker: 'EURUSD',
            name: 'Euro to US Dollar',
            ccy: 'USD',
            instrument: 'Forex',
            quantity: 65,
            buyDate: '2023-07-10',
            buyPrice: 24.56,
            currentPrice: 26.34,
            change: [0.33, 0.22, 0.44, -0.56, 0.67, 0.12, 0.34, 0.22, 0.45, -0.12, 0.33, 0.22],
        },
        {
            ticker: 'GBPUSD',
            name: 'Sterling to US Dollar',
            ccy: 'USD',
            instrument: 'Forex',
            quantity: 65,
            buyDate: '2023-07-10',
            buyPrice: 24.56,
            currentPrice: 26.34,
            change: [0.33, 0.22, 0.44, -0.56, 0.67, 0.12, 0.34, 0.22, 0.45, -0.12, 0.33, 0.22],
        },
        {
            ticker: 'USDJPY',
            name: 'US Dollar to Japanese Yen',
            ccy: 'USD',
            instrument: 'Forex',
            quantity: 65,
            buyDate: '2023-07-10',
            buyPrice: 24.56,
            currentPrice: 26.34,
            change: [0.33, 0.22, 0.44, -0.56, 0.67, 0.12, 0.34, 0.22, 0.45, -0.12, 0.33, 0.22],
        },
        {
            ticker: 'BTC',
            name: 'Bitcoin',
            ccy: 'USD',
            instrument: 'Crypto',
            quantity: 65,
            buyDate: '2023-07-10',
            buyPrice: 24.56,
            currentPrice: 26.34,
            change: [0.33, 0.22, 0.44, -0.56, 0.67, 0.12, 0.34, 0.22, 0.45, -0.12, 0.33, 0.22],
        },
        {
            ticker: 'ETH',
            name: 'Ethereum',
            ccy: 'USD',
            instrument: 'Crypto',
            quantity: 65,
            buyDate: '2023-07-10',
            buyPrice: 24.56,
            currentPrice: 26.34,
            change: [0.33, 0.22, 0.44, -0.56, 0.67, 0.12, 0.34, 0.22, 0.45, -0.12, 0.33, 0.22],
        },
    ];
}