import { AutoScrollService } from '../autoScrollService';
import type { FuncColsService } from '../columns/funcColsService';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import { _getCellByPosition } from '../entities/positionUtils';
import type { RowNode } from '../entities/rowNode';
import type {
    RowDragCancelEvent,
    RowDragEndEvent,
    RowDragEnterEvent,
    RowDragEvent,
    RowDragLeaveEvent,
    RowDragMoveEvent,
} from '../events';
import type { FilterManager } from '../filter/filterManager';
import type { FocusService } from '../focusService';
import type { MouseEventService } from '../gridBodyComp/mouseEventService';
import { _getRowIdCallback, _isClientSideRowModel } from '../gridOptionsUtils';
import type { IClientSideRowModel } from '../interfaces/iClientSideRowModel';
import type { IRowModel } from '../interfaces/iRowModel';
import type { ISelectionService } from '../interfaces/iSelectionService';
import type { PageBoundsService } from '../pagination/pageBoundsService';
import type { SortController } from '../sort/sortController';
import { _last } from '../utils/array';
import { _warn } from '../validation/logging';
import type { DragAndDropIcon, DragAndDropService, DraggingEvent, DropTarget } from './dragAndDropService';
import { DragSourceType } from './dragAndDropService';

export interface RowDropZoneEvents {
    /** Callback function that will be executed when the rowDrag enters the target. */
    onDragEnter?: (params: RowDragEnterEvent) => void;
    /** Callback function that will be executed when the rowDrag leaves the target */
    onDragLeave?: (params: RowDragLeaveEvent) => void;
    /**
     * Callback function that will be executed when the rowDrag is dragged inside the target.
     * Note: this gets called multiple times.
     */
    onDragging?: (params: RowDragMoveEvent) => void;
    /** Callback function that will be executed when the rowDrag drops rows within the target. */
    onDragStop?: (params: RowDragEndEvent) => void;
    onDragCancel?: (params: RowDragCancelEvent) => void;
}

/** We actually have a different interface if we are passing params out of the grid and
 * directly into another grid. These internal params just work directly off the DraggingEvent.
 * However, we don't want to expose these to the user, so we have a different interface for
 * them called RowDropZoneParams which works with RowDragEvents.
 */
interface InternalRowDropZoneEvents {
    /** Callback function that will be executed when the rowDrag enters the target. */
    onDragEnter?: (params: DraggingEvent) => void;
    /** Callback function that will be executed when the rowDrag leaves the target */
    onDragLeave?: (params: DraggingEvent) => void;
    /**
     * Callback function that will be executed when the rowDrag is dragged inside the target.
     * Note: this gets called multiple times.
     */
    onDragging?: (params: DraggingEvent) => void;
    /** Callback function that will be executed when the rowDrag drops rows within the target. */
    onDragStop?: (params: DraggingEvent) => void;
    onDragCancel?: (params: DraggingEvent) => void;
}
interface InternalRowDropZoneParams extends InternalRowDropZoneEvents {
    /** A callback method that returns the DropZone HTMLElement. */
    getContainer: () => HTMLElement;
    /** internal flag for identifying params from the grid. */
    fromGrid?: boolean;
}

export interface RowDropZoneParams extends RowDropZoneEvents {
    /** A callback method that returns the DropZone HTMLElement. */
    getContainer: () => HTMLElement;
}

type RowDragEventType = 'rowDragEnter' | 'rowDragLeave' | 'rowDragMove' | 'rowDragEnd' | 'rowDragCancel';

export class RowDragFeature extends BeanStub implements DropTarget {
    private dragAndDropService: DragAndDropService;
    private rowModel: IRowModel;
    private pageBoundsService: PageBoundsService;
    private focusService: FocusService;
    private sortController?: SortController;
    private filterManager?: FilterManager;
    private selectionService?: ISelectionService;
    private mouseEventService: MouseEventService;
    private ctrlsService: CtrlsService;
    private funcColsService: FuncColsService;

    public wireBeans(beans: BeanCollection): void {
        this.dragAndDropService = beans.dragAndDropService!;
        this.rowModel = beans.rowModel;
        this.pageBoundsService = beans.pageBoundsService;
        this.focusService = beans.focusService;
        this.sortController = beans.sortController;
        this.filterManager = beans.filterManager;
        this.selectionService = beans.selectionService;
        this.mouseEventService = beans.mouseEventService;
        this.ctrlsService = beans.ctrlsService;
        this.funcColsService = beans.funcColsService;
    }

    private clientSideRowModel: IClientSideRowModel;
    private eContainer: HTMLElement;
    private lastDraggingEvent: DraggingEvent;
    private autoScrollService: AutoScrollService;

    constructor(eContainer: HTMLElement) {
        super();
        this.eContainer = eContainer;
    }

    public postConstruct(): void {
        if (_isClientSideRowModel(this.gos, this.rowModel)) {
            this.clientSideRowModel = this.rowModel;
        }

        this.ctrlsService.whenReady(this, (p) => {
            const gridBodyCon = p.gridBodyCtrl;
            this.autoScrollService = new AutoScrollService({
                scrollContainer: gridBodyCon.getBodyViewportElement(),
                scrollAxis: 'y',
                getVerticalPosition: () => gridBodyCon.getScrollFeature().getVScrollPosition().top,
                setVerticalPosition: (position) => gridBodyCon.getScrollFeature().setVerticalScrollPosition(position),
                onScrollCallback: () => {
                    this.onDragging(this.lastDraggingEvent);
                },
            });
        });
    }

    public getContainer(): HTMLElement {
        return this.eContainer;
    }

    public isInterestedIn(type: DragSourceType): boolean {
        return type === DragSourceType.RowDrag;
    }

    public getIconName(): DragAndDropIcon {
        const managedDrag = this.gos.get('rowDragManaged');

        if (managedDrag && this.shouldPreventRowMove()) {
            return 'notAllowed';
        }

        return 'move';
    }

    public shouldPreventRowMove(): boolean {
        const rowGroupCols = this.funcColsService.rowGroupCols;
        if (rowGroupCols.length) {
            return true;
        }
        const isFilterPresent = this.filterManager?.isAnyFilterPresent();
        if (isFilterPresent) {
            return true;
        }
        const isSortActive = this.sortController?.isSortActive();
        if (isSortActive) {
            return true;
        }
        return false;
    }

    private getRowNodes(draggingEvent: DraggingEvent): RowNode[] {
        if (!this.isFromThisGrid(draggingEvent)) {
            return (draggingEvent.dragItem.rowNodes || []) as RowNode[];
        }

        const currentNode = draggingEvent.dragItem.rowNode! as RowNode;
        const isRowDragMultiRow = this.gos.get('rowDragMultiRow');
        if (isRowDragMultiRow) {
            const selectedNodes = [...(this.selectionService?.getSelectedNodes() ?? [])].sort((a, b) => {
                if (a.rowIndex == null || b.rowIndex == null) {
                    return 0;
                }

                return this.getRowIndexNumber(a) - this.getRowIndexNumber(b);
            });
            if (selectedNodes.indexOf(currentNode) !== -1) {
                return selectedNodes;
            }
        }

        return [currentNode];
    }

    public onDragEnter(draggingEvent: DraggingEvent): void {
        // builds a lits of all rows being dragged before firing events
        draggingEvent.dragItem.rowNodes = this.getRowNodes(draggingEvent);

        // when entering, we fire the enter event, then in onEnterOrDragging,
        // we also fire the move event. so we get both events when entering.
        this.dispatchGridEvent('rowDragEnter', draggingEvent);

        this.getRowNodes(draggingEvent).forEach((rowNode) => {
            this.setRowNodeDragging(rowNode, true);
        });

        this.onEnterOrDragging(draggingEvent);
    }

    public onDragging(draggingEvent: DraggingEvent): void {
        this.onEnterOrDragging(draggingEvent);
    }

    private isFromThisGrid(draggingEvent: DraggingEvent) {
        const { dragSourceDomDataKey } = draggingEvent.dragSource;

        return dragSourceDomDataKey === this.gos.getDomDataKey();
    }

    private onEnterOrDragging(draggingEvent: DraggingEvent): void {
        // this event is fired for enter and move
        this.dispatchGridEvent('rowDragMove', draggingEvent);

        this.lastDraggingEvent = draggingEvent;

        const pixel = this.mouseEventService.getNormalisedPosition(draggingEvent).y;
        const managedDrag = this.gos.get('rowDragManaged');

        if (managedDrag) {
            this.doManagedDrag(draggingEvent, pixel);
        }

        this.autoScrollService.check(draggingEvent.event);
    }

    private doManagedDrag(draggingEvent: DraggingEvent, pixel: number): void {
        const isFromThisGrid = this.isFromThisGrid(draggingEvent);
        const managedDrag = this.gos.get('rowDragManaged');
        const rowNodes = draggingEvent.dragItem.rowNodes! as RowNode[];

        if (managedDrag && this.shouldPreventRowMove()) {
            return;
        }

        if (this.gos.get('suppressMoveWhenRowDragging') || !isFromThisGrid) {
            if (this.dragAndDropService.isDropZoneWithinThisGrid(draggingEvent)) {
                this.clientSideRowModel.highlightRowAtPixel(rowNodes[0], pixel);
            }
        } else {
            this.moveRows(rowNodes, pixel);
        }
    }

    private getRowIndexNumber(rowNode: RowNode): number {
        const rowIndexStr = rowNode.getRowIndexString()!;

        return parseInt(_last(rowIndexStr.split('-')), 10);
    }

    private moveRowAndClearHighlight(draggingEvent: DraggingEvent): void {
        const lastHighlightedRowNode = this.clientSideRowModel.getLastHighlightedRowNode();
        const isBelow = lastHighlightedRowNode && lastHighlightedRowNode.highlighted === 'Below';
        const pixel = this.mouseEventService.getNormalisedPosition(draggingEvent).y;
        const rowNodes = draggingEvent.dragItem.rowNodes as RowNode[];

        let increment = isBelow ? 1 : 0;

        if (this.isFromThisGrid(draggingEvent)) {
            rowNodes!.forEach((rowNode) => {
                if (rowNode.rowTop! < pixel) {
                    increment -= 1;
                }
            });
            this.moveRows(rowNodes!, pixel, increment);
        } else {
            const getRowIdFunc = _getRowIdCallback(this.gos);

            let addIndex = this.clientSideRowModel.getRowIndexAtPixel(pixel) + 1;

            if (this.clientSideRowModel.getHighlightPosition(pixel) === 'Above') {
                addIndex--;
            }

            this.clientSideRowModel.updateRowData({
                add: rowNodes!
                    .filter(
                        (node) =>
                            !this.clientSideRowModel.getRowNode(
                                getRowIdFunc?.({ data: node.data, level: 0, rowPinned: node.rowPinned }) ?? node.data.id
                            )
                    )
                    .map((node) => node.data),
                addIndex,
            });
        }

        this.clearRowHighlight();
    }

    private clearRowHighlight(): void {
        this.clientSideRowModel.highlightRowAtPixel(null);
    }

    private moveRows(rowNodes: RowNode[], pixel: number, increment: number = 0): void {
        // Get the focussed cell so we can ensure it remains focussed after the move
        const cellPosition = this.focusService.getFocusedCell();
        const cellCtrl = cellPosition && _getCellByPosition(this.beans, cellPosition);

        const rowWasMoved = this.clientSideRowModel.ensureRowsAtPixel(rowNodes, pixel, increment);
        if (rowWasMoved) {
            if (cellCtrl) {
                cellCtrl.focusCell();
            } else {
                this.focusService.clearFocusedCell();
            }
        }
    }

    public addRowDropZone(params: RowDropZoneParams & { fromGrid?: boolean }): void {
        if (!params.getContainer()) {
            _warn(55);
            return;
        }

        if (this.dragAndDropService.findExternalZone(params)) {
            _warn(56);
            return;
        }

        let processedParams: RowDropZoneParams = {
            getContainer: params.getContainer,
        };

        if (params.fromGrid) {
            processedParams = params;
        } else {
            if (params.onDragEnter) {
                processedParams.onDragEnter = (e) => {
                    params.onDragEnter!(this.draggingToRowDragEvent('rowDragEnter', e as any));
                };
            }
            if (params.onDragLeave) {
                processedParams.onDragLeave = (e) => {
                    params.onDragLeave!(this.draggingToRowDragEvent('rowDragLeave', e as any));
                };
            }
            if (params.onDragging) {
                processedParams.onDragging = (e) => {
                    params.onDragging!(this.draggingToRowDragEvent('rowDragMove', e as any));
                };
            }
            if (params.onDragStop) {
                processedParams.onDragStop = (e) => {
                    params.onDragStop!(this.draggingToRowDragEvent('rowDragEnd', e as any));
                };
            }
            if (params.onDragCancel) {
                processedParams.onDragCancel = (e) => {
                    params.onDragCancel!(this.draggingToRowDragEvent('rowDragCancel', e as any));
                };
            }
        }

        const dropTarget: DropTarget = {
            isInterestedIn: (type: DragSourceType) => type === DragSourceType.RowDrag,
            getIconName: () => 'move',
            external: true,
            ...(processedParams as any),
        };
        this.dragAndDropService.addDropTarget(dropTarget);
        this.addDestroyFunc(() => this.dragAndDropService.removeDropTarget(dropTarget));
    }

    public getRowDropZone(events?: RowDropZoneEvents): RowDropZoneParams {
        const getContainer = this.getContainer.bind(this);
        const onDragEnter = this.onDragEnter.bind(this);
        const onDragLeave = this.onDragLeave.bind(this);
        const onDragging = this.onDragging.bind(this);
        const onDragStop = this.onDragStop.bind(this);
        const onDragCancel = this.onDragCancel.bind(this);

        let params: InternalRowDropZoneParams;
        if (!events) {
            params = {
                getContainer,
                onDragEnter,
                onDragLeave,
                onDragging,
                onDragStop,
                onDragCancel,
                /* @private */ fromGrid: true,
            };
        } else {
            params = {
                getContainer,
                onDragEnter: events.onDragEnter
                    ? (e) => {
                          onDragEnter(e);
                          events.onDragEnter!(this.draggingToRowDragEvent('rowDragEnter', e));
                      }
                    : onDragEnter,
                onDragLeave: events.onDragLeave
                    ? (e) => {
                          onDragLeave(e);
                          events.onDragLeave!(this.draggingToRowDragEvent('rowDragLeave', e));
                      }
                    : onDragLeave,
                onDragging: events.onDragging
                    ? (e) => {
                          onDragging(e);
                          events.onDragging!(this.draggingToRowDragEvent('rowDragMove', e));
                      }
                    : onDragging,
                onDragStop: events.onDragStop
                    ? (e) => {
                          onDragStop(e);
                          events.onDragStop!(this.draggingToRowDragEvent('rowDragEnd', e));
                      }
                    : onDragStop,
                onDragCancel: events.onDragCancel
                    ? (e) => {
                          onDragCancel(e);
                          events.onDragCancel!(this.draggingToRowDragEvent('rowDragCancel', e));
                      }
                    : onDragCancel,
                fromGrid: true /* @private */,
            };
        }
        // Cast to RowDropZoneParams to hide the internal properties
        return params as RowDropZoneParams;
    }

    private draggingToRowDragEvent<T extends RowDragEventType>(type: T, draggingEvent: DraggingEvent): RowDragEvent<T> {
        const yNormalised = this.mouseEventService.getNormalisedPosition(draggingEvent).y;
        const mouseIsPastLastRow = yNormalised > this.pageBoundsService.getCurrentPageHeight();

        let overIndex = -1;
        let overNode: RowNode | undefined;

        if (!mouseIsPastLastRow) {
            overIndex = this.rowModel.getRowIndexAtPixel(yNormalised);
            overNode = this.rowModel.getRow(overIndex);
        }

        const event: RowDragEvent<T> = this.gos.addGridCommonParams({
            type: type,
            event: draggingEvent.event,
            node: draggingEvent.dragItem.rowNode!,
            nodes: draggingEvent.dragItem.rowNodes!,
            overIndex: overIndex,
            overNode: overNode,
            y: yNormalised,
            vDirection: draggingEvent.vDirection,
        });

        return event;
    }

    private dispatchGridEvent(type: RowDragEventType, draggingEvent: DraggingEvent): void {
        const event = this.draggingToRowDragEvent(type, draggingEvent);

        this.eventService.dispatchEvent(event);
    }

    public onDragLeave(draggingEvent: DraggingEvent): void {
        this.dispatchGridEvent('rowDragLeave', draggingEvent);
        this.stopDragging(draggingEvent);

        if (this.gos.get('rowDragManaged')) {
            this.clearRowHighlight();
        }
    }

    public onDragStop(draggingEvent: DraggingEvent): void {
        this.dispatchGridEvent('rowDragEnd', draggingEvent);
        this.stopDragging(draggingEvent);

        if (
            this.gos.get('rowDragManaged') &&
            (this.gos.get('suppressMoveWhenRowDragging') || !this.isFromThisGrid(draggingEvent)) &&
            this.dragAndDropService.isDropZoneWithinThisGrid(draggingEvent)
        ) {
            this.moveRowAndClearHighlight(draggingEvent);
        }
    }

    public onDragCancel(draggingEvent: DraggingEvent): void {
        this.dispatchGridEvent('rowDragCancel', draggingEvent);
        this.stopDragging(draggingEvent);

        if (
            this.gos.get('rowDragManaged') &&
            (this.gos.get('suppressMoveWhenRowDragging') || !this.isFromThisGrid(draggingEvent)) &&
            this.dragAndDropService.isDropZoneWithinThisGrid(draggingEvent)
        ) {
            this.clearRowHighlight();
        }
    }

    private stopDragging(draggingEvent: DraggingEvent): void {
        this.autoScrollService.ensureCleared();

        this.getRowNodes(draggingEvent).forEach((rowNode) => {
            this.setRowNodeDragging(rowNode, false);
        });
    }

    private setRowNodeDragging(rowNode: RowNode, dragging: boolean): void {
        if (rowNode.dragging !== dragging) {
            rowNode.dragging = dragging;
            rowNode.dispatchRowEvent('draggingChanged');
        }
    }
}
