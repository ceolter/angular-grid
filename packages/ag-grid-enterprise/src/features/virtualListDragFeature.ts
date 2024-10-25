import type {
    AgEvent,
    BeanCollection,
    Component,
    DragAndDropService,
    DragSourceType,
    DraggingEvent,
    DropTarget,
} from 'ag-grid-community';
import { AutoScrollService, BeanStub, _radioCssClass } from 'ag-grid-community';

import type { VirtualList } from '../widgets/virtualList';
import type { VirtualListDragItem, VirtualListDragParams } from './iVirtualListDragFeature';

const LIST_ITEM_HOVERED = 'ag-list-item-hovered';

export class VirtualListDragFeature<
    C extends Component<any>,
    R extends Component<any>,
    V,
    E extends AgEvent,
> extends BeanStub {
    private dragAndDrop?: DragAndDropService;

    public wireBeans(beans: BeanCollection): void {
        this.dragAndDrop = beans.dragAndDrop;
    }

    private currentDragValue: V | null = null;
    private lastHoveredListItem: VirtualListDragItem<R> | null = null;
    private autoScrollService: AutoScrollService;
    private moveBlocked: boolean;

    constructor(
        private readonly comp: C,
        private readonly virtualList: VirtualList<any>,
        private readonly params: VirtualListDragParams<C, R, V, E>
    ) {
        super();
    }

    public postConstruct(): void {
        this.addManagedListeners(this.params.eventSource, {
            [this.params.listItemDragStartEvent]: this.listItemDragStart.bind(this),
            [this.params.listItemDragEndEvent]: this.listItemDragEnd.bind(this),
        });

        this.createDropTarget();
        this.createAutoScrollService();
    }

    private listItemDragStart(event: E): void {
        this.currentDragValue = this.params.getCurrentDragValue(event);
        this.moveBlocked = this.params.isMoveBlocked(this.currentDragValue);
    }

    private listItemDragEnd(): void {
        window.setTimeout(() => {
            this.currentDragValue = null;
            this.moveBlocked = false;
        }, 10);
    }

    private createDropTarget(): void {
        const dropTarget: DropTarget = {
            isInterestedIn: (type: DragSourceType) => type === this.params.dragSourceType,
            getIconName: () => (this.moveBlocked ? 'pinned' : 'move'),
            getContainer: () => this.comp.getGui(),
            onDragging: (e) => this.onDragging(e),
            onDragStop: () => this.onDragStop(),
            onDragLeave: () => this.onDragLeave(),
            onDragCancel: () => this.onDragCancel(),
        };

        this.dragAndDrop?.addDropTarget(dropTarget);
    }

    private createAutoScrollService(): void {
        const virtualListGui = this.virtualList.getGui();
        this.autoScrollService = new AutoScrollService({
            scrollContainer: virtualListGui,
            scrollAxis: 'y',
            getVerticalPosition: () => virtualListGui.scrollTop,
            setVerticalPosition: (position) => (virtualListGui.scrollTop = position),
        });
    }

    private onDragging(e: DraggingEvent) {
        if (!this.currentDragValue || this.moveBlocked) {
            return;
        }

        const hoveredListItem = this.getListDragItem(e);
        const comp = this.virtualList.getComponentAt(hoveredListItem.rowIndex);

        if (!comp) {
            return;
        }

        const el = comp!.getGui().parentElement as HTMLElement;

        if (
            this.lastHoveredListItem &&
            this.lastHoveredListItem.rowIndex === hoveredListItem.rowIndex &&
            this.lastHoveredListItem.position === hoveredListItem.position
        ) {
            return;
        }

        this.autoScrollService.check(e.event);
        this.clearHoveredItems();
        this.lastHoveredListItem = hoveredListItem;

        _radioCssClass(el, LIST_ITEM_HOVERED);
        _radioCssClass(el, `ag-item-highlight-${hoveredListItem.position}`);
    }

    private getListDragItem(e: DraggingEvent): VirtualListDragItem<R> {
        const virtualListGui = this.virtualList.getGui();
        const paddingTop = parseFloat(window.getComputedStyle(virtualListGui).paddingTop as string);
        const rowHeight = this.virtualList.getRowHeight();
        const scrollTop = this.virtualList.getScrollTop();
        const rowIndex = Math.max(0, (e.y - paddingTop + scrollTop) / rowHeight);
        const maxLen = this.params.getNumRows(this.comp) - 1;
        const normalizedRowIndex = Math.min(maxLen, rowIndex) | 0;

        return {
            rowIndex: normalizedRowIndex,
            position: Math.round(rowIndex) > rowIndex || rowIndex > maxLen ? 'bottom' : 'top',
            component: this.virtualList.getComponentAt(normalizedRowIndex) as R,
        };
    }

    private onDragStop() {
        if (this.moveBlocked) {
            return;
        }

        this.params.moveItem(this.currentDragValue, this.lastHoveredListItem);
        this.clearDragProperties();
    }

    private onDragCancel() {
        this.clearDragProperties();
    }

    private onDragLeave() {
        this.clearDragProperties();
    }

    private clearDragProperties(): void {
        this.clearHoveredItems();
        this.autoScrollService.ensureCleared();
    }

    private clearHoveredItems(): void {
        const virtualListGui = this.virtualList.getGui();
        virtualListGui.querySelectorAll(`.${LIST_ITEM_HOVERED}`).forEach((el) => {
            [LIST_ITEM_HOVERED, 'ag-item-highlight-top', 'ag-item-highlight-bottom'].forEach((cls) => {
                (el as HTMLElement).classList.remove(cls);
            });
        });
        this.lastHoveredListItem = null;
    }
}
