import type { ValueFormatterFunc } from '@ag-grid-community/core';

export const currencyFormatter: ValueFormatterFunc = (params) => {
    if (params.value == null) return '';

    const locale = 'en-US';
    if (!params.data) {
        return parseFloat(params.value).toFixed(2);
    }
    const currency = params.data.ccy;
    const numberFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    });

    return numberFormatter.format(params.value);
};

export const percentageFormatter: ValueFormatterFunc = (params) => {
    if (params.value == null) return '';
    return Math.round(params.value * 100) + '%';
};
