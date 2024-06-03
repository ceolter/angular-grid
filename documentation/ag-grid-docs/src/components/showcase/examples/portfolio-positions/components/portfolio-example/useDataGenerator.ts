import { type AgGridReact } from '@ag-grid-community/react';
import { type RefObject, useMemo } from 'react';

import { type PortfolioItem } from '../../../types';
import { createGenerator } from '../../utils/dataGenerator';
import { INITIAL_UPDATE_INTERVAL_MULTIPLIER, UPDATE_INTERVAL } from './constants';
import { generatePortfolioItemUpdate } from './data';

export function useDataGenerator({
    gridRef,
    rowData,
    setRowData,
}: {
    gridRef: RefObject<AgGridReact>;
    rowData: PortfolioItem[];
    setRowData: (rowData: PortfolioItem[]) => void;
}) {
    return useMemo(
        () =>
            createGenerator({
                interval: UPDATE_INTERVAL / INITIAL_UPDATE_INTERVAL_MULTIPLIER,
                callback: () => {
                    const gridApi = gridRef.current?.api;
                    if (!gridApi) {
                        return;
                    }

                    const randomIndex = Math.floor(Math.random() * rowData.length);
                    const portfolioItemToUpdate = rowData[randomIndex];
                    const newItem = generatePortfolioItemUpdate(portfolioItemToUpdate);
                    rowData[randomIndex] = newItem;
                    setRowData(rowData);

                    gridApi.applyTransactionAsync({
                        update: [newItem],
                    });
                },
            }),
        []
    );
}
