import type { ColumnModel } from '../../columns/columnModel';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type {
    DragAndDropIcon,
    DragAndDropService,
    DraggingEvent,
    DropTarget,
} from '../../dragAndDrop/dragAndDropService';
import { DragSourceType } from '../../dragAndDrop/dragAndDropService';
import type { ColumnPinnedType } from '../../interfaces/iColumn';
import { BodyDropPivotTarget } from './bodyDropPivotTarget';
import { MoveColumnFeature } from './moveColumnFeature';

export interface DropListener {
    getIconName(): DragAndDropIcon | null;
    onDragEnter(params: DraggingEvent): void;
    onDragLeave(params: DraggingEvent): void;
    onDragging(params: DraggingEvent): void;
    onDragStop(params: DraggingEvent): void;
    onDragCancel(): void;
}

export class BodyDropTarget extends BeanStub implements DropTarget {
    private dragAndDrop: DragAndDropService;
    private colModel: ColumnModel;
    private ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection) {
        this.dragAndDrop = beans.dragAndDrop!;
        this.colModel = beans.colModel;
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private pinned: ColumnPinnedType;
    // public because it's part of the DropTarget interface
    private eContainer: HTMLElement;
    // public because it's part of the DropTarget interface
    private eSecondaryContainers: HTMLElement[][];
    private currentDropListener: DropListener;

    private moveColumnFeature: MoveColumnFeature;
    private bodyDropPivotTarget: BodyDropPivotTarget;

    constructor(pinned: ColumnPinnedType, eContainer: HTMLElement) {
        super();
        this.pinned = pinned;
        this.eContainer = eContainer;
    }

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => {
            switch (this.pinned) {
                case 'left':
                    this.eSecondaryContainers = [
                        [p.gridBodyCtrl.getBodyViewportElement(), p.left.getContainerElement()],
                        [p.bottomLeft.getContainerElement()],
                        [p.topLeft.getContainerElement()],
                    ];
                    break;
                case 'right':
                    this.eSecondaryContainers = [
                        [p.gridBodyCtrl.getBodyViewportElement(), p.right.getContainerElement()],
                        [p.bottomRight.getContainerElement()],
                        [p.topRight.getContainerElement()],
                    ];
                    break;
                default:
                    this.eSecondaryContainers = [
                        [p.gridBodyCtrl.getBodyViewportElement(), p.center.getViewportElement()],
                        [p.bottomCenter.getViewportElement()],
                        [p.topCenter.getViewportElement()],
                    ];
                    break;
            }
        });

        this.moveColumnFeature = this.createManagedBean(new MoveColumnFeature(this.pinned));
        this.bodyDropPivotTarget = this.createManagedBean(new BodyDropPivotTarget(this.pinned));

        this.dragAndDrop.addDropTarget(this);
        this.addDestroyFunc(() => this.dragAndDrop.removeDropTarget(this));
    }

    public isInterestedIn(type: DragSourceType): boolean {
        return (
            type === DragSourceType.HeaderCell ||
            (type === DragSourceType.ToolPanel && this.gos.get('allowDragFromColumnsToolPanel'))
        );
    }

    public getSecondaryContainers(): HTMLElement[][] {
        return this.eSecondaryContainers;
    }

    public getContainer(): HTMLElement {
        return this.eContainer;
    }

    public getIconName(): DragAndDropIcon | null {
        return this.currentDropListener.getIconName();
    }

    // we want to use the bodyPivotTarget if the user is dragging columns in from the toolPanel
    // and we are in pivot mode, as it has to logic to set pivot/value/group on the columns when
    // dropped into the grid's body.
    private isDropColumnInPivotMode(draggingEvent: DraggingEvent): boolean {
        // in pivot mode, then if moving a column (ie didn't come from toolpanel) then it's
        // a standard column move, however if it came from the toolpanel, then we are introducing
        // dimensions or values to the grid
        return this.colModel.isPivotMode() && draggingEvent.dragSource.type === DragSourceType.ToolPanel;
    }

    public onDragEnter(draggingEvent: DraggingEvent): void {
        // we pick the drop listener depending on whether we are in pivot mode are not. if we are
        // in pivot mode, then dropping cols changes the row group, pivot, value stats. otherwise
        // we change visibility state and position.
        this.currentDropListener = this.isDropColumnInPivotMode(draggingEvent)
            ? this.bodyDropPivotTarget
            : this.moveColumnFeature;
        this.currentDropListener.onDragEnter(draggingEvent);
    }

    public onDragLeave(params: DraggingEvent): void {
        this.currentDropListener.onDragLeave(params);
    }

    public onDragging(params: DraggingEvent): void {
        this.currentDropListener.onDragging(params);
    }

    public onDragStop(params: DraggingEvent): void {
        this.currentDropListener.onDragStop(params);
    }

    public onDragCancel(): void {
        this.currentDropListener.onDragCancel();
    }
}
