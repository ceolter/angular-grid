import type { BeanCollection } from '../context/context';
import { _getClientSideRowModel, _getServerSideRowModel } from './rowModelApiUtils';

export function expandAll(beans: BeanCollection) {
    beans.expansionSvc?.expandAll(true);
}

export function collapseAll(beans: BeanCollection) {
    beans.expansionSvc?.expandAll(false);
}

export function onRowHeightChanged(beans: BeanCollection) {
    const clientSideRowModel = _getClientSideRowModel(beans);
    const serverSideRowModel = _getServerSideRowModel(beans);
    if (clientSideRowModel) {
        clientSideRowModel.onRowHeightChanged();
    } else if (serverSideRowModel) {
        serverSideRowModel.onRowHeightChanged();
    }
}
