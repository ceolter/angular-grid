import type { ValueGetterFunc } from 'ag-grid-community';

import type { PortfolioItem } from '../../types';

export const costCalculator: ValueGetterFunc = (params) => {
    const rawCost = params.data.buyPrice * params.data.quantity;
    return rawCost.toFixed(2);
};

export const valueCalculator: ValueGetterFunc = (params) => {
    const rawValue = params.data.currentPrice * params.data.quantity;
    return rawValue.toFixed(2);
};

export const pnlCalculator: ValueGetterFunc = (params) => {
    const rawPnL = (params.data.currentPrice - params.data.buyPrice) * params.data.quantity;
    return rawPnL.toFixed(2);
};

export const pnlPercentCalculator: ValueGetterFunc = (params) => {
    const rawPnLPercentage = params.data.currentPrice / params.data.buyPrice - 1;
    return rawPnLPercentage.toFixed(2);
};

export const calculate52wChange: ValueGetterFunc<PortfolioItem> = (params) => {
    const data = params.data?.timeline;
    let sum = 0;

    if (data && data.length > 0) {
        data.forEach((item) => {
            sum += item.value;
        });
    }

    return sum;
};
