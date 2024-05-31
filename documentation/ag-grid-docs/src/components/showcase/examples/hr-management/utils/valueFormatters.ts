import type { ValueFormatterFunc } from 'ag-grid-community';

export const currencyFormatter: ValueFormatterFunc = (params) => {
    if (params.value == null) return '';

    const locale = 'en-US';
    if (!params.data) {
        return parseFloat(params.value).toFixed(2);
    }
    const currency = params.data.currency;
    const numberFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    });

    return numberFormatter.format(params.value);
};
