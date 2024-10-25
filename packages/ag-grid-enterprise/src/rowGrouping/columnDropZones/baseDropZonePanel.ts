import type {
    AgColumn,
    BeanCollection,
    ColumnEventType,
    ColumnModel,
    DragItem,
    DraggingEvent,
    DropTarget,
    FuncColsService,
} from 'ag-grid-community';
import { DragSourceType, _shouldUpdateColVisibilityAfterGroup } from 'ag-grid-community';

import type { PillDropZonePanelParams } from '../../widgets/pillDropZonePanel';
import { PillDropZonePanel } from '../../widgets/pillDropZonePanel';
import { DropZoneColumnComp } from './dropZoneColumnComp';

export type TDropZone = 'rowGroup' | 'pivot' | 'aggregation';

export abstract class BaseDropZonePanel extends PillDropZonePanel<DropZoneColumnComp, AgColumn> {
    protected columnModel: ColumnModel;
    protected funcColsService: FuncColsService;

    public override wireBeans(beans: BeanCollection) {
        super.wireBeans(beans);
        this.columnModel = beans.columnModel;
        this.funcColsService = beans.funcColsService;
    }

    constructor(
        horizontal: boolean,
        private dropZonePurpose: TDropZone
    ) {
        super(horizontal);
    }

    public override init(params: PillDropZonePanelParams): void {
        super.init(params);

        this.addManagedEventListeners({ newColumnsLoaded: this.refreshGui.bind(this) });

        this.addManagedPropertyListeners(
            ['functionsReadOnly', 'rowGroupPanelSuppressSort', 'groupLockGroupColumns'],
            this.refreshGui.bind(this)
        );
    }

    protected getItems(dragItem: DragItem): AgColumn[] {
        return (dragItem.columns as AgColumn[]) ?? [];
    }

    protected isInterestedIn(type: DragSourceType): boolean {
        // not interested in row drags
        return type === DragSourceType.HeaderCell || type === DragSourceType.ToolPanel;
    }

    protected override minimumAllowedNewInsertIndex(): number {
        const numberOfLockedCols = this.gos.get('groupLockGroupColumns');
        const numberOfGroupCols = this.funcColsService.rowGroupCols.length;
        if (numberOfLockedCols === -1) {
            return numberOfGroupCols;
        }
        return Math.min(numberOfLockedCols, numberOfGroupCols);
    }

    private showOrHideColumnOnExit(draggingEvent: DraggingEvent): boolean {
        return (
            this.isRowGroupPanel() && _shouldUpdateColVisibilityAfterGroup(this.gos, true) && !draggingEvent.fromNudge
        );
    }

    protected override handleDragEnterEnd(draggingEvent: DraggingEvent): void {
        const hideColumnOnExit = this.showOrHideColumnOnExit(draggingEvent);

        if (hideColumnOnExit) {
            const dragItem = draggingEvent.dragSource.getDragItem();
            const columns = dragItem.columns as AgColumn[];
            this.setColumnsVisible(columns, false, 'uiColumnDragged');
        }
    }

    protected override handleDragLeaveEnd(draggingEvent: DraggingEvent): void {
        const showColumnOnExit = this.showOrHideColumnOnExit(draggingEvent);

        if (showColumnOnExit) {
            const dragItem = draggingEvent.dragSource.getDragItem();

            this.setColumnsVisible(dragItem.columns as AgColumn[], true, 'uiColumnDragged');
        }
    }

    public setColumnsVisible(columns: AgColumn[] | null | undefined, visible: boolean, source: ColumnEventType) {
        if (columns) {
            const allowedCols = columns.filter((c) => !c.getColDef().lockVisible);
            this.columnModel.setColsVisible(allowedCols, visible, source);
        }
    }

    private isRowGroupPanel() {
        return this.dropZonePurpose === 'rowGroup';
    }

    protected createPillComponent(
        column: AgColumn,
        dropTarget: DropTarget,
        ghost: boolean,
        horizontal: boolean
    ): DropZoneColumnComp {
        return new DropZoneColumnComp(column, dropTarget, ghost, this.dropZonePurpose, horizontal);
    }
}
