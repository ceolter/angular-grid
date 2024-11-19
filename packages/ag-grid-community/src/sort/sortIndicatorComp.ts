import type { AgColumn } from '../entities/agColumn';
import { _isColumnsSortingCoupledToGroup } from '../gridOptionsUtils';
import { _clearElement, _setDisplayed } from '../utils/dom';
import type { IconName } from '../utils/icon';
import { _createIconNoSpan } from '../utils/icon';
import type { ComponentSelector } from '../widgets/component';
import { Component, RefPlaceholder } from '../widgets/component';

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

        if (!column.isSortable() && !column.getColDef().showRowGroup) {
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
        const { eSortAsc, eSortDesc, eSortNone, column, gos, beans } = this;

        const sortDirection = beans.sortSvc!.getDisplaySortForColumn(column);

        if (eSortAsc) {
            const isAscending = sortDirection === 'asc';
            _setDisplayed(eSortAsc, isAscending, { skipAriaHidden: true });
        }

        if (eSortDesc) {
            const isDescending = sortDirection === 'desc';
            _setDisplayed(eSortDesc, isDescending, { skipAriaHidden: true });
        }

        if (eSortNone) {
            const alwaysHideNoSort = !column.getColDef().unSortIcon && !gos.get('unSortIcon');
            const isNone = sortDirection === null || sortDirection === undefined;
            _setDisplayed(eSortNone, !alwaysHideNoSort && isNone, { skipAriaHidden: true });
        }
    }

    private setupMultiSortIndicator() {
        const { eSortMixed, column, gos } = this;
        this.addInIcon('sortUnSort', eSortMixed, column);

        const isColumnShowingRowGroup = column.getColDef().showRowGroup;
        const areGroupsCoupled = _isColumnsSortingCoupledToGroup(gos);
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
        const { eSortMixed, beans, column } = this;
        if (eSortMixed) {
            const isMixedSort = beans.sortSvc!.getDisplaySortForColumn(column) === 'mixed';
            _setDisplayed(eSortMixed, isMixedSort, { skipAriaHidden: true });
        }
    }

    // we listen here for global sort events, NOT column sort events, as we want to do this
    // when sorting has been set on all column (if we listened just for our col (where we
    // set the asc / desc icons) then it's possible other cols are yet to get their sorting state.
    private updateSortOrder(): void {
        const {
            eSortOrder,
            column,
            beans: { sortSvc },
        } = this;
        if (!eSortOrder) {
            return;
        }

        const allColumnsWithSorting = sortSvc!.getColumnsWithSortingOrdered();

        const indexThisCol = sortSvc!.getDisplaySortIndexForColumn(column) ?? -1;
        const moreThanOneColSorting = allColumnsWithSorting.some(
            (col) => sortSvc!.getDisplaySortIndexForColumn(col) ?? -1 >= 1
        );
        const showIndex = indexThisCol >= 0 && moreThanOneColSorting;
        _setDisplayed(eSortOrder, showIndex, { skipAriaHidden: true });

        if (indexThisCol >= 0) {
            eSortOrder.textContent = (indexThisCol + 1).toString();
        } else {
            _clearElement(eSortOrder);
        }
    }
}

export const SortIndicatorSelector: ComponentSelector = {
    selector: 'AG-SORT-INDICATOR',
    component: SortIndicatorComp,
};
