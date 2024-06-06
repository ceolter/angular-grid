export type Change = {
    value: number;
    time: Date;
};

export interface PortfolioItem {
    ticker: string;
    name: string;
    ccy: string;
    instrument: string;
    quantity: number;
    buyDate: string;
    buyPrice: number;
    currentPrice: number;
    time: Date;
    timeline: Change[];
}

export type BasePortfolioItem = Omit<PortfolioItem, 'currentPrice' | 'timeline' | 'time'>;
