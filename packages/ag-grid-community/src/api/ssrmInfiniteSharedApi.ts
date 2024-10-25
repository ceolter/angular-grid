import type { BeanCollection } from '../context/context';
import { _isServerSideRowModel } from '../gridOptionsUtils';
import type { IServerSideRowModel } from '../interfaces/iServerSideRowModel';
import { _error } from '../validation/logging';
import { _getInfiniteRowModel, _getServerSideRowModel } from './rowModelApiUtils';

export function setRowCount(beans: BeanCollection, rowCount: number, maxRowFound?: boolean): void {
    const serverSideRowModel = _getServerSideRowModel(beans);
    if (serverSideRowModel) {
        if (beans.funcColsSvc.isRowGroupEmpty()) {
            serverSideRowModel.setRowCount(rowCount, maxRowFound);
            return;
        }
        _error(28);
        return;
    }

    const infiniteRowModel = _getInfiniteRowModel(beans);
    if (infiniteRowModel) {
        infiniteRowModel.setRowCount(rowCount, maxRowFound);
        return;
    }
}

export function getCacheBlockState(beans: BeanCollection): any {
    if (_isServerSideRowModel(beans.gos)) {
        const ssrm = beans.rowModel as IServerSideRowModel;
        return ssrm.getBlockStates();
    }

    return beans.rowNodeBlockLoader?.getBlockState() ?? {};
}

export function isLastRowIndexKnown(beans: BeanCollection): boolean | undefined {
    return beans.rowModel.isLastRowIndexKnown();
}
