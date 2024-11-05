import type { AgEventType } from '../eventTypes';
import type { RowEvent } from '../events';
import type { GridOptionsService } from '../gridOptionsService';
import type { RowNode } from './rowNode';

export function _createGlobalRowEvent<T extends AgEventType>(
    rowNode: RowNode,
    gos: GridOptionsService,
    type: T
): RowEvent<T> {
    return gos.addGridCommonParams({
        type,
        node: rowNode,
        data: rowNode.data,
        rowIndex: rowNode.rowIndex,
        rowPinned: rowNode.rowPinned,
    });
}
