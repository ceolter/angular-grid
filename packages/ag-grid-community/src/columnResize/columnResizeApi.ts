import type { BeanCollection } from '../context/context';
import type { ColDef } from '../entities/colDef';
import type { ColumnEventType } from '../events';
import type { Column } from '../interfaces/iColumn';

export function setColumnWidths(
    beans: BeanCollection,
    columnWidths: { key: string | ColDef | Column; newWidth: number }[],
    finished: boolean = true,
    source: ColumnEventType = 'api'
): void {
    beans.colResize?.setColumnWidths(columnWidths, false, finished, source);
}
