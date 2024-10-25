import type { AgColumn, DragAndDropIcon, DraggingEvent } from 'ag-grid-community';
import { _createIconNoSpan } from 'ag-grid-community';

import { BaseDropZonePanel } from './baseDropZonePanel';

export class PivotDropZonePanel extends BaseDropZonePanel {
    constructor(horizontal: boolean) {
        super(horizontal, 'pivot');
    }

    public postConstruct(): void {
        const localeTextFunc = this.getLocaleTextFunc();
        const emptyMessage = localeTextFunc('pivotColumnsEmptyMessage', 'Drag here to set column labels');
        const title = localeTextFunc('pivots', 'Column Labels');

        super.init({
            icon: _createIconNoSpan('pivotPanel', this.beans, null)!,
            emptyMessage: emptyMessage,
            title: title,
        });

        this.addManagedEventListeners({
            newColumnsLoaded: this.refresh.bind(this),
            columnPivotChanged: this.refresh.bind(this),
            columnPivotModeChanged: this.checkVisibility.bind(this),
        });

        this.refresh();
    }

    protected getAriaLabel(): string {
        const translate = this.getLocaleTextFunc();
        const label = translate('ariaPivotDropZonePanelLabel', 'Column Labels');

        return label;
    }

    private refresh(): void {
        this.checkVisibility();
        this.refreshGui();
    }

    private checkVisibility(): void {
        const pivotMode = this.columnModel.isPivotMode();

        if (this.isHorizontal()) {
            // what we do for horizontal (ie the pivot panel at the top) depends
            // on the user property as well as pivotMode.
            switch (this.gos.get('pivotPanelShow')) {
                case 'always':
                    this.setDisplayed(pivotMode);
                    break;
                case 'onlyWhenPivoting': {
                    const pivotActive = this.columnModel.isPivotActive();
                    this.setDisplayed(pivotMode && pivotActive);
                    break;
                }
                default:
                    // never show it
                    this.setDisplayed(false);
                    break;
            }
        } else {
            // in toolPanel, the pivot panel is always shown when pivot mode is on
            this.setDisplayed(pivotMode);
        }
    }

    protected isItemDroppable(column: AgColumn, draggingEvent: DraggingEvent): boolean {
        // we never allow grouping of secondary columns
        if (this.gos.get('functionsReadOnly') || !column.isPrimary()) {
            return false;
        }

        return column.isAllowPivot() && (!column.isPivotActive() || this.isSourceEventFromTarget(draggingEvent));
    }

    protected updateItems(columns: AgColumn[]): void {
        this.funcColsService.setPivotColumns(columns, 'toolPanelUi');
    }

    protected getIconName(): DragAndDropIcon {
        return this.isPotentialDndItems() ? 'pivot' : 'notAllowed';
    }

    protected getExistingItems(): AgColumn[] {
        return this.funcColsService.pivotCols;
    }
}
