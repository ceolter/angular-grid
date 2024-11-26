import { isColumnGroupAutoCol, isColumnSelectionCol } from '../columns/columnUtils';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { SelectAllMode } from '../entities/gridOptions';
import type { SelectionEventSourceType } from '../events';
import {
    _getActiveDomElement,
    _getCheckboxLocation,
    _getHeaderCheckbox,
    _getSelectAll,
    _isClientSideRowModel,
    _isMultiRowSelection,
    _isServerSideRowModel,
} from '../gridOptionsUtils';
import type { HeaderCellCtrl } from '../headerRendering/cells/column/headerCellCtrl';
import { _setAriaRole } from '../utils/aria';
import { _warn } from '../validation/logging';
import { AgCheckbox } from '../widgets/agCheckbox';

export class SelectAllFeature extends BeanStub {
    private cbSelectAllVisible = false;
    private processingEventFromCheckbox = false;
    private headerCellCtrl: HeaderCellCtrl;

    private cbSelectAll: AgCheckbox;

    constructor(private readonly column: AgColumn) {
        super();
    }

    public onSpaceKeyDown(e: KeyboardEvent): void {
        const checkbox = this.cbSelectAll;

        if (checkbox.isDisplayed() && !checkbox.getGui().contains(_getActiveDomElement(this.beans))) {
            e.preventDefault();
            checkbox.setValue(!checkbox.getValue());
        }
    }

    public getCheckboxGui(): HTMLElement {
        return this.cbSelectAll.getGui();
    }

    public setComp(ctrl: HeaderCellCtrl): void {
        this.headerCellCtrl = ctrl;
        const cbSelectAll = this.createManagedBean(new AgCheckbox());
        this.cbSelectAll = cbSelectAll;
        cbSelectAll.addCssClass('ag-header-select-all');
        _setAriaRole(cbSelectAll.getGui(), 'presentation');
        this.showOrHideSelectAll();

        this.addManagedEventListeners({
            newColumnsLoaded: this.showOrHideSelectAll.bind(this),
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this),
            selectionChanged: this.onSelectionChanged.bind(this),
            paginationChanged: this.onSelectionChanged.bind(this),
            modelUpdated: this.onModelChanged.bind(this),
        });

        this.addManagedListeners(cbSelectAll, { fieldValueChanged: this.onCbSelectAll.bind(this) });
        cbSelectAll.getInputElement().setAttribute('tabindex', '-1');
        this.refreshSelectAllLabel();
    }

    private onDisplayedColumnsChanged(): void {
        if (!this.isAlive()) {
            return;
        }
        this.showOrHideSelectAll();
    }

    private showOrHideSelectAll(): void {
        const cbSelectAllVisible = this.isCheckboxSelection();
        this.cbSelectAllVisible = cbSelectAllVisible;
        this.cbSelectAll.setDisplayed(cbSelectAllVisible);
        if (cbSelectAllVisible) {
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

        const selectionSvc = this.beans.selectionSvc!;
        const cbSelectAll = this.cbSelectAll;

        const allSelected = selectionSvc.getSelectAllState(selectAllMode);
        cbSelectAll.setValue(allSelected!);

        const hasNodesToSelect = selectionSvc.hasNodesToSelect(selectAllMode);
        cbSelectAll.setDisabled(!hasNodesToSelect);

        this.refreshSelectAllLabel();

        this.processingEventFromCheckbox = false;
    }

    private refreshSelectAllLabel(): void {
        const translate = this.getLocaleTextFunc();
        const { headerCellCtrl, cbSelectAll, cbSelectAllVisible } = this;
        const checked = cbSelectAll.getValue();
        const ariaStatus = checked ? translate('ariaChecked', 'checked') : translate('ariaUnchecked', 'unchecked');
        const ariaLabel = translate('ariaRowSelectAll', 'Press Space to toggle all rows selection');

        headerCellCtrl.setAriaDescriptionProperty(
            'selectAll',
            cbSelectAllVisible ? `${ariaLabel} (${ariaStatus})` : null
        );

        cbSelectAll.setInputAriaLabel(translate('ariaHeaderSelection', 'Column with Header Selection'));
        headerCellCtrl.announceAriaDescription();
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
        const { gos, rowModel } = this.beans;
        const rowModelMatches = _isClientSideRowModel(gos) || _isServerSideRowModel(gos);

        if (!rowModelMatches) {
            _warn(129, { feature, rowModel: rowModel.getType() });
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
        const selectionSvc = this.beans.selectionSvc!;
        if (value) {
            selectionSvc.selectAllRowNodes(params);
        } else {
            selectionSvc.deselectAllRowNodes(params);
        }
    }

    /**
     * Checkbox is enabled when either the `headerCheckbox` option is enabled in the new selection API
     * or `headerCheckboxSelection` is enabled in the legacy API.
     */
    private isCheckboxSelection(): boolean {
        const { column, gos, beans } = this;
        const rowSelection = gos.get('rowSelection');
        const colDef = column.getColDef();
        const { headerCheckboxSelection } = colDef;

        let result = false;
        const newHeaderCheckbox = typeof rowSelection === 'object';
        if (newHeaderCheckbox) {
            // new selection config
            const isSelectionCol = isColumnSelectionCol(column);
            const isAutoCol = isColumnGroupAutoCol(column);
            // default to displaying header checkbox in the selection column
            const location = _getCheckboxLocation(rowSelection);
            if (
                (location === 'autoGroupColumn' && isAutoCol) ||
                (isSelectionCol && beans.selectionColSvc?.isSelectionColumnEnabled())
            ) {
                result = _getHeaderCheckbox(rowSelection);
            }
        } else {
            // legacy selection config
            if (typeof headerCheckboxSelection === 'function') {
                result = headerCheckboxSelection(gos.addGridCommonParams({ column, colDef }));
            } else {
                result = !!headerCheckboxSelection;
            }
        }

        const featureName = newHeaderCheckbox ? 'headerCheckbox' : 'headerCheckboxSelection';

        return result && this.checkRightRowModelType(featureName) && this.checkSelectionType(featureName);
    }

    private getSelectAllMode(): SelectAllMode {
        const selectAll = _getSelectAll(this.gos, false);
        if (selectAll) {
            return selectAll;
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
