import type { BeanCollection, DetailGridInfo } from 'ag-grid-community';

import type { MasterDetailService } from './masterDetailService';

function operateOnStore<TCallbackResult>(
    beans: BeanCollection,
    callback: (store: { [id: string]: DetailGridInfo | undefined }) => TCallbackResult
): TCallbackResult | undefined {
    const store = (beans.masterDetailSvc as MasterDetailService | undefined)?.store;
    return store ? callback(store) : undefined;
}

export function addDetailGridInfo(beans: BeanCollection, id: string, gridInfo: DetailGridInfo): void {
    operateOnStore(beans, (store) => {
        store[id] = gridInfo;
    });
}

export function removeDetailGridInfo(beans: BeanCollection, id: string): void {
    operateOnStore(beans, (store) => {
        delete store[id];
    });
}

export function getDetailGridInfo(beans: BeanCollection, id: string): DetailGridInfo | undefined {
    return operateOnStore(beans, (store) => store[id]);
}

export function forEachDetailGridInfo(
    beans: BeanCollection,
    callback: (gridInfo: DetailGridInfo, index: number) => void
) {
    operateOnStore(beans, (store) => {
        let index = 0;
        Object.values(store).forEach((gridInfo: DetailGridInfo) => {
            // check for undefined, as old references will still be lying around
            if (gridInfo) {
                callback(gridInfo, index++);
            }
        });
    });
}
