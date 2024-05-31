import type { ValueGetterFunc } from 'ag-grid-community';

export const quantityCalculator: ValueGetterFunc = (params) => {
    return params.data.available + params.data.unavailable;
};
