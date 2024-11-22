import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { RowNode } from '../entities/rowNode';
import type { RowPosition } from '../interfaces/iRowPosition';
import { _exists } from '../utils/generic';
import type { ComponentSelector } from '../widgets/component';
import { PaginationSelector } from './paginationComp';

export class PaginationService extends BeanStub implements NamedBean {
    beanName = 'pagination' as const;

    private active: boolean;
    private paginateChildRows: boolean;

    // We should track all the different sources of page size, as we can fall back to the next one if one is missing.
    // or if user preferences change (Example: disabling auto page size option should mean we get page size from
    // page size selector value - if a value was previously selected .. otherwise fall back to initial state value).
    // IMPORTANT: We should always use this.pageSize getter to get the page size instead of accessing
    // directly to these variables, as the getter takes care of returning the correct value based on precedence.
    private pageSizeAutoCalculated?: number; // When paginationAutoPageSize = true or when the pages panel is disabled
    private pageSizeFromPageSizeSelector?: number; // When user selects page size from page size selector.
    private pageSizeFromInitialState?: number; // When the initial grid state is loaded, and a page size rehydrated
    private pageSizeFromGridOptions?: number; // When user sets gridOptions.paginationPageSize.
    private defaultPageSize: 100; // When nothing else set, default page size is 100.

    private totalPages: number;
    private currentPage = 0;

    private topDisplayedRowIndex = 0;
    private bottomDisplayedRowIndex = 0;

    private masterRowCount: number = 0;

    public postConstruct() {
        const gos = this.gos;
        this.active = gos.get('pagination');
        this.pageSizeFromGridOptions = gos.get('paginationPageSize');
        this.paginateChildRows = this.isPaginateChildRows();

        this.addManagedPropertyListener('pagination', this.onPaginationGridOptionChanged.bind(this));
        this.addManagedPropertyListener('paginationPageSize', this.onPageSizeGridOptionChanged.bind(this));
    }

    public getPaginationSelector(): ComponentSelector {
        return PaginationSelector;
    }

    private isPaginateChildRows(): boolean {
        const gos = this.gos;
        const shouldPaginate =
            gos.get('groupHideParentOfSingleChild') ||
            // following two properties deprecated v32.3.0
            gos.get('groupRemoveSingleChildren') ||
            gos.get('groupRemoveLowestSingleChildren');
        if (shouldPaginate) {
            return true;
        }
        return gos.get('paginateChildRows');
    }

    private onPaginationGridOptionChanged(): void {
        this.active = this.gos.get('pagination');
        this.calculatePages();

        // important to keep rendered rows, otherwise every time grid is resized,
        // we would destroy all the rows.
        this.dispatchPaginationChangedEvent({ keepRenderedRows: true });
    }

    private onPageSizeGridOptionChanged(): void {
        this.setPageSize(this.gos.get('paginationPageSize'), 'gridOptions');
    }

    public goToPage(page: number): void {
        const currentPage = this.currentPage;
        if (!this.active || currentPage === page || typeof currentPage !== 'number') {
            return;
        }

        this.currentPage = page;
        this.calculatePages();

        this.dispatchPaginationChangedEvent({ newPage: true });
    }

    public isRowPresent(rowNode: RowNode): boolean {
        const nodeIsInPage =
            rowNode.rowIndex! >= this.topDisplayedRowIndex && rowNode.rowIndex! <= this.bottomDisplayedRowIndex;
        return nodeIsInPage;
    }

    private getPageForIndex(index: number): number {
        return Math.floor(index / this.pageSize);
    }

    public goToPageWithIndex(index: any): void {
        if (!this.active) {
            return;
        }

        const pageNumber = this.getPageForIndex(index);
        this.goToPage(pageNumber);
    }

    public isRowInPage(row: RowPosition): boolean {
        if (!this.active) {
            return true;
        }
        const rowPage = this.getPageForIndex(row.rowIndex);
        return rowPage === this.currentPage;
    }

    public getCurrentPage(): number {
        return this.currentPage;
    }

    public goToNextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    public goToPreviousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    public goToFirstPage(): void {
        this.goToPage(0);
    }

    public goToLastPage(): void {
        const rowCount = this.beans.rowModel.getRowCount();
        const lastPage = Math.floor(rowCount / this.pageSize);
        this.goToPage(lastPage);
    }

    public getPageSize(): number {
        return this.pageSize;
    }

    public getTotalPages(): number {
        return this.totalPages;
    }

    /** This is only for state setting before data has been loaded */
    public setPage(page: number): void {
        this.currentPage = page;
    }

    private get pageSize(): number {
        // Explicitly check for autosize status as this can be set to false before the calculated value is cleared.
        // Due to a race condition in when event listeners are added.
        if (_exists(this.pageSizeAutoCalculated) && this.gos.get('paginationAutoPageSize')) {
            return this.pageSizeAutoCalculated;
        }
        if (_exists(this.pageSizeFromPageSizeSelector)) {
            return this.pageSizeFromPageSizeSelector;
        }
        if (_exists(this.pageSizeFromInitialState)) {
            return this.pageSizeFromInitialState;
        }
        if (_exists(this.pageSizeFromGridOptions)) {
            return this.pageSizeFromGridOptions;
        }
        return this.defaultPageSize;
    }

    public calculatePages(): void {
        if (this.active) {
            if (this.paginateChildRows) {
                this.calculatePagesAllRows();
            } else {
                this.calculatePagesMasterRowsOnly();
            }
        } else {
            this.calculatedPagesNotActive();
        }

        this.beans.pageBounds.calculateBounds(this.topDisplayedRowIndex, this.bottomDisplayedRowIndex);
    }

    public unsetAutoCalculatedPageSize(): void {
        if (this.pageSizeAutoCalculated === undefined) {
            return;
        }
        const oldPageSize = this.pageSizeAutoCalculated;

        this.pageSizeAutoCalculated = undefined;

        if (this.pageSize === oldPageSize) {
            return;
        }

        this.calculatePages();

        this.dispatchPaginationChangedEvent({ newPageSize: true });
    }

    public setPageSize(
        size: number | undefined,
        source: 'autoCalculated' | 'pageSizeSelector' | 'initialState' | 'gridOptions'
    ): void {
        const currentSize = this.pageSize;
        switch (source) {
            case 'autoCalculated':
                this.pageSizeAutoCalculated = size;
                break;
            case 'pageSizeSelector':
                this.pageSizeFromPageSizeSelector = size;
                if (this.currentPage !== 0) {
                    this.goToFirstPage();
                }
                break;
            case 'initialState':
                this.pageSizeFromInitialState = size;
                break;
            case 'gridOptions':
                this.pageSizeFromGridOptions = size;
                this.pageSizeFromInitialState = undefined;
                this.pageSizeFromPageSizeSelector = undefined;
                if (this.currentPage !== 0) {
                    this.goToFirstPage();
                }
                break;
        }

        if (currentSize !== this.pageSize) {
            this.calculatePages();

            this.dispatchPaginationChangedEvent({ newPageSize: true, keepRenderedRows: true });
        }
    }

    private setZeroRows(): void {
        this.masterRowCount = 0;
        this.topDisplayedRowIndex = 0;
        this.bottomDisplayedRowIndex = -1;
        this.currentPage = 0;
        this.totalPages = 0;
    }

    private adjustCurrentPageIfInvalid() {
        const totalPages = this.totalPages;
        if (this.currentPage >= totalPages) {
            this.currentPage = totalPages - 1;
        }

        const currentPage = this.currentPage;

        if (!isFinite(currentPage) || isNaN(currentPage) || currentPage < 0) {
            this.currentPage = 0;
        }
    }

    private calculatePagesMasterRowsOnly(): void {
        const rowModel = this.beans.rowModel;

        const masterRowCount = rowModel.getTopLevelRowCount();
        this.masterRowCount = masterRowCount;

        // we say <=0 (rather than =0) as viewport returns -1 when no rows
        if (masterRowCount <= 0) {
            this.setZeroRows();
            return;
        }

        const { pageSize, currentPage } = this;

        const masterLastRowIndex = masterRowCount - 1;
        this.totalPages = Math.floor(masterLastRowIndex / pageSize) + 1;

        this.adjustCurrentPageIfInvalid();

        const masterPageStartIndex = pageSize * currentPage;
        let masterPageEndIndex = pageSize * (currentPage + 1) - 1;

        if (masterPageEndIndex > masterLastRowIndex) {
            masterPageEndIndex = masterLastRowIndex;
        }

        this.topDisplayedRowIndex = rowModel.getTopLevelRowDisplayedIndex(masterPageStartIndex);
        // masterRows[masterPageStartIndex].rowIndex;

        if (masterPageEndIndex === masterLastRowIndex) {
            // if showing the last master row, then we want to show the very last row of the model
            this.bottomDisplayedRowIndex = rowModel.getRowCount() - 1;
        } else {
            const firstIndexNotToShow = rowModel.getTopLevelRowDisplayedIndex(masterPageEndIndex + 1);
            //masterRows[masterPageEndIndex + 1].rowIndex;
            // this gets the index of the last child - eg current row is open, we want to display all children,
            // the index of the last child is one less than the index of the next parent row.
            this.bottomDisplayedRowIndex = firstIndexNotToShow - 1;
        }
    }

    public getMasterRowCount(): number {
        return this.masterRowCount;
    }

    private calculatePagesAllRows(): void {
        const masterRowCount = this.beans.rowModel.getRowCount();
        this.masterRowCount = masterRowCount;

        if (masterRowCount === 0) {
            this.setZeroRows();
            return;
        }

        const { pageSize, currentPage } = this;
        const maxRowIndex = masterRowCount - 1;
        this.totalPages = Math.floor(maxRowIndex / pageSize) + 1;

        this.adjustCurrentPageIfInvalid();

        this.topDisplayedRowIndex = pageSize * currentPage;
        this.bottomDisplayedRowIndex = pageSize * (currentPage + 1) - 1;

        if (this.bottomDisplayedRowIndex > maxRowIndex) {
            this.bottomDisplayedRowIndex = maxRowIndex;
        }
    }

    private calculatedPagesNotActive(): void {
        // when pagination is not active we don't use any page size variables,
        // however need to unset this so if enabled we recalculate.
        this.setPageSize(undefined, 'autoCalculated');
        this.totalPages = 1;
        this.currentPage = 0;
        this.topDisplayedRowIndex = 0;
        this.bottomDisplayedRowIndex = this.beans.rowModel.getRowCount() - 1;
    }

    private dispatchPaginationChangedEvent(params: {
        newPage?: boolean;
        newPageSize?: boolean;
        keepRenderedRows?: boolean;
    }): void {
        const { keepRenderedRows = false, newPage = false, newPageSize = false } = params;
        this.eventSvc.dispatchEvent({
            type: 'paginationChanged',
            animate: false,
            newData: false,
            newPage,
            newPageSize,
            keepRenderedRows,
        });
    }
}
