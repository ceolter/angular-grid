import type { BeanCollection, DetailGridInfo } from 'ag-grid-community';

export function addDetailGridInfo(beans: BeanCollection, id: string, gridInfo: DetailGridInfo): void {
    beans.detailGridApiSvc?.addDetailGridInfo(id, gridInfo);
}

export function removeDetailGridInfo(beans: BeanCollection, id: string): void {
    beans.detailGridApiSvc?.removeDetailGridInfo(id);
}

export function getDetailGridInfo(beans: BeanCollection, id: string): DetailGridInfo | undefined {
    return beans.detailGridApiSvc?.getDetailGridInfo(id);
}

export function forEachDetailGridInfo(
    beans: BeanCollection,
    callback: (gridInfo: DetailGridInfo, index: number) => void
) {
    beans.detailGridApiSvc?.forEachDetailGridInfo(callback);
}
