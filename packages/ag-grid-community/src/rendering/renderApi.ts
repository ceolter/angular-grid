import { _unwrapUserComp } from '../components/framework/unwrapUserComp';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import { _getRowHeightAsNumber } from '../gridOptionsUtils';
import { getHeaderHeight } from '../headerRendering/headerUtils';
import type { FlashCellsParams, RefreshCellsParams } from '../interfaces/iCellsParams';
import type { GetCellRendererInstancesParams, ICellRenderer } from './cellRenderers/iCellRenderer';
import { isRowInMap, mapRowNodes } from './rowRenderer';

export function setGridAriaProperty(beans: BeanCollection, property: string, value: string | null): void {
    if (!property) {
        return;
    }
    const eGrid = beans.ctrlsSvc.getGridBodyCtrl().getGui();
    const ariaProperty = `aria-${property}`;

    if (value === null) {
        eGrid.removeAttribute(ariaProperty);
    } else {
        eGrid.setAttribute(ariaProperty, value);
    }
}

export function refreshCells<TData = any>(beans: BeanCollection, params: RefreshCellsParams<TData> = {}): void {
    beans.frameworkOverrides.wrapIncoming(() => beans.rowRenderer.refreshCells(params));
}

export function flashCells<TData = any>(beans: BeanCollection, params: FlashCellsParams<TData> = {}): void {
    const { cellFlashSvc } = beans;
    if (!cellFlashSvc) {
        return;
    }
    beans.frameworkOverrides.wrapIncoming(() => {
        beans.rowRenderer
            .getCellCtrls(params.rowNodes, params.columns as AgColumn[])
            .forEach((cellCtrl) => cellFlashSvc.flashCell(cellCtrl, params));
    });
}

export function refreshHeader(beans: BeanCollection) {
    beans.frameworkOverrides.wrapIncoming(() =>
        beans.ctrlsSvc.getHeaderRowContainerCtrls().forEach((c) => c.refresh())
    );
}

export function isAnimationFrameQueueEmpty(beans: BeanCollection): boolean {
    return beans.animationFrameSvc?.isQueueEmpty() ?? true;
}

export function flushAllAnimationFrames(beans: BeanCollection): void {
    beans.animationFrameSvc?.flushAllFrames();
}

export function getSizesForCurrentTheme(beans: BeanCollection) {
    return {
        rowHeight: _getRowHeightAsNumber(beans.gos),
        headerHeight: getHeaderHeight(beans),
    };
}

export function getCellRendererInstances<TData = any>(
    beans: BeanCollection,
    params: GetCellRendererInstancesParams<TData> = {}
): ICellRenderer[] {
    const cellRenderers: ICellRenderer[] = [];
    beans.rowRenderer.getCellCtrls(params.rowNodes, params.columns as AgColumn[]).forEach((cellCtrl) => {
        const cellRenderer = cellCtrl.getCellRenderer();
        if (cellRenderer != null) {
            cellRenderers.push(_unwrapUserComp(cellRenderer));
        }
    });
    if (params.columns?.length) {
        return cellRenderers;
    }

    const fullWidthRenderers: ICellRenderer[] = [];
    const rowIdMap = mapRowNodes(params.rowNodes);

    beans.rowRenderer.getAllRowCtrls().forEach((rowCtrl) => {
        if (rowIdMap && !isRowInMap(rowCtrl.getRowNode(), rowIdMap)) {
            return;
        }

        if (!rowCtrl.isFullWidth()) {
            return;
        }

        const renderers = rowCtrl.getFullWidthCellRenderers();
        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            if (renderer != null) {
                fullWidthRenderers.push(_unwrapUserComp(renderer));
            }
        }
    });

    return [...fullWidthRenderers, ...cellRenderers];
}
