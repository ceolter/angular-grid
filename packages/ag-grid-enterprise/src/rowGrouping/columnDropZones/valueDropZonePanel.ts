import type { AgColumn, BeanCollection, DragAndDropIcon, DraggingEvent, IColsService } from 'ag-grid-community';
import { _createIconNoSpan } from 'ag-grid-community';

import { BaseDropZonePanel } from './baseDropZonePanel';

export class ValuesDropZonePanel extends BaseDropZonePanel {
    private valueColsSvc?: IColsService;

    constructor(horizontal: boolean) {
        super(horizontal, 'aggregation');
    }

    public override wireBeans(beans: BeanCollection): void {
        super.wireBeans(beans);
        this.valueColsSvc = beans.valueColsSvc;
    }

    public postConstruct(): void {
        const localeTextFunc = this.getLocaleTextFunc();
        const emptyMessage = localeTextFunc('valueColumnsEmptyMessage', 'Drag here to aggregate');
        const title = localeTextFunc('values', 'Values');

        super.init({
            icon: _createIconNoSpan('valuePanel', this.gos, null)!,
            emptyMessage: emptyMessage,
            title: title,
        });

        this.addManagedEventListeners({ columnValueChanged: this.refreshGui.bind(this) });
    }

    protected getAriaLabel(): string {
        const translate = this.getLocaleTextFunc();
        const label = translate('ariaValuesDropZonePanelLabel', 'Values');

        return label;
    }

    protected getIconName(): DragAndDropIcon {
        return this.isPotentialDndItems() ? 'aggregate' : 'notAllowed';
    }

    protected isItemDroppable(column: AgColumn, draggingEvent: DraggingEvent): boolean {
        // we never allow grouping of secondary columns
        if (this.gos.get('functionsReadOnly') || !column.isPrimary()) {
            return false;
        }

        return column.isAllowValue() && (!column.isValueActive() || this.isSourceEventFromTarget(draggingEvent));
    }

    protected updateItems(columns: AgColumn[]): void {
        this.valueColsSvc?.setColumns(columns, 'toolPanelUi');
    }

    protected getExistingItems(): AgColumn[] {
        return this.valueColsSvc?.columns ?? [];
    }
}
