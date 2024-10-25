import type { BeanCollection } from '../context/context';
import type { RowDropZoneEvents, RowDropZoneParams } from './rowDragFeature';

export function addRowDropZone(beans: BeanCollection, params: RowDropZoneParams): void {
    beans.rowDragSvc?.getRowDragFeature()?.addRowDropZone(params);
}

export function removeRowDropZone(beans: BeanCollection, params: RowDropZoneParams): void {
    const activeDropTarget = beans.dragAndDrop?.findExternalZone(params);

    if (activeDropTarget) {
        beans.dragAndDrop?.removeDropTarget(activeDropTarget);
    }
}

export function getRowDropZoneParams(beans: BeanCollection, events?: RowDropZoneEvents): RowDropZoneParams | undefined {
    return beans.rowDragSvc?.getRowDragFeature()?.getRowDropZone(events);
}
