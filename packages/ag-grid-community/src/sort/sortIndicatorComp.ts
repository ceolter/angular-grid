import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import { _isColumnsSortingCoupledToGroup } from '../gridOptionsUtils';
import { _clearElement, _setDisplayed } from '../utils/dom';
import type { IconName } from '../utils/icon';
import { _createIconNoSpan } from '../utils/icon';
import type { ComponentSelector } from '../widgets/component';
import { Component, RefPlaceholder } from '../widgets/component';
import type { SortService } from './sortService';

function makeSpan(dataRefSuffix: string, classSuffix: string) {
    return /* html */ `<span data-ref="eSort${dataRefSuffix}" class="ag-sort-indicator-icon ag-sort-${classSuffix} ag-hidden" aria-hidden="true"></span>`;
}

const SortIndicatorTemplate = /* html */ `<span class="ag-sort-indicator-container">
        ${makeSpan('Order', 'order')}
        ${makeSpan('Asc', 'ascending-icon')}
        ${makeSpan('Desc', 'descending-icon')}
        ${makeSpan('Mixed', 'mixed-icon')}
        ${makeSpan('None', 'none-icon')}
    </span>`;
export class SortIndicatorComp extends Component {
    private sortSvc: SortService;

    public wireBeans(beans: BeanCollection): void {
        this.sortSvc = beans.sortSvc!;
    }

    private eSortOrder: HTMLElement = RefPlaceholder;
    private eSortAsc: HTMLElement = RefPlaceholder;
    private eSortDesc: HTMLElement = RefPlaceholder;
    private eSortMixed: HTMLElement = RefPlaceholder;
    private eSortNone: HTMLElement = RefPlaceholder;

    private column: AgColumn;
    private suppressOrder: boolean;

    constructor(skipTemplate?: boolean) {
        super();

        if (!skipTemplate) {
            this.setTemplate(SortIndicatorTemplate);
        }
    }

    public attachCustomElements(
        eSortOrder: HTMLElement,
        eSortAsc: HTMLElement,
        eSortDesc: HTMLElement,
        eSortMixed: HTMLElement,
        eSortNone: HTMLElement
    ) {
        this.eSortOrder = eSortOrder;
        this.eSortAsc = eSortAsc;
        this.eSortDesc = eSortDesc;
        this.eSortMixed = eSortMixed;
        this.eSortNone = eSortNone;
    }

    public setupSort(column: AgColumn, suppressOrder: boolean = false): void {
        this.column = column;
        this.suppressOrder = suppressOrder;

        this.setupMultiSortIndicator();

        if (!this.column.isSortable() && !this.column.getColDef().showRowGroup) {
            return;
        }

        this.addInIcon('sortAscending', this.eSortAsc, column);
        this.addInIcon('sortDescending', this.eSortDesc, column);
        this.addInIcon('sortUnSort', this.eSortNone, column);

        const updateIcons = this.updateIcons.bind(this);
        const sortUpdated = this.onSortChanged.bind(this);
        this.addManagedPropertyListener('unSortIcon', updateIcons);
        this.addManagedEventListeners({
            newColumnsLoaded: updateIcons,
            // Watch global events, as row group columns can effect their display column.
            sortChanged: sortUpdated,
            // when grouping changes so can sort indexes and icons
            columnRowGroupChanged: sortUpdated,
        });

        this.onSortChanged();
    }

    private addInIcon(iconName: IconName, eParent: HTMLElement, column: AgColumn): void {
        if (eParent == null) {
            return;
        }

        const eIcon = _createIconNoSpan(iconName, this.beans, column);
        if (eIcon) {
            eParent.appendChild(eIcon);
        }
    }

    private onSortChanged(): void {
        this.updateIcons();
        if (!this.suppressOrder) {
            this.updateSortOrder();
        }
    }

    private updateIcons(): void {
        const sortDirection = this.sortSvc.getDisplaySortForColumn(this.column);

        if (this.eSortAsc) {
            const isAscending = sortDirection === 'asc';
            _setDisplayed(this.eSortAsc, isAscending, { skipAriaHidden: true });
        }

        if (this.eSortDesc) {
            const isDescending = sortDirection === 'desc';
            _setDisplayed(this.eSortDesc, isDescending, { skipAriaHidden: true });
        }

        if (this.eSortNone) {
            const alwaysHideNoSort = !this.column.getColDef().unSortIcon && !this.gos.get('unSortIcon');
            const isNone = sortDirection === null || sortDirection === undefined;
            _setDisplayed(this.eSortNone, !alwaysHideNoSort && isNone, { skipAriaHidden: true });
        }
    }

    private setupMultiSortIndicator() {
        this.addInIcon('sortUnSort', this.eSortMixed, this.column);

        const isColumnShowingRowGroup = this.column.getColDef().showRowGroup;
        const areGroupsCoupled = _isColumnsSortingCoupledToGroup(this.gos);
        if (areGroupsCoupled && isColumnShowingRowGroup) {
            this.addManagedEventListeners({
                // Watch global events, as row group columns can effect their display column.
                sortChanged: this.updateMultiSortIndicator.bind(this),
                // when grouping changes so can sort indexes and icons
                columnRowGroupChanged: this.updateMultiSortIndicator.bind(this),
            });
            this.updateMultiSortIndicator();
        }
    }

    private updateMultiSortIndicator() {
        if (this.eSortMixed) {
            const isMixedSort = this.sortSvc.getDisplaySortForColumn(this.column) === 'mixed';
            _setDisplayed(this.eSortMixed, isMixedSort, { skipAriaHidden: true });
        }
    }

    // we listen here for global sort events, NOT column sort events, as we want to do this
    // when sorting has been set on all column (if we listened just for our col (where we
    // set the asc / desc icons) then it's possible other cols are yet to get their sorting state.
    private updateSortOrder(): void {
        if (!this.eSortOrder) {
            return;
        }

        const allColumnsWithSorting = this.sortSvc.getColumnsWithSortingOrdered();

        const indexThisCol = this.sortSvc.getDisplaySortIndexForColumn(this.column) ?? -1;
        const moreThanOneColSorting = allColumnsWithSorting.some(
            (col) => this.sortSvc.getDisplaySortIndexForColumn(col) ?? -1 >= 1
        );
        const showIndex = indexThisCol >= 0 && moreThanOneColSorting;
        _setDisplayed(this.eSortOrder, showIndex, { skipAriaHidden: true });

        if (indexThisCol >= 0) {
            this.eSortOrder.textContent = (indexThisCol + 1).toString();
        } else {
            _clearElement(this.eSortOrder);
        }
    }
}

export const SortIndicatorSelector: ComponentSelector = {
    selector: 'AG-SORT-INDICATOR',
    component: SortIndicatorComp,
};
