import { BeanStub } from '../../context/beanStub';
import type { DragAndDropIcon, DraggingEvent } from '../../dragAndDrop/dragAndDropService';
import type { AgColumn } from '../../entities/agColumn';
import type { ColumnPinnedType } from '../../interfaces/iColumn';
import type { DropListener } from './bodyDropTarget';

export class BodyDropPivotTarget extends BeanStub implements DropListener {
    private columnsToAggregate: AgColumn[] = [];
    private columnsToGroup: AgColumn[] = [];
    private columnsToPivot: AgColumn[] = [];

    constructor(private readonly pinned: ColumnPinnedType) {
        super();
    }

    /** Callback for when drag enters */
    public onDragEnter(draggingEvent: DraggingEvent): void {
        this.clearColumnsList();

        // in pivot mode, we don't accept any drops if functions are read only
        if (this.gos.get('functionsReadOnly')) {
            return;
        }

        const dragColumns = draggingEvent.dragItem.columns as AgColumn[] | undefined;

        if (!dragColumns) {
            return;
        }

        dragColumns.forEach((column) => {
            // we don't allow adding secondary columns
            if (!column.isPrimary()) {
                return;
            }

            if (column.isAnyFunctionActive()) {
                return;
            }

            if (column.isAllowValue()) {
                this.columnsToAggregate.push(column);
            } else if (column.isAllowRowGroup()) {
                this.columnsToGroup.push(column);
            } else if (column.isAllowPivot()) {
                this.columnsToPivot.push(column);
            }
        });
    }

    public getIconName(): DragAndDropIcon | null {
        const totalColumns = this.columnsToAggregate.length + this.columnsToGroup.length + this.columnsToPivot.length;
        if (totalColumns > 0) {
            return this.pinned ? 'pinned' : 'move';
        }

        return null;
    }

    /** Callback for when drag leaves */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDragLeave(draggingEvent: DraggingEvent): void {
        // if we are taking columns out of the center, then we remove them from the report
        this.clearColumnsList();
    }

    private clearColumnsList(): void {
        this.columnsToAggregate.length = 0;
        this.columnsToGroup.length = 0;
        this.columnsToPivot.length = 0;
    }

    /** Callback for when dragging */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDragging(draggingEvent: DraggingEvent): void {}

    /** Callback for when drag stops */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDragStop(draggingEvent: DraggingEvent): void {
        const { valueColsSvc, rowGroupColsSvc, pivotColsSvc } = this.beans;
        if (this.columnsToAggregate.length > 0) {
            valueColsSvc?.addColumns(this.columnsToAggregate, 'toolPanelDragAndDrop');
        }
        if (this.columnsToGroup.length > 0) {
            rowGroupColsSvc?.addColumns(this.columnsToGroup, 'toolPanelDragAndDrop');
        }
        if (this.columnsToPivot.length > 0) {
            pivotColsSvc?.addColumns(this.columnsToPivot, 'toolPanelDragAndDrop');
        }
    }

    public onDragCancel(): void {
        this.clearColumnsList();
    }
}
