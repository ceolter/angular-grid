import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { FlashCellsParams } from '../../interfaces/iCellsParams';

export function flashCells<TData = any>(beans: BeanCollection, params: FlashCellsParams<TData> = {}): void {
    const { cellFlashSvc } = beans;
    if (!cellFlashSvc) {
        return;
    }
    beans.frameworkOverrides.wrapIncoming(() => {
        beans.rowRenderer
            .getCellCtrls(params.rowNodes, params.columns as AgColumn[])
            .forEach((cellCtrl) => cellFlashSvc.flashCell(cellCtrl, params));
    });
}
