import type { ValueGetterFunc } from '@ag-grid-community/core';

export const quantityCalculator: ValueGetterFunc = (params) => {
    return params.data.available + params.data.unavailable;
};
