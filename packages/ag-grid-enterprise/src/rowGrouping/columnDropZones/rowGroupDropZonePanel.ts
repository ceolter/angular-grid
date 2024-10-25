import type { AgColumn, DragAndDropIcon, DraggingEvent } from 'ag-grid-community';
import { _createIconNoSpan } from 'ag-grid-community';

import { BaseDropZonePanel } from './baseDropZonePanel';

export class RowGroupDropZonePanel extends BaseDropZonePanel {
    constructor(horizontal: boolean) {
        super(horizontal, 'rowGroup');
    }

    public postConstruct(): void {
        const localeTextFunc = this.getLocaleTextFunc();
        const emptyMessage = localeTextFunc('rowGroupColumnsEmptyMessage', 'Drag here to set row groups');
        const title = localeTextFunc('groups', 'Row Groups');

        super.init({
            icon: _createIconNoSpan('rowGroupPanel', this.beans, null)!,
            emptyMessage: emptyMessage,
            title,
        });

        this.addManagedEventListeners({ columnRowGroupChanged: this.refreshGui.bind(this) });
    }

    protected getAriaLabel(): string {
        const translate = this.getLocaleTextFunc();
        const label = translate('ariaRowGroupDropZonePanelLabel', 'Row Groups');

        return label;
    }

    protected isItemDroppable(column: AgColumn, draggingEvent: DraggingEvent): boolean {
        // we never allow grouping of secondary columns
        if (this.gos.get('functionsReadOnly') || !column.isPrimary()) {
            return false;
        }

        return column.isAllowRowGroup() && (!column.isRowGroupActive() || this.isSourceEventFromTarget(draggingEvent));
    }

    protected updateItems(columns: AgColumn[]) {
        this.funcColsService.setRowGroupColumns(columns, 'toolPanelUi');
    }

    protected getIconName(): DragAndDropIcon {
        return this.isPotentialDndItems() ? 'group' : 'notAllowed';
    }

    protected getExistingItems(): AgColumn[] {
        return this.funcColsService.rowGroupCols;
    }
}
