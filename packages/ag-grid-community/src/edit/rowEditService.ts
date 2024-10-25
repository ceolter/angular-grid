import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { RowEditingStartedEvent, RowEditingStoppedEvent } from '../events';
import type { CellCtrl } from '../rendering/cell/cellCtrl';
import type { RowCtrl } from '../rendering/row/rowCtrl';

export class RowEditService extends BeanStub implements NamedBean {
    beanName = 'rowEditSvc' as const;

    public startEditing(
        rowCtrl: RowCtrl,
        key: string | null = null,
        sourceRenderedCell: CellCtrl | null = null,
        event: KeyboardEvent | null = null
    ): boolean {
        let preventDefault = true;
        let atLeastOneEditing = false;
        rowCtrl.getAllCellCtrls().forEach((cellCtrl: CellCtrl) => {
            const cellStartedEdit = cellCtrl === sourceRenderedCell;
            if (cellStartedEdit) {
                preventDefault = cellCtrl.startEditing(key, cellStartedEdit, event);
            } else {
                cellCtrl.startEditing(null, cellStartedEdit, event);
            }
            atLeastOneEditing ||= cellCtrl.isEditing();
        });

        if (atLeastOneEditing) {
            this.setEditing(rowCtrl, true);
        }
        return preventDefault;
    }

    public stopEditing(rowCtrl: RowCtrl, cancel = false): void {
        const cellControls = rowCtrl.getAllCellCtrls();
        const isRowEdit = rowCtrl.isEditing();

        rowCtrl.setStoppingRowEdit(true);

        let fireRowEditEvent = false;
        for (const ctrl of cellControls) {
            const valueChanged = ctrl.stopEditing(cancel);
            if (isRowEdit && !cancel && !fireRowEditEvent && valueChanged) {
                fireRowEditEvent = true;
            }
        }

        if (fireRowEditEvent) {
            this.eventSvc.dispatchEvent(rowCtrl.createRowEvent('rowValueChanged'));
        }

        if (isRowEdit) {
            this.setEditing(rowCtrl, false);
        }

        rowCtrl.setStoppingRowEdit(false);
    }

    private setEditing(rowCtrl: RowCtrl, value: boolean): void {
        rowCtrl.setEditingRow(value);
        rowCtrl.forEachGui(undefined, (gui) => gui.rowComp.addOrRemoveCssClass('ag-row-editing', value));

        const event: RowEditingStartedEvent | RowEditingStoppedEvent = value
            ? rowCtrl.createRowEvent('rowEditingStarted')
            : rowCtrl.createRowEvent('rowEditingStopped');

        this.eventSvc.dispatchEvent(event);
    }
}
