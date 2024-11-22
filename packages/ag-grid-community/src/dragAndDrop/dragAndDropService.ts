import { _getDragAndDropImageCompDetails } from '../components/framework/userCompUtils';
import type { UserComponentFactory } from '../components/framework/userComponentFactory';
import type { HorizontalDirection, VerticalDirection } from '../constants/direction';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { Environment } from '../environment';
import { _stampTopLevelGridCompWithGridInstance } from '../gridBodyComp/mouseEventUtils';
import { _anchorElementToMouseMoveEvent, _getPageBody, _getRootNode } from '../gridOptionsUtils';
import type { AgGridCommon } from '../interfaces/iCommon';
import type { DragItem } from '../interfaces/iDragItem';
import { _removeFromArray } from '../utils/array';
import type { AgPromise } from '../utils/promise';
import { _warn } from '../validation/logging';
import type { IDragAndDropImageComponent } from './dragAndDropImageComponent';
import type { DragListenerParams, DragService } from './dragService';
import type { RowDropZoneParams } from './rowDragFeature';

export enum DragSourceType {
    ToolPanel,
    HeaderCell,
    RowDrag,
    ChartPanel,
    AdvancedFilterBuilder,
}

export interface DragSource {
    /**
     * The type of the drag source, used by the drop target to know where the
     * drag originated from.
     */
    type: DragSourceType;
    /** Can be used to identify a specific component as the source */
    sourceId?: string;
    /**
     * Element which, when dragged, will kick off the DnD process
     */
    eElement: Element;
    /**
     * If eElement is dragged, then the dragItem is the object that gets passed around.
     */
    getDragItem: () => DragItem;
    /**
     * This name appears in the drag and drop image component when dragging.
     */
    dragItemName: string | (() => string) | null;
    /**
     * Icon to show when not over a drop zone
     */
    getDefaultIconName?: () => DragAndDropIcon;
    /**
     * The drag source DOM Data Key, this is useful to detect if the origin grid is the same
     * as the target grid.
     */
    dragSourceDomDataKey?: string;
    /**
     * After how many pixels of dragging should the drag operation start. Default is 4.
     */
    dragStartPixels?: number;
    /**
     * Callback for drag started
     */
    onDragStarted?: () => void;
    /**
     * Callback for drag stopped
     */
    onDragStopped?: () => void;
    /**
     * Callback for drag cancelled
     */
    onDragCancelled?: () => void;
    /**
     * Callback for entering the grid
     */
    onGridEnter?: (dragItem: DragItem | null) => void;
    /**
     * Callback for exiting the grid
     */
    onGridExit?: (dragItem: DragItem | null) => void;
}

export interface DropTarget {
    /** The main container that will get the drop. */
    getContainer(): HTMLElement;
    /** If any secondary containers. For example when moving columns in AG Grid, we listen for drops
     * in the header as well as the body (main rows and pinned rows) of the grid. */
    getSecondaryContainers?(): HTMLElement[][];
    /** Icon to show when drag is over */
    getIconName?(): DragAndDropIcon | null;

    isInterestedIn(type: DragSourceType, el: Element): boolean;

    /**
     * If `true`, the DragSources will only be allowed to be dragged within the DragTarget that contains them.
     * This is useful for changing order of items within a container, and not moving items across containers.
     * @default false
     */
    targetContainsSource?: boolean;

    /** Callback for when drag enters */
    onDragEnter?(params: DraggingEvent): void;
    /** Callback for when drag leaves */
    onDragLeave?(params: DraggingEvent): void;
    /** Callback for when dragging */
    onDragging?(params: DraggingEvent): void;
    /** Callback for when drag stops */
    onDragStop?(params: DraggingEvent): void;
    /** Callback for when the drag is cancelled */
    onDragCancel?(params: DraggingEvent): void;
    external?: boolean;
}

export interface DraggingEvent<TData = any, TContext = any> extends AgGridCommon<TData, TContext> {
    event: MouseEvent;
    x: number;
    y: number;
    vDirection: VerticalDirection | null;
    hDirection: HorizontalDirection | null;
    dragSource: DragSource;
    dragItem: DragItem;
    fromNudge: boolean;
    dropZoneTarget: HTMLElement;
}

export type DragAndDropIcon =
    | 'pinned'
    | 'move'
    | 'left'
    | 'right'
    | 'group'
    | 'aggregate'
    | 'pivot'
    | 'notAllowed'
    | 'hide';

export class DragAndDropService extends BeanStub implements NamedBean {
    beanName = 'dragAndDrop' as const;

    private ctrlsSvc: CtrlsService;
    private dragSvc: DragService;
    private environment: Environment;
    private userCompFactory: UserComponentFactory;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.dragSvc = beans.dragSvc!;
        this.environment = beans.environment;
        this.userCompFactory = beans.userCompFactory;
    }

    private dragSourceAndParamsList: { params: DragListenerParams; dragSource: DragSource }[] = [];

    private dragItem: DragItem | null;
    private eventLastTime: MouseEvent | null;
    private dragSource: DragSource | null;
    private dragging: boolean;

    private dragAndDropImageComp: {
        promise: AgPromise<IDragAndDropImageComponent>;
        comp?: IDragAndDropImageComponent;
    } | null;
    private dragAndDropImageParent: HTMLElement | ShadowRoot;

    private dropTargets: DropTarget[] = [];
    private lastDropTarget: DropTarget | null | undefined;

    public addDragSource(dragSource: DragSource, allowTouch = false): void {
        const params: DragListenerParams = {
            eElement: dragSource.eElement,
            dragStartPixels: dragSource.dragStartPixels,
            onDragStart: this.onDragStart.bind(this, dragSource),
            onDragStop: this.onDragStop.bind(this),
            onDragging: this.onDragging.bind(this),
            onDragCancel: this.onDragCancel.bind(this),
            includeTouch: allowTouch,
        };

        this.dragSourceAndParamsList.push({ params: params, dragSource: dragSource });
        this.dragSvc.addDragSource(params);
    }

    public getDragAndDropImageComponent(): IDragAndDropImageComponent | null {
        const { dragAndDropImageComp } = this;
        if (!dragAndDropImageComp || !dragAndDropImageComp.comp) {
            return null;
        }

        return dragAndDropImageComp.comp;
    }

    public removeDragSource(dragSource: DragSource): void {
        const { dragSourceAndParamsList, dragSvc } = this;
        const sourceAndParams = dragSourceAndParamsList.find((item) => item.dragSource === dragSource);

        if (sourceAndParams) {
            dragSvc.removeDragSource(sourceAndParams.params);
            _removeFromArray(dragSourceAndParamsList, sourceAndParams);
        }
    }

    public override destroy(): void {
        const { dragSourceAndParamsList, dragSvc, dropTargets } = this;
        dragSourceAndParamsList.forEach((sourceAndParams) => dragSvc.removeDragSource(sourceAndParams.params));
        dragSourceAndParamsList.length = 0;
        dropTargets.length = 0;
        this.clearDragAndDropProperties();
        super.destroy();
    }

    public nudge(): void {
        if (this.dragging) {
            this.onDragging(this.eventLastTime!, true);
        }
    }

    private onDragStart(dragSource: DragSource, mouseEvent: MouseEvent): void {
        this.dragging = true;
        this.dragSource = dragSource;
        this.eventLastTime = mouseEvent;
        this.dragItem = dragSource.getDragItem();

        dragSource.onDragStarted?.();
        this.createDragAndDropImageComponent();
    }

    private onDragStop(mouseEvent: MouseEvent): void {
        this.dragSource?.onDragStopped?.();

        const { lastDropTarget } = this;
        if (lastDropTarget?.onDragStop) {
            const draggingEvent = this.createDropTargetEvent(lastDropTarget, mouseEvent, null, null, false);
            lastDropTarget.onDragStop(draggingEvent);
        }

        this.clearDragAndDropProperties();
    }

    private onDragCancel(): void {
        const { dragSource, lastDropTarget } = this;
        dragSource?.onDragCancelled?.();

        if (lastDropTarget?.onDragCancel) {
            lastDropTarget.onDragCancel(
                this.createDropTargetEvent(lastDropTarget, this.eventLastTime!, null, null, false)
            );
        }
        this.clearDragAndDropProperties();
    }

    private clearDragAndDropProperties(): void {
        this.eventLastTime = null;
        this.dragging = false;
        this.lastDropTarget = undefined;
        this.dragItem = null;
        this.dragSource = null;
        this.removeDragAndDropImageComponent();
    }

    private onDragging(mouseEvent: MouseEvent, fromNudge: boolean = false): void {
        const hDirection = this.getHorizontalDirection(mouseEvent);
        const vDirection = this.getVerticalDirection(mouseEvent);

        this.eventLastTime = mouseEvent;
        this.positionDragAndDropImageComp(mouseEvent);

        // check if mouseEvent intersects with any of the drop targets
        const validDropTargets = this.dropTargets.filter((target) => this.isMouseOnDropTarget(mouseEvent, target));
        const dropTarget: DropTarget | null = this.findCurrentDropTarget(mouseEvent, validDropTargets);

        const { lastDropTarget, dragSource, dragAndDropImageComp, dragItem } = this;

        if (dropTarget !== lastDropTarget) {
            this.leaveLastTargetIfExists(mouseEvent, hDirection, vDirection, fromNudge);

            if (lastDropTarget !== null && dropTarget === null) {
                dragSource?.onGridExit?.(dragItem);
            }
            if (lastDropTarget === null && dropTarget !== null) {
                dragSource?.onGridEnter?.(dragItem);
            }
            this.enterDragTargetIfExists(dropTarget, mouseEvent, hDirection, vDirection, fromNudge);

            if (dropTarget && dragAndDropImageComp) {
                const { comp, promise } = dragAndDropImageComp;
                if (comp) {
                    comp.setIcon(dropTarget.getIconName ? dropTarget.getIconName() : null, false);
                } else {
                    promise.then((resolvedComponent) => {
                        if (resolvedComponent) {
                            resolvedComponent.setIcon(dropTarget.getIconName ? dropTarget.getIconName() : null, false);
                        }
                    });
                }
            }

            this.lastDropTarget = dropTarget;
        } else if (dropTarget && dropTarget.onDragging) {
            const draggingEvent = this.createDropTargetEvent(dropTarget, mouseEvent, hDirection, vDirection, fromNudge);
            dropTarget.onDragging(draggingEvent);
        }
    }

    private getAllContainersFromDropTarget(dropTarget: DropTarget): HTMLElement[][] {
        const secondaryContainers = dropTarget.getSecondaryContainers ? dropTarget.getSecondaryContainers() : null;
        const containers: HTMLElement[][] = [[dropTarget.getContainer()]];

        return secondaryContainers ? containers.concat(secondaryContainers) : containers;
    }

    // checks if the mouse is on the drop target. it checks eContainer and eSecondaryContainers
    private isMouseOnDropTarget(mouseEvent: MouseEvent, dropTarget: DropTarget): boolean {
        const allContainersFromDropTarget = this.getAllContainersFromDropTarget(dropTarget);
        let mouseOverTarget = false;

        const allContainersIntersect = (mouseEvent: MouseEvent, containers: HTMLElement[]) => {
            for (const container of containers) {
                const { width, height, left, right, top, bottom } = container.getBoundingClientRect();

                // if element is not visible, then width and height are zero
                if (width === 0 || height === 0) {
                    return false;
                }

                const horizontalFit = mouseEvent.clientX >= left && mouseEvent.clientX < right;
                const verticalFit = mouseEvent.clientY >= top && mouseEvent.clientY < bottom;

                if (!horizontalFit || !verticalFit) {
                    return false;
                }
            }
            return true;
        };

        for (const currentContainers of allContainersFromDropTarget) {
            if (allContainersIntersect(mouseEvent, currentContainers)) {
                mouseOverTarget = true;
                break;
            }
        }
        const { eElement, type } = this.dragSource!;
        if (dropTarget.targetContainsSource && !dropTarget.getContainer().contains(eElement)) {
            return false;
        }

        return mouseOverTarget && dropTarget.isInterestedIn(type, eElement);
    }

    private findCurrentDropTarget(mouseEvent: MouseEvent, validDropTargets: DropTarget[]): DropTarget | null {
        const len = validDropTargets.length;

        if (len === 0) {
            return null;
        }
        if (len === 1) {
            return validDropTargets[0];
        }

        const rootNode = _getRootNode(this.beans);

        // elementsFromPoint return a list of elements under
        // the mouseEvent sorted from topMost to bottomMost
        const elementStack = rootNode.elementsFromPoint(mouseEvent.clientX, mouseEvent.clientY) as HTMLElement[];

        // loop over the sorted elementStack to find which dropTarget comes first
        for (const el of elementStack) {
            for (const dropTarget of validDropTargets) {
                const containers = this.getAllContainersFromDropTarget(dropTarget).flatMap((a) => a);
                if (containers.indexOf(el) !== -1) {
                    return dropTarget;
                }
            }
        }

        // we should never hit this point of the code because only
        // valid dropTargets should be provided to this method.
        return null;
    }

    private enterDragTargetIfExists(
        dropTarget: DropTarget | null,
        mouseEvent: MouseEvent,
        hDirection: HorizontalDirection | null,
        vDirection: VerticalDirection | null,
        fromNudge: boolean
    ): void {
        if (!dropTarget) {
            return;
        }

        if (dropTarget.onDragEnter) {
            const dragEnterEvent = this.createDropTargetEvent(
                dropTarget,
                mouseEvent,
                hDirection,
                vDirection,
                fromNudge
            );

            dropTarget.onDragEnter(dragEnterEvent);
        }
    }

    private leaveLastTargetIfExists(
        mouseEvent: MouseEvent,
        hDirection: HorizontalDirection | null,
        vDirection: VerticalDirection | null,
        fromNudge: boolean
    ): void {
        const { lastDropTarget } = this;
        if (!lastDropTarget) {
            return;
        }

        if (lastDropTarget.onDragLeave) {
            const dragLeaveEvent = this.createDropTargetEvent(
                lastDropTarget,
                mouseEvent,
                hDirection,
                vDirection,
                fromNudge
            );

            lastDropTarget.onDragLeave(dragLeaveEvent);
        }

        const dragAndDropImageComponent = this.getDragAndDropImageComponent();

        if (dragAndDropImageComponent) {
            dragAndDropImageComponent.setIcon(null, false);
        }
    }

    public addDropTarget(dropTarget: DropTarget) {
        this.dropTargets.push(dropTarget);
    }

    public removeDropTarget(dropTarget: DropTarget) {
        this.dropTargets = this.dropTargets.filter((target) => target.getContainer() !== dropTarget.getContainer());
    }

    public hasExternalDropZones(): boolean {
        return this.dropTargets.some((zones) => zones.external);
    }

    public findExternalZone(params: RowDropZoneParams): DropTarget | null {
        const externalTargets = this.dropTargets.filter((target) => target.external);

        return externalTargets.find((zone) => zone.getContainer() === params.getContainer()) || null;
    }

    public isDropZoneWithinThisGrid(draggingEvent: DraggingEvent): boolean {
        const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();
        const gridGui = gridBodyCon.eGridBody;
        const { dropZoneTarget } = draggingEvent;

        return gridGui.contains(dropZoneTarget);
    }

    public getHorizontalDirection(event: MouseEvent): HorizontalDirection | null {
        const clientX = this.eventLastTime?.clientX;
        const eClientX = event.clientX;

        if (clientX === eClientX) {
            return null;
        }

        return clientX! > eClientX ? 'left' : 'right';
    }

    public getVerticalDirection(event: MouseEvent): VerticalDirection | null {
        const clientY = this.eventLastTime?.clientY;
        const eClientY = event.clientY;

        if (clientY === eClientY) {
            return null;
        }

        return clientY! > eClientY ? 'up' : 'down';
    }

    public createDropTargetEvent(
        dropTarget: DropTarget,
        event: MouseEvent,
        hDirection: HorizontalDirection | null,
        vDirection: VerticalDirection | null,
        fromNudge: boolean
    ): DraggingEvent {
        // localise x and y to the target
        const dropZoneTarget = dropTarget.getContainer();
        const rect = dropZoneTarget.getBoundingClientRect();
        const { dragItem, dragSource, gos } = this;
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        return gos.addGridCommonParams({
            event,
            x,
            y,
            vDirection,
            hDirection,
            dragSource: dragSource!,
            fromNudge,
            dragItem: dragItem as DragItem,
            dropZoneTarget,
        });
    }

    private positionDragAndDropImageComp(event: MouseEvent): void {
        const dragAndDropImageComponent = this.getDragAndDropImageComponent();

        if (!dragAndDropImageComponent) {
            return;
        }

        _anchorElementToMouseMoveEvent(dragAndDropImageComponent.getGui(), event, this.beans);
    }

    private removeDragAndDropImageComponent(): void {
        const { dragAndDropImageComp } = this;
        if (dragAndDropImageComp) {
            const { comp } = dragAndDropImageComp;
            if (comp) {
                const eGui = comp.getGui();
                this.dragAndDropImageParent?.removeChild(eGui);
                this.destroyBean(comp);
            }
        }

        this.dragAndDropImageComp = null;
    }

    private createDragAndDropImageComponent(): void {
        const { dragSource } = this;

        if (!dragSource) {
            return;
        }

        const userCompDetails = _getDragAndDropImageCompDetails(this.userCompFactory, {
            dragSource,
        });
        if (!userCompDetails) {
            return;
        }

        const promise = userCompDetails.newAgStackInstance()!;
        this.dragAndDropImageComp = {
            promise,
        };

        promise.then((comp) => {
            if (!comp || !this.isAlive()) {
                return;
            }

            this.processDragAndDropImageComponent(comp);
            this.dragAndDropImageComp!.comp = comp;
        });
    }

    private processDragAndDropImageComponent(dragAndDropImageComponent: IDragAndDropImageComponent): void {
        const { dragSource, environment } = this;

        if (!dragSource) {
            return;
        }
        const eGui = dragAndDropImageComponent.getGui();

        eGui.style.setProperty('position', 'absolute');
        eGui.style.setProperty('z-index', '9999');

        _stampTopLevelGridCompWithGridInstance(this.gos, eGui);
        environment.applyThemeClasses(eGui);
        dragAndDropImageComponent.setIcon(null, false);

        let { dragItemName } = dragSource;

        if (typeof dragItemName === 'function') {
            dragItemName = dragItemName();
        }

        dragAndDropImageComponent.setLabel(dragItemName || '');

        eGui.style.top = '20px';
        eGui.style.left = '20px';

        const targetEl = _getPageBody(this.beans);

        this.dragAndDropImageParent = targetEl;

        if (!targetEl) {
            _warn(54);
        } else {
            targetEl.appendChild(eGui);
        }
    }

    public registerGridDropTarget(elementFn: () => HTMLElement, ctrl: BeanStub): void {
        // this drop target is just used to see if the drop event is inside the grid
        const dropTarget: DropTarget = {
            getContainer: elementFn,
            isInterestedIn: (type) => type === DragSourceType.HeaderCell || type === DragSourceType.ToolPanel,
            getIconName: () => 'notAllowed',
        };
        this.addDropTarget(dropTarget);
        ctrl.addDestroyFunc(() => this.removeDropTarget(dropTarget));
    }
}
