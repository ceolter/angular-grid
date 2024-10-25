import { isColumnSelectionCol } from '../columns/columnUtils';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { SelectAllMode } from '../entities/gridOptions';
import type { SelectionEventSourceType } from '../events';
import {
    _getActiveDomElement,
    _getHeaderCheckbox,
    _isClientSideRowModel,
    _isMultiRowSelection,
    _isServerSideRowModel,
} from '../gridOptionsUtils';
import type { HeaderCellCtrl } from '../headerRendering/cells/column/headerCellCtrl';
import type { IRowModel } from '../interfaces/iRowModel';
import type { ISelectionService } from '../interfaces/iSelectionService';
import { _setAriaRole } from '../utils/aria';
import { _warn } from '../validation/logging';
import { AgCheckbox } from '../widgets/agCheckbox';

export class SelectAllFeature extends BeanStub {
    private rowModel: IRowModel;
    private selectionSvc: ISelectionService;

    public wireBeans(beans: BeanCollection): void {
        this.rowModel = beans.rowModel;
        this.selectionSvc = beans.selectionSvc!;
    }

    private cbSelectAllVisible = false;
    private processingEventFromCheckbox = false;
    private column: AgColumn;
    private headerCellCtrl: HeaderCellCtrl;

    private cbSelectAll: AgCheckbox;

    constructor(column: AgColumn) {
        super();
        this.column = column;
    }

    public onSpaceKeyDown(e: KeyboardEvent): void {
        const checkbox = this.cbSelectAll;

        if (checkbox.isDisplayed() && !checkbox.getGui().contains(_getActiveDomElement(this.gos))) {
            e.preventDefault();
            checkbox.setValue(!checkbox.getValue());
        }
    }

    public getCheckboxGui(): HTMLElement {
        return this.cbSelectAll.getGui();
    }

    public setComp(ctrl: HeaderCellCtrl): void {
        this.headerCellCtrl = ctrl;
        this.cbSelectAll = this.createManagedBean(new AgCheckbox());
        this.cbSelectAll.addCssClass('ag-header-select-all');
        _setAriaRole(this.cbSelectAll.getGui(), 'presentation');
        this.showOrHideSelectAll();

        this.addManagedEventListeners({
            newColumnsLoaded: this.onNewColumnsLoaded.bind(this),
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this),
            selectionChanged: this.onSelectionChanged.bind(this),
            paginationChanged: this.onSelectionChanged.bind(this),
            modelUpdated: this.onModelChanged.bind(this),
        });

        this.addManagedListeners(this.cbSelectAll, { fieldValueChanged: this.onCbSelectAll.bind(this) });
        this.cbSelectAll.getInputElement().setAttribute('tabindex', '-1');
        this.refreshSelectAllLabel();
    }

    private onNewColumnsLoaded(): void {
        this.showOrHideSelectAll();
    }

    private onDisplayedColumnsChanged(): void {
        if (!this.isAlive()) {
            return;
        }
        this.showOrHideSelectAll();
    }

    private showOrHideSelectAll(): void {
        this.cbSelectAllVisible = this.isCheckboxSelection();
        this.cbSelectAll.setDisplayed(this.cbSelectAllVisible);
        if (this.cbSelectAllVisible) {
            // in case user is trying this feature with the wrong model type
            this.checkRightRowModelType('selectAllCheckbox');
            // in case user is trying this feature with the wrong model type
            this.checkSelectionType('selectAllCheckbox');
            // make sure checkbox is showing the right state
            this.updateStateOfCheckbox();
        }
        this.refreshSelectAllLabel();
    }

    private onModelChanged(): void {
        if (!this.cbSelectAllVisible) {
            return;
        }
        this.updateStateOfCheckbox();
    }

    private onSelectionChanged(): void {
        if (!this.cbSelectAllVisible) {
            return;
        }
        this.updateStateOfCheckbox();
    }

    private updateStateOfCheckbox(): void {
        if (this.processingEventFromCheckbox) {
            return;
        }

        this.processingEventFromCheckbox = true;

        const selectAllMode = this.getSelectAllMode();

        const allSelected = this.selectionSvc.getSelectAllState(selectAllMode);
        this.cbSelectAll.setValue(allSelected!);

        const hasNodesToSelect = this.selectionSvc.hasNodesToSelect(selectAllMode);
        this.cbSelectAll.setDisabled(!hasNodesToSelect);

        this.refreshSelectAllLabel();

        this.processingEventFromCheckbox = false;
    }

    private refreshSelectAllLabel(): void {
        const translate = this.getLocaleTextFunc();
        const checked = this.cbSelectAll.getValue();
        const ariaStatus = checked ? translate('ariaChecked', 'checked') : translate('ariaUnchecked', 'unchecked');
        const ariaLabel = translate('ariaRowSelectAll', 'Press Space to toggle all rows selection');

        if (!this.cbSelectAllVisible) {
            this.headerCellCtrl.setAriaDescriptionProperty('selectAll', null);
        } else {
            this.headerCellCtrl.setAriaDescriptionProperty('selectAll', `${ariaLabel} (${ariaStatus})`);
        }

        this.cbSelectAll.setInputAriaLabel(translate('ariaHeaderSelection', 'Column with Header Selection'));
        this.headerCellCtrl.announceAriaDescription();
    }

    private checkSelectionType(feature: string): boolean {
        const isMultiSelect = _isMultiRowSelection(this.gos);

        if (!isMultiSelect) {
            _warn(128, { feature });
            return false;
        }
        return true;
    }

    private checkRightRowModelType(feature: string): boolean {
        const rowModelMatches = _isClientSideRowModel(this.gos) || _isServerSideRowModel(this.gos);

        if (!rowModelMatches) {
            _warn(129, { feature, rowModel: this.rowModel.getType() });
            return false;
        }
        return true;
    }

    private onCbSelectAll(): void {
        if (this.processingEventFromCheckbox) {
            return;
        }
        if (!this.cbSelectAllVisible) {
            return;
        }

        const value = this.cbSelectAll.getValue();
        const selectAll = this.getSelectAllMode();

        let source: SelectionEventSourceType = 'uiSelectAll';
        if (selectAll === 'currentPage') {
            source = 'uiSelectAllCurrentPage';
        } else if (selectAll === 'filtered') {
            source = 'uiSelectAllFiltered';
        }

        const params = { source, selectAll };
        if (value) {
            this.selectionSvc.selectAllRowNodes(params);
        } else {
            this.selectionSvc.deselectAllRowNodes(params);
        }
    }

    /**
     * Checkbox is enabled when either the `headerCheckbox` option is enabled in the new selection API
     * or `headerCheckboxSelection` is enabled in the legacy API.
     */
    private isCheckboxSelection(): boolean {
        const so = this.gos.get('rowSelection');
        const newHeaderCheckbox = typeof so === 'object' && _getHeaderCheckbox(so) && isColumnSelectionCol(this.column);
        const headerCheckboxSelection = this.column.getColDef().headerCheckboxSelection;

        let result = false;
        if (newHeaderCheckbox) {
            result = true;
        } else if (typeof headerCheckboxSelection === 'function') {
            result = headerCheckboxSelection(
                this.gos.addGridCommonParams({
                    column: this.column,
                    colDef: this.column.getColDef(),
                })
            );
        } else {
            result = !!headerCheckboxSelection;
        }

        return (
            result &&
            this.checkRightRowModelType(newHeaderCheckbox ? 'headerCheckbox' : 'headerCheckboxSelection') &&
            this.checkSelectionType(newHeaderCheckbox ? 'headerCheckbox' : 'headerCheckboxSelection')
        );
    }

    private getSelectAllMode(): SelectAllMode {
        const so = this.gos.get('rowSelection');
        if (typeof so === 'object') {
            return (so.mode === 'multiRow' && so.selectAll) || 'all';
        }
        const { headerCheckboxSelectionCurrentPageOnly, headerCheckboxSelectionFilteredOnly } = this.column.getColDef();
        if (headerCheckboxSelectionCurrentPageOnly) {
            return 'currentPage';
        }
        if (headerCheckboxSelectionFilteredOnly) {
            return 'filtered';
        }
        return 'all';
    }
}
