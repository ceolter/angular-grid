import type {
    AgColumn,
    AgProvidedColumnGroup,
    BeanCollection,
    ColumnModel,
    ColumnMoveService,
    ColumnPanelItemDragStartEvent,
} from 'ag-grid-community';
import { BeanStub, DragSourceType, isProvidedColumnGroup } from 'ag-grid-community';

import type { VirtualListDragItem } from '../features/iVirtualListDragFeature';
import { VirtualListDragFeature } from '../features/virtualListDragFeature';
import type { VirtualList } from '../widgets/virtualList';
import type { AgPrimaryColsList } from './agPrimaryColsList';
import type { ToolPanelColumnComp } from './toolPanelColumnComp';
import { ToolPanelColumnGroupComp } from './toolPanelColumnGroupComp';

export class PrimaryColsListPanelItemDragFeature extends BeanStub {
    private colMoves?: ColumnMoveService;
    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection) {
        this.colMoves = beans.colMoves;
        this.colModel = beans.colModel;
    }

    constructor(
        private readonly comp: AgPrimaryColsList,
        private readonly virtualList: VirtualList
    ) {
        super();
    }

    public postConstruct(): void {
        this.createManagedBean(
            new VirtualListDragFeature<
                AgPrimaryColsList,
                ToolPanelColumnGroupComp | ToolPanelColumnComp,
                AgColumn | AgProvidedColumnGroup,
                ColumnPanelItemDragStartEvent
            >(this.comp, this.virtualList, {
                dragSourceType: DragSourceType.ToolPanel,
                listItemDragStartEvent: 'columnPanelItemDragStart',
                listItemDragEndEvent: 'columnPanelItemDragEnd',
                eventSource: this.eventSvc,
                getCurrentDragValue: (listItemDragStartEvent: ColumnPanelItemDragStartEvent) =>
                    this.getCurrentDragValue(listItemDragStartEvent),
                isMoveBlocked: (currentDragValue: AgColumn | AgProvidedColumnGroup | null) =>
                    this.isMoveBlocked(currentDragValue),
                getNumRows: (comp: AgPrimaryColsList) => comp.getDisplayedColsList().length,
                moveItem: (
                    currentDragValue: AgColumn | AgProvidedColumnGroup | null,
                    lastHoveredListItem: VirtualListDragItem<ToolPanelColumnGroupComp | ToolPanelColumnComp> | null
                ) => this.moveItem(this.getCurrentColumnsBeingMoved(currentDragValue), lastHoveredListItem),
            })
        );
    }

    private getCurrentDragValue(
        listItemDragStartEvent: ColumnPanelItemDragStartEvent
    ): AgColumn | AgProvidedColumnGroup {
        return listItemDragStartEvent.column as AgColumn | AgProvidedColumnGroup;
    }

    private getCurrentColumnsBeingMoved(column: AgColumn | AgProvidedColumnGroup | null): AgColumn[] {
        if (isProvidedColumnGroup(column)) {
            return column.getLeafColumns();
        }
        return column ? [column] : [];
    }

    private isMoveBlocked(currentDragValue: AgColumn | AgProvidedColumnGroup | null): boolean {
        const preventMoving = this.gos.get('suppressMovableColumns');
        if (preventMoving) {
            return true;
        }

        const currentColumns = this.getCurrentColumnsBeingMoved(currentDragValue);
        const hasNotMovable = currentColumns.find((col) => {
            const colDef = col.getColDef();
            return !!colDef.suppressMovable || !!colDef.lockPosition;
        });

        return !!hasNotMovable;
    }

    private moveItem(
        currentColumns: AgColumn[],
        lastHoveredListItem: VirtualListDragItem<ToolPanelColumnGroupComp | ToolPanelColumnComp> | null
    ): void {
        if (!lastHoveredListItem) {
            return;
        }

        const { component } = lastHoveredListItem;

        let lastHoveredColumn: AgColumn | null = null;
        let isBefore = lastHoveredListItem.position === 'top';

        if (component instanceof ToolPanelColumnGroupComp) {
            const columns = component.getColumns();
            lastHoveredColumn = columns[0];
            isBefore = true;
        } else if (component) {
            lastHoveredColumn = component.getColumn();
        }

        if (!lastHoveredColumn) {
            return;
        }

        const targetIndex: number | null = this.getMoveTargetIndex({
            currentColumns,
            lastHoveredColumn,
            isBefore,
        });

        if (targetIndex != null) {
            this.colMoves?.moveColumns(currentColumns, targetIndex, 'toolPanelUi');
        }
    }

    private getMoveTargetIndex(params: {
        currentColumns: AgColumn[] | null;
        lastHoveredColumn: AgColumn;
        isBefore: boolean;
    }): number | null {
        const { currentColumns, lastHoveredColumn, isBefore } = params;
        if (!lastHoveredColumn || !currentColumns) {
            return null;
        }

        const targetColumnIndex = this.colModel.getCols().indexOf(lastHoveredColumn);
        const adjustedTarget = isBefore ? targetColumnIndex : targetColumnIndex + 1;
        const diff = this.getMoveDiff(currentColumns, adjustedTarget);

        return adjustedTarget - diff;
    }

    private getMoveDiff(currentColumns: AgColumn[] | null, end: number): number {
        const allColumns = this.colModel.getCols();

        if (!currentColumns) {
            return 0;
        }

        const targetColumn = currentColumns[0];
        const span = currentColumns.length;

        const currentIndex = allColumns.indexOf(targetColumn);

        if (currentIndex < end) {
            return span;
        }

        return 0;
    }
}
