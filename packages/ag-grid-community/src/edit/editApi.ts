import type { StartEditingCellParams } from '../api/gridApi';
import { ensureColumnVisible, ensureIndexVisible } from '../api/scrollApi';
import { _unwrapUserComp } from '../components/framework/unwrapUserComp';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import { _getCellByPosition } from '../entities/positionUtils';
import { _getActiveDomElement } from '../gridOptionsUtils';
import type { GetCellEditorInstancesParams, ICellEditor } from '../interfaces/iCellEditor';
import type { CellPosition } from '../interfaces/iCellPosition';
import { _warn } from '../validation/logging';

export function undoCellEditing(beans: BeanCollection): void {
    beans.undoRedo?.undo('api');
}

export function redoCellEditing(beans: BeanCollection): void {
    beans.undoRedo?.redo('api');
}

export function getCellEditorInstances<TData = any>(
    beans: BeanCollection,
    params: GetCellEditorInstancesParams<TData> = {}
): ICellEditor[] {
    const res: ICellEditor[] = [];

    beans.rowRenderer.getCellCtrls(params.rowNodes, params.columns as AgColumn[]).forEach((cellCtrl) => {
        const cellEditor = cellCtrl.getCellEditor() as ICellEditor;

        if (cellEditor) {
            res.push(_unwrapUserComp(cellEditor));
        }
    });

    return res;
}

export function getEditingCells(beans: BeanCollection): CellPosition[] {
    const res: CellPosition[] = [];

    beans.rowRenderer.getAllCellCtrls().forEach((cellCtrl) => {
        if (cellCtrl.isEditing()) {
            const cellPosition = cellCtrl.getCellPosition();
            res.push(cellPosition);
        }
    });

    return res;
}

export function stopEditing(beans: BeanCollection, cancel: boolean = false): void {
    beans.editSvc?.stopAllEditing(cancel);
}

export function startEditingCell(beans: BeanCollection, params: StartEditingCellParams): void {
    const column = beans.colModel.getCol(params.colKey);
    if (!column) {
        _warn(12, { colKey: params.colKey });
        return;
    }
    const cellPosition: CellPosition = {
        rowIndex: params.rowIndex,
        rowPinned: params.rowPinned || null,
        column: column,
    };
    const notPinned = params.rowPinned == null;
    if (notPinned) {
        ensureIndexVisible(beans, params.rowIndex);
    }

    ensureColumnVisible(beans, params.colKey);

    const cell = _getCellByPosition(beans, cellPosition);
    if (!cell) {
        return;
    }
    const { focusSvc, gos } = beans;
    const isFocusWithinCell = () => {
        const activeElement = _getActiveDomElement(gos);
        const eCell = cell.getGui();
        return activeElement !== eCell && !!eCell?.contains(activeElement);
    };
    const forceBrowserFocus = gos.get('stopEditingWhenCellsLoseFocus') && isFocusWithinCell();
    if (forceBrowserFocus || !focusSvc.isCellFocused(cellPosition)) {
        focusSvc.setFocusedCell({
            ...cellPosition,
            forceBrowserFocus,
            preventScrollOnBrowserFocus: true,
        });
    }
    cell.startRowOrCellEdit(params.key);
}

export function getCurrentUndoSize(beans: BeanCollection): number {
    return beans.undoRedo?.getCurrentUndoStackSize() ?? 0;
}

export function getCurrentRedoSize(beans: BeanCollection): number {
    return beans.undoRedo?.getCurrentRedoStackSize() ?? 0;
}
