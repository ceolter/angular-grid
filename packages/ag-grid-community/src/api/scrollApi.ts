import type { BeanCollection } from '../context/context';
import type { Column } from '../interfaces/iColumn';
import type { IRowNode } from '../interfaces/iRowNode';

export function getVerticalPixelRange(beans: BeanCollection): { top: number; bottom: number } {
    return beans.ctrlsSvc.getGridBodyCtrl().getScrollFeature().getVScrollPosition();
}

export function getHorizontalPixelRange(beans: BeanCollection): { left: number; right: number } {
    return beans.ctrlsSvc.getGridBodyCtrl().getScrollFeature().getHScrollPosition();
}

export function ensureColumnVisible(
    beans: BeanCollection,
    key: string | Column,
    position: 'auto' | 'start' | 'middle' | 'end' = 'auto'
) {
    beans.frameworkOverrides.wrapIncoming(
        () => beans.ctrlsSvc.getGridBodyCtrl().getScrollFeature().ensureColumnVisible(key, position),
        'ensureVisible'
    );
}

export function ensureIndexVisible(
    beans: BeanCollection,
    index: number,
    position?: 'top' | 'bottom' | 'middle' | null
) {
    beans.frameworkOverrides.wrapIncoming(
        () => beans.ctrlsSvc.getGridBodyCtrl().getScrollFeature().ensureIndexVisible(index, position),
        'ensureVisible'
    );
}

export function ensureNodeVisible<TData = any>(
    beans: BeanCollection,
    nodeSelector: TData | IRowNode<TData> | ((row: IRowNode<TData>) => boolean),
    position: 'top' | 'bottom' | 'middle' | null = null
) {
    beans.frameworkOverrides.wrapIncoming(
        () => beans.ctrlsSvc.getGridBodyCtrl().getScrollFeature().ensureNodeVisible(nodeSelector, position),
        'ensureVisible'
    );
}
