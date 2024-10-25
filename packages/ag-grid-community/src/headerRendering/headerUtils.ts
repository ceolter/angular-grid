import type { ColumnModel } from '../columns/columnModel';
import type { BeanCollection } from '../context/context';
import type { HeaderGroupCellCtrl } from './cells/columnGroup/headerGroupCellCtrl';
import type { HeaderRowCtrl } from './row/headerRowCtrl';

// + gridPanel -> for resizing the body and setting top margin
export function getHeaderRowCount(colModel: ColumnModel): number {
    return colModel.cols ? colModel.cols.treeDepth + 1 : -1;
}

export function getGroupRowsHeight(beans: BeanCollection): number[] {
    const heights: number[] = [];
    const headerRowContainerCtrls = beans.ctrlsSvc.getHeaderRowContainerCtrls();

    for (const headerRowContainerCtrl of headerRowContainerCtrls) {
        if (!headerRowContainerCtrl) {
            continue;
        }

        const groupRowCount = headerRowContainerCtrl.getGroupRowCount() || 0;

        for (let i = 0; i < groupRowCount; i++) {
            const headerRowCtrl = headerRowContainerCtrl.getGroupRowCtrlAtIndex(i);

            const currentHeightAtPos = heights[i];
            if (headerRowCtrl) {
                const newHeight = getColumnGroupHeaderRowHeight(beans, headerRowCtrl);
                if (currentHeightAtPos == null || newHeight > currentHeightAtPos) {
                    heights[i] = newHeight;
                }
            }
        }
    }

    return heights;
}

function getColumnGroupHeaderRowHeight(beans: BeanCollection, headerRowCtrl: HeaderRowCtrl): number {
    const defaultHeight: number = (
        beans.colModel.isPivotMode() ? getPivotGroupHeaderHeight(beans) : getGroupHeaderHeight(beans)
    ) as number;

    let displayedHeights = 0;
    const headerRowCellCtrls = headerRowCtrl.getHeaderCtrls() as HeaderGroupCellCtrl[];
    for (const headerCellCtrl of headerRowCellCtrls) {
        const column = headerCellCtrl.getColumn();
        if (column.isAutoHeaderHeight()) {
            const height = column.getAutoHeaderHeight();
            if (height != null && height > displayedHeights) {
                displayedHeights = height;
            }
        }
    }

    return Math.max(defaultHeight, displayedHeights);
}

export function getColumnHeaderRowHeight(beans: BeanCollection): number {
    const defaultHeight: number = (
        beans.colModel.isPivotMode() ? getPivotHeaderHeight(beans) : getHeaderHeight(beans)
    ) as number;

    const allDisplayedCols = beans.visibleCols.allCols;

    const displayedHeights = allDisplayedCols
        .filter((col) => col.isAutoHeaderHeight())
        .map((col) => col.getAutoHeaderHeight() || 0);

    return Math.max(defaultHeight, ...displayedHeights);
}

export function getHeaderHeight(beans: BeanCollection): number {
    return beans.gos.get('headerHeight') ?? beans.environment.getDefaultHeaderHeight();
}

export function getFloatingFiltersHeight(beans: BeanCollection): number {
    return beans.gos.get('floatingFiltersHeight') ?? getHeaderHeight(beans);
}

function getGroupHeaderHeight(beans: BeanCollection): number {
    return beans.gos.get('groupHeaderHeight') ?? getHeaderHeight(beans);
}

function getPivotHeaderHeight(beans: BeanCollection): number {
    return beans.gos.get('pivotHeaderHeight') ?? getHeaderHeight(beans);
}

function getPivotGroupHeaderHeight(beans: BeanCollection): number {
    return beans.gos.get('pivotGroupHeaderHeight') ?? getGroupHeaderHeight(beans);
}
