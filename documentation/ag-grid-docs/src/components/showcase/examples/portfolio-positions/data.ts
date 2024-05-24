import { MAX_NUMBER, PORTFOLIO_DATA, TIMELINE_SIZE } from './constants';
import { randomNumber, randomNumberList } from './generator-utils';
import type { BasePortfolioItem, PortfolioItem } from './types';

function randomValue() {
    return randomNumber(MAX_NUMBER);
}

function generateRandomPortfolioItem(item: BasePortfolioItem): PortfolioItem {
    const currentPrice = randomValue();
    const initialTimelineLength = TIMELINE_SIZE - 1;
    const previousTimeInterval = 1000;
    const timeline = randomNumberList({
        length: initialTimelineLength,
        maxNumber: MAX_NUMBER,
    }).map((value, index) => {
        const time = new Date(Date.now() - (initialTimelineLength - index + 1) * previousTimeInterval);
        return {
            value,
            time,
        };
    });
    const time = new Date();

    timeline.push({
        value: currentPrice,
        time,
    });

    return {
        ...item,
        currentPrice,
        time,
        timeline,
    };
}

export function generatePortfolioItemUpdate(portfolioItem: PortfolioItem): PortfolioItem {
    const currentPrice = randomValue();
    const time = new Date();
    const timeline = portfolioItem.timeline.slice(1, portfolioItem.timeline.length);
    timeline.push({
        value: currentPrice,
        time,
    });

    const newPortfolioItem = Object.assign({}, portfolioItem, {
        currentPrice,
        time,
        timeline,
    });

    return newPortfolioItem;
}

export function generatePortfolio(): PortfolioItem[] {
    return PORTFOLIO_DATA.map(generateRandomPortfolioItem);
}
