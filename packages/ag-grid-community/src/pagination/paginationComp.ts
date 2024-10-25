import { KeyCode } from '../constants/keyCode';
import type { BeanCollection } from '../context/context';
import type { FocusService } from '../focusService';
import type { PaginationNumberFormatterParams } from '../interfaces/iCallbackParams';
import type { WithoutGridCommon } from '../interfaces/iCommon';
import type { FocusableContainer } from '../interfaces/iFocusableContainer';
import type { IRowModel } from '../interfaces/iRowModel';
import type { AriaAnnouncementService } from '../rendering/ariaAnnouncementService';
import { _setAriaDisabled } from '../utils/aria';
import { _addFocusableContainerListener } from '../utils/focus';
import { _createIconNoSpan } from '../utils/icon';
import { _formatNumberCommas } from '../utils/number';
import type { ComponentSelector } from '../widgets/component';
import { RefPlaceholder } from '../widgets/component';
import { TabGuardComp } from '../widgets/tabGuardComp';
import type { PageSizeSelectorComp } from './pageSizeSelector/pageSizeSelectorComp';
import { PageSizeSelectorSelector } from './pageSizeSelector/pageSizeSelectorComp';
import { paginationCompCSS } from './paginationComp.css-GENERATED';
import type { PaginationService } from './paginationService';

export class PaginationComp extends TabGuardComp implements FocusableContainer {
    private rowModel: IRowModel;
    private pagination: PaginationService;
    private focusSvc: FocusService;
    private ariaAnnounce: AriaAnnouncementService;

    public wireBeans(beans: BeanCollection): void {
        this.rowModel = beans.rowModel;
        this.pagination = beans.pagination!;
        this.focusSvc = beans.focusSvc;
        this.ariaAnnounce = beans.ariaAnnounce;
    }

    private readonly btFirst: HTMLElement = RefPlaceholder;
    private readonly btPrevious: HTMLElement = RefPlaceholder;
    private readonly btNext: HTMLElement = RefPlaceholder;
    private readonly btLast: HTMLElement = RefPlaceholder;

    private readonly lbRecordCount: any = RefPlaceholder;
    private readonly lbFirstRowOnPage: any = RefPlaceholder;
    private readonly lbLastRowOnPage: any = RefPlaceholder;
    private readonly lbCurrent: any = RefPlaceholder;
    private readonly lbTotal: any = RefPlaceholder;

    private readonly pageSizeComp: PageSizeSelectorComp = RefPlaceholder;

    private previousAndFirstButtonsDisabled = false;
    private nextButtonDisabled = false;
    private lastButtonDisabled = false;
    private areListenersSetup = false;
    private allowFocusInnerElement = false;

    private ariaRowStatus: string;
    private ariaPageStatus: string;

    constructor() {
        super();
        this.registerCSS(paginationCompCSS);
    }

    public postConstruct(): void {
        const isRtl = this.gos.get('enableRtl');
        this.setTemplate(this.getTemplate(), [PageSizeSelectorSelector]);

        const { btFirst, btPrevious, btNext, btLast } = this;
        this.activateTabIndex([btFirst, btPrevious, btNext, btLast]);

        btFirst.insertAdjacentElement('afterbegin', _createIconNoSpan(isRtl ? 'last' : 'first', this.gos)!);
        btPrevious.insertAdjacentElement('afterbegin', _createIconNoSpan(isRtl ? 'next' : 'previous', this.gos)!);
        btNext.insertAdjacentElement('afterbegin', _createIconNoSpan(isRtl ? 'previous' : 'next', this.gos)!);
        btLast.insertAdjacentElement('afterbegin', _createIconNoSpan(isRtl ? 'first' : 'last', this.gos)!);

        this.addManagedPropertyListener('pagination', this.onPaginationChanged.bind(this));
        this.addManagedPropertyListener('suppressPaginationPanel', this.onPaginationChanged.bind(this));
        this.addManagedPropertyListeners(
            ['paginationPageSizeSelector', 'paginationAutoPageSize', 'suppressPaginationPanel'],
            () => this.onPageSizeRelatedOptionsChange()
        );

        this.pageSizeComp.toggleSelectDisplay(this.pageSizeComp.shouldShowPageSizeSelector());

        this.initialiseTabGuard({
            // prevent tab guard default logic
            onTabKeyDown: () => {},
            focusInnerElement: (fromBottom) => {
                if (this.allowFocusInnerElement) {
                    this.tabGuardFeature.getTabGuardCtrl().focusInnerElement(fromBottom);
                } else {
                    this.focusSvc.focusGridInnerElement(fromBottom);
                }
            },
            forceFocusOutWhenTabGuardsAreEmpty: true,
        });

        this.onPaginationChanged();
    }

    public setAllowFocus(allowFocus: boolean): void {
        this.allowFocusInnerElement = allowFocus;
    }

    private onPaginationChanged(): void {
        const isPaging = this.gos.get('pagination');
        const paginationPanelEnabled = isPaging && !this.gos.get('suppressPaginationPanel');

        this.setDisplayed(paginationPanelEnabled);
        if (!paginationPanelEnabled) {
            return;
        }

        this.setupListeners();

        this.enableOrDisableButtons();
        this.updateLabels();
        this.onPageSizeRelatedOptionsChange();
    }

    private onPageSizeRelatedOptionsChange(): void {
        this.pageSizeComp.toggleSelectDisplay(this.pageSizeComp.shouldShowPageSizeSelector());
    }

    private setupListeners() {
        if (!this.areListenersSetup) {
            this.addManagedEventListeners({ paginationChanged: this.onPaginationChanged.bind(this) });

            [
                { el: this.btFirst, fn: this.onBtFirst.bind(this) },
                { el: this.btPrevious, fn: this.onBtPrevious.bind(this) },
                { el: this.btNext, fn: this.onBtNext.bind(this) },
                { el: this.btLast, fn: this.onBtLast.bind(this) },
            ].forEach((item) => {
                const { el, fn } = item;
                this.addManagedListeners(el, {
                    click: fn,
                    keydown: (e: KeyboardEvent) => {
                        if (e.key === KeyCode.ENTER || e.key === KeyCode.SPACE) {
                            e.preventDefault();
                            fn();
                        }
                    },
                });
            });

            _addFocusableContainerListener(this, this.getGui(), this.focusSvc);

            this.areListenersSetup = true;
        }
    }

    private onBtFirst() {
        if (!this.previousAndFirstButtonsDisabled) {
            this.pagination.goToFirstPage();
        }
    }

    private formatNumber(value: number): string {
        const userFunc = this.gos.getCallback('paginationNumberFormatter');

        if (userFunc) {
            const params: WithoutGridCommon<PaginationNumberFormatterParams> = { value: value };
            return userFunc(params);
        }

        return _formatNumberCommas(value, this.getLocaleTextFunc.bind(this));
    }

    private getTemplate(): string {
        const localeTextFunc = this.getLocaleTextFunc();

        const strPage = localeTextFunc('page', 'Page');
        const strTo = localeTextFunc('to', 'to');
        const strOf = localeTextFunc('of', 'of');
        const strFirst = localeTextFunc('firstPage', 'First Page');
        const strPrevious = localeTextFunc('previousPage', 'Previous Page');
        const strNext = localeTextFunc('nextPage', 'Next Page');
        const strLast = localeTextFunc('lastPage', 'Last Page');
        const compId = this.getCompId();

        return /* html */ `<div class="ag-paging-panel ag-unselectable" id="ag-${compId}">
                <ag-page-size-selector data-ref="pageSizeComp"></ag-page-size-selector>
                <span class="ag-paging-row-summary-panel">
                    <span id="ag-${compId}-first-row" data-ref="lbFirstRowOnPage" class="ag-paging-row-summary-panel-number"></span>
                    <span id="ag-${compId}-to">${strTo}</span>
                    <span id="ag-${compId}-last-row" data-ref="lbLastRowOnPage" class="ag-paging-row-summary-panel-number"></span>
                    <span id="ag-${compId}-of">${strOf}</span>
                    <span id="ag-${compId}-row-count" data-ref="lbRecordCount" class="ag-paging-row-summary-panel-number"></span>
                </span>
                <span class="ag-paging-page-summary-panel" role="presentation">
                    <div data-ref="btFirst" class="ag-button ag-paging-button" role="button" aria-label="${strFirst}"></div>
                    <div data-ref="btPrevious" class="ag-button ag-paging-button" role="button" aria-label="${strPrevious}"></div>
                    <span class="ag-paging-description">
                        <span id="ag-${compId}-start-page">${strPage}</span>
                        <span id="ag-${compId}-start-page-number" data-ref="lbCurrent" class="ag-paging-number"></span>
                        <span id="ag-${compId}-of-page">${strOf}</span>
                        <span id="ag-${compId}-of-page-number" data-ref="lbTotal" class="ag-paging-number"></span>
                    </span>
                    <div data-ref="btNext" class="ag-button ag-paging-button" role="button" aria-label="${strNext}"></div>
                    <div data-ref="btLast" class="ag-button ag-paging-button" role="button" aria-label="${strLast}"></div>
                </span>
            </div>`;
    }

    private onBtNext() {
        if (!this.nextButtonDisabled) {
            this.pagination.goToNextPage();
        }
    }

    private onBtPrevious() {
        if (!this.previousAndFirstButtonsDisabled) {
            this.pagination.goToPreviousPage();
        }
    }

    private onBtLast() {
        if (!this.lastButtonDisabled) {
            this.pagination.goToLastPage();
        }
    }

    private enableOrDisableButtons() {
        const currentPage = this.pagination.getCurrentPage();
        const maxRowFound = this.rowModel.isLastRowIndexKnown();
        const totalPages = this.pagination.getTotalPages();

        this.previousAndFirstButtonsDisabled = currentPage === 0;
        this.toggleButtonDisabled(this.btFirst, this.previousAndFirstButtonsDisabled);
        this.toggleButtonDisabled(this.btPrevious, this.previousAndFirstButtonsDisabled);

        const zeroPagesToDisplay = this.isZeroPagesToDisplay();
        const onLastPage = currentPage === totalPages - 1;

        this.nextButtonDisabled = onLastPage || zeroPagesToDisplay;
        this.lastButtonDisabled = !maxRowFound || zeroPagesToDisplay || currentPage === totalPages - 1;

        this.toggleButtonDisabled(this.btNext, this.nextButtonDisabled);
        this.toggleButtonDisabled(this.btLast, this.lastButtonDisabled);
    }

    private toggleButtonDisabled(button: HTMLElement, disabled: boolean) {
        _setAriaDisabled(button, disabled);
        button.classList.toggle('ag-disabled', disabled);
    }

    private isZeroPagesToDisplay() {
        const maxRowFound = this.rowModel.isLastRowIndexKnown();
        const totalPages = this.pagination.getTotalPages();
        return maxRowFound && totalPages === 0;
    }

    private updateLabels(): void {
        const lastPageFound = this.rowModel.isLastRowIndexKnown();
        const totalPages = this.pagination.getTotalPages();
        const masterRowCount = this.pagination.getMasterRowCount();
        const rowCount = lastPageFound ? masterRowCount : null;

        // When `pivotMode=true` and no grouping or value columns exist, a single 'hidden' group row (root node) is in
        // the grid and the pagination totals will correctly display total = 1. However this is confusing to users as
        // they can't see it. To address this UX issue we simply set the totals to zero in the pagination panel.
        if (rowCount === 1) {
            const firstRow = this.rowModel.getRow(0);

            // a group node with no group or agg data will not be visible to users
            const hiddenGroupRow = firstRow && firstRow.group && !(firstRow.groupData || firstRow.aggData);
            if (hiddenGroupRow) {
                this.setTotalLabelsToZero();
                return;
            }
        }

        const currentPage = this.pagination.getCurrentPage();
        const pageSize = this.pagination.getPageSize();

        let startRow: any;
        let endRow: any;

        if (this.isZeroPagesToDisplay()) {
            startRow = endRow = 0;
        } else {
            startRow = pageSize * currentPage + 1;
            endRow = startRow + pageSize - 1;
            if (lastPageFound && endRow > rowCount!) {
                endRow = rowCount;
            }
        }

        const theoreticalEndRow = startRow + pageSize - 1;
        const isLoadingPageSize = !lastPageFound && masterRowCount < theoreticalEndRow;
        const lbFirstRowOnPage = this.formatNumber(startRow);
        this.lbFirstRowOnPage.textContent = lbFirstRowOnPage;
        let lbLastRowOnPage: string;
        const localeTextFunc = this.getLocaleTextFunc();
        if (isLoadingPageSize) {
            lbLastRowOnPage = localeTextFunc('pageLastRowUnknown', '?');
        } else {
            lbLastRowOnPage = this.formatNumber(endRow);
        }
        this.lbLastRowOnPage.textContent = lbLastRowOnPage;

        const pagesExist = totalPages > 0;
        const toDisplay = pagesExist ? currentPage + 1 : 0;

        const lbCurrent = this.formatNumber(toDisplay);
        this.lbCurrent.textContent = lbCurrent;

        let lbTotal: string;
        let lbRecordCount: string;
        if (lastPageFound) {
            lbTotal = this.formatNumber(totalPages);
            lbRecordCount = this.formatNumber(rowCount!);
        } else {
            const moreText = localeTextFunc('more', 'more');
            lbTotal = moreText;
            lbRecordCount = moreText;
        }
        this.lbTotal.textContent = lbTotal;
        this.lbRecordCount.textContent = lbRecordCount;

        this.announceAriaStatus(lbFirstRowOnPage, lbLastRowOnPage, lbRecordCount, lbCurrent, lbTotal);
    }

    private announceAriaStatus(
        lbFirstRowOnPage: string,
        lbLastRowOnPage: string,
        lbRecordCount: string,
        lbCurrent: string,
        lbTotal: string
    ): void {
        const localeTextFunc = this.getLocaleTextFunc();
        const strPage = localeTextFunc('page', 'Page');
        const strTo = localeTextFunc('to', 'to');
        const strOf = localeTextFunc('of', 'of');
        const ariaRowStatus = `${lbFirstRowOnPage} ${strTo} ${lbLastRowOnPage} ${strOf} ${lbRecordCount}`;
        const ariaPageStatus = `${strPage} ${lbCurrent} ${strOf} ${lbTotal}`;

        if (ariaRowStatus !== this.ariaRowStatus) {
            this.ariaRowStatus = ariaRowStatus;
            this.ariaAnnounce.announceValue(ariaRowStatus, 'paginationRow');
        }
        if (ariaPageStatus !== this.ariaPageStatus) {
            this.ariaPageStatus = ariaPageStatus;
            this.ariaAnnounce.announceValue(ariaPageStatus, 'paginationPage');
        }
    }

    private setTotalLabelsToZero() {
        const strZero = this.formatNumber(0);
        this.lbFirstRowOnPage.textContent = strZero;
        this.lbCurrent.textContent = strZero;
        this.lbLastRowOnPage.textContent = strZero;
        this.lbTotal.textContent = strZero;
        this.lbRecordCount.textContent = strZero;
        this.announceAriaStatus(strZero, strZero, strZero, strZero, strZero);
    }
}

export const PaginationSelector: ComponentSelector = {
    selector: 'AG-PAGINATION',
    component: PaginationComp,
};
