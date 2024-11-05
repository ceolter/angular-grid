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
        // don't do it if already editing
        if (rowCtrl.editing) {
            return true;
        }

        let preventDefault = true;
        let atLeastOneEditing = false;
        const { editSvc } = this.beans;
        rowCtrl.getAllCellCtrls().forEach((cellCtrl: CellCtrl) => {
            const cellStartedEdit = cellCtrl === sourceRenderedCell;
            if (cellStartedEdit) {
                preventDefault = editSvc?.startEditing(cellCtrl, key, cellStartedEdit, event) ?? true;
            } else {
                editSvc?.startEditing(cellCtrl, null, cellStartedEdit, event);
            }
            atLeastOneEditing ||= cellCtrl.editing;
        });

        if (atLeastOneEditing) {
            this.setEditing(rowCtrl, true);
        }
        return preventDefault;
    }

    public setEditing(rowCtrl: RowCtrl, value: boolean): void {
        rowCtrl.editing = value;
        rowCtrl.forEachGui(undefined, (gui) => gui.rowComp.addOrRemoveCssClass('ag-row-editing', value));

        const event: RowEditingStartedEvent | RowEditingStoppedEvent = value
            ? rowCtrl.createRowEvent('rowEditingStarted')
            : rowCtrl.createRowEvent('rowEditingStopped');

        this.eventSvc.dispatchEvent(event);
    }
}
