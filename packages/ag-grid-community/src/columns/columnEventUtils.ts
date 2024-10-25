import type { AgColumn } from '../entities/agColumn';
import type { EventService } from '../eventService';
import type { ColumnEvent, ColumnEventType } from '../events';
import type { WithoutGridCommon } from '../interfaces/iCommon';

function getCommonValue<T>(cols: AgColumn[], valueGetter: (col: AgColumn) => T): T | undefined {
    if (!cols || cols.length == 0) {
        return undefined;
    }

    // compare each value to the first value. if nothing differs, then value is common so return it.
    const firstValue = valueGetter(cols[0]);
    for (let i = 1; i < cols.length; i++) {
        if (firstValue !== valueGetter(cols[i])) {
            // values differ, no common value
            return undefined;
        }
    }

    return firstValue;
}

export function dispatchColumnPinnedEvent(
    eventSvc: EventService,
    changedColumns: AgColumn[],
    source: ColumnEventType
): void {
    if (!changedColumns.length) {
        return;
    }

    // if just one column, we use this, otherwise we don't include the col
    const column: AgColumn | null = changedColumns.length === 1 ? changedColumns[0] : null;

    // only include pinned if it's common in all columns
    const pinned = getCommonValue(changedColumns, (col) => col.getPinned());

    eventSvc.dispatchEvent({
        type: 'columnPinned',
        // mistake in typing, 'undefined' should be allowed, as 'null' means 'not pinned'
        pinned: pinned != null ? pinned : null,
        columns: changedColumns,
        column,
        source,
    });
}

export function dispatchColumnVisibleEvent(
    eventSvc: EventService,
    changedColumns: AgColumn[],
    source: ColumnEventType
): void {
    if (!changedColumns.length) {
        return;
    }

    // if just one column, we use this, otherwise we don't include the col
    const column: AgColumn | null = changedColumns.length === 1 ? changedColumns[0] : null;

    // only include visible if it's common in all columns
    const visible = getCommonValue(changedColumns, (col) => col.isVisible());

    eventSvc.dispatchEvent({
        type: 'columnVisible',
        visible,
        columns: changedColumns,
        column,
        source,
    });
}

export function dispatchColumnChangedEvent<
    T extends 'columnValueChanged' | 'columnPivotChanged' | 'columnRowGroupChanged',
>(eventSvc: EventService, type: T, columns: AgColumn[], source: ColumnEventType): void {
    eventSvc.dispatchEvent({
        type,
        columns,
        column: columns && columns.length == 1 ? columns[0] : null,
        source,
    } as WithoutGridCommon<ColumnEvent>);
}

export function dispatchColumnResizedEvent(
    eventSvc: EventService,
    columns: AgColumn[] | null,
    finished: boolean,
    source: ColumnEventType,
    flexColumns: AgColumn[] | null = null
): void {
    if (columns?.length) {
        eventSvc.dispatchEvent({
            type: 'columnResized',
            columns,
            column: columns.length === 1 ? columns[0] : null,
            flexColumns,
            finished,
            source,
        });
    }
}
