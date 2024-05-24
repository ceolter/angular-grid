export const costCalculator = (params) => {
    const rawCost = params.data.buyPrice * params.data.quantity;
    return rawCost.toFixed(2);
};

export const valueCalculator = (params) => {
    const rawValue = params.data.currentPrice * params.data.quantity;
    return rawValue.toFixed(2);
};

export const pnlCalculator = (params) => {
    const rawPnL = (params.data.currentPrice - params.data.buyPrice) * params.data.quantity;
    return rawPnL.toFixed(2);
};

export const pnlPercentCalculator = (params) => {
    const rawPnLPercentage = params.data.currentPrice / params.data.buyPrice - 1;
    return rawPnLPercentage.toFixed(2);
};

export function currencyFormatter(params) {
    if (params.value == null) return '';
    if (params.data.ccy === 'USD') return '$' + params.value;
    if (params.data.ccy === 'JPY') return '¥' + params.value;
    if (params.data.ccy === 'GBP') return '£' + params.value;
    if (params.data.ccy === 'EUR') return '€' + params.value;
}

export function percentageFormatter(params) {
    if (params.value == null) return '';
    return Math.round(params.value * 100) + '%';
}

export function calculate52wChange(params) {
    const data = params.data.change;
    let sum = 0;

    if (data && data.length > 0) {
        data.forEach((item) => {
            sum += item;
        });
    }

    return sum;
}
