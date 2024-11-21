import { BeanStub } from '../../context/beanStub';
import type { DragAndDropIcon, DraggingEvent, DropTarget } from '../../dragAndDrop/dragAndDropService';
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
    private eSecondaryContainers: HTMLElement[][];
    private currentDropListener: DropListener;

    private moveColumnFeature: MoveColumnFeature;
    private bodyDropPivotTarget: BodyDropPivotTarget;

    constructor(
        private readonly pinned: ColumnPinnedType,
        private readonly eContainer: HTMLElement
    ) {
        super();
    }

    public postConstruct(): void {
        const { ctrlsSvc, dragAndDrop } = this.beans;
        const pinned = this.pinned;
        ctrlsSvc.whenReady(this, (p) => {
            let eSecondaryContainers: HTMLElement[][];
            const eBodyViewport = p.gridBodyCtrl.eBodyViewport;
            switch (pinned) {
                case 'left':
                    eSecondaryContainers = [
                        [eBodyViewport, p.left.eContainer],
                        [p.bottomLeft.eContainer],
                        [p.topLeft.eContainer],
                    ];
                    break;
                case 'right':
                    eSecondaryContainers = [
                        [eBodyViewport, p.right.eContainer],
                        [p.bottomRight.eContainer],
                        [p.topRight.eContainer],
                    ];
                    break;
                default:
                    eSecondaryContainers = [
                        [eBodyViewport, p.center.eViewport],
                        [p.bottomCenter.eViewport],
                        [p.topCenter.eViewport],
                    ];
                    break;
            }
            this.eSecondaryContainers = eSecondaryContainers;
        });

        this.moveColumnFeature = this.createManagedBean(new MoveColumnFeature(pinned));
        this.bodyDropPivotTarget = this.createManagedBean(new BodyDropPivotTarget(pinned));

        dragAndDrop!.addDropTarget(this);
        this.addDestroyFunc(() => dragAndDrop!.removeDropTarget(this));
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
        return this.beans.colModel.isPivotMode() && draggingEvent.dragSource.type === DragSourceType.ToolPanel;
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
