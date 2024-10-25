import type { BeanCollection } from '../../context/context';
import type { PaginationChangedEvent } from '../../events';
import type { WithoutGridCommon } from '../../interfaces/iCommon';
import { _areEqual } from '../../utils/array';
import { _clearElement } from '../../utils/dom';
import { _warn } from '../../validation/logging';
import type { ListOption } from '../../widgets/agList';
import { AgSelect } from '../../widgets/agSelect';
import type { ComponentSelector } from '../../widgets/component';
import { Component } from '../../widgets/component';
import type { PaginationService } from '../paginationService';

const paginationPageSizeSelector = 'paginationPageSizeSelector';

export class PageSizeSelectorComp extends Component {
    private pagination: PaginationService;

    public wireBeans(beans: BeanCollection): void {
        this.pagination = beans.pagination!;
    }

    private selectPageSizeComp: AgSelect | undefined;
    private hasEmptyOption = false;
    private pageSizeOptions?: (string | number)[];

    constructor() {
        super(/* html */ `<span class="ag-paging-page-size"></span>`);
    }

    public postConstruct() {
        this.addManagedPropertyListener(paginationPageSizeSelector, () => {
            this.onPageSizeSelectorValuesChange();
        });

        this.addManagedEventListeners({ paginationChanged: (event) => this.handlePaginationChanged(event) });
    }

    private handlePageSizeItemSelected = (): void => {
        if (!this.selectPageSizeComp) {
            return;
        }

        const newValue = this.selectPageSizeComp.getValue();

        if (!newValue) {
            return;
        }

        const paginationPageSize = Number(newValue);

        if (
            isNaN(paginationPageSize) ||
            paginationPageSize < 1 ||
            paginationPageSize === this.pagination.getPageSize()
        ) {
            return;
        }

        this.pagination.setPageSize(paginationPageSize, 'pageSizeSelector');

        if (this.hasEmptyOption) {
            // Toggle the selector to force a refresh of the options and hide the empty option,
            // as it's no longer needed.
            this.toggleSelectDisplay(true);
        }

        this.selectPageSizeComp.getFocusableElement().focus();
    };

    private handlePaginationChanged(paginationChangedEvent?: WithoutGridCommon<PaginationChangedEvent>): void {
        if (!this.selectPageSizeComp || !paginationChangedEvent?.newPageSize) {
            return;
        }

        const paginationPageSize = this.pagination.getPageSize();
        if (this.getPageSizeSelectorValues().includes(paginationPageSize)) {
            this.selectPageSizeComp.setValue(paginationPageSize.toString());
        } else {
            if (this.hasEmptyOption) {
                this.selectPageSizeComp.setValue('');
            } else {
                this.toggleSelectDisplay(true);
            }
        }
    }

    public toggleSelectDisplay(show: boolean) {
        if (this.selectPageSizeComp && !show) {
            this.reset();
        }

        if (!show) {
            return;
        }

        this.reloadPageSizesSelector();

        if (!this.selectPageSizeComp) {
            return;
        }
    }

    private reset(): void {
        _clearElement(this.getGui());

        if (!this.selectPageSizeComp) {
            return;
        }

        this.selectPageSizeComp = this.destroyBean(this.selectPageSizeComp);
    }

    private onPageSizeSelectorValuesChange(): void {
        if (!this.selectPageSizeComp) {
            return;
        }

        if (this.shouldShowPageSizeSelector()) {
            this.reloadPageSizesSelector();
        }
    }

    public shouldShowPageSizeSelector(): boolean {
        return (
            this.gos.get('pagination') &&
            !this.gos.get('suppressPaginationPanel') &&
            !this.gos.get('paginationAutoPageSize') &&
            this.gos.get(paginationPageSizeSelector) !== false
        );
    }

    private reloadPageSizesSelector(): void {
        const pageSizeOptions: (number | string)[] = this.getPageSizeSelectorValues();
        const paginationPageSizeOption: number = this.pagination.getPageSize();
        const shouldAddAndSelectEmptyOption =
            !paginationPageSizeOption || !pageSizeOptions.includes(paginationPageSizeOption);
        if (shouldAddAndSelectEmptyOption) {
            const pageSizeSet = this.gos.exists('paginationPageSize');
            const pageSizesSet = this.gos.get(paginationPageSizeSelector) !== true;

            _warn(94, { pageSizeSet, pageSizesSet, pageSizeOptions, paginationPageSizeOption });
            if (!pageSizesSet) {
                _warn(95, { paginationPageSizeOption, paginationPageSizeSelector });
            }
            // When the paginationPageSize option is set to a value that is
            // not in the list of page size options.
            pageSizeOptions.unshift('');
        }

        const value = String(shouldAddAndSelectEmptyOption ? '' : paginationPageSizeOption);

        if (this.selectPageSizeComp) {
            if (!_areEqual(this.pageSizeOptions, pageSizeOptions)) {
                this.selectPageSizeComp.clearOptions().addOptions(this.createPageSizeSelectOptions(pageSizeOptions));
                this.pageSizeOptions = pageSizeOptions;
            }
            this.selectPageSizeComp.setValue(value, true);
        } else {
            this.createPageSizeSelectorComp(pageSizeOptions, value);
        }

        this.hasEmptyOption = shouldAddAndSelectEmptyOption;
    }

    private createPageSizeSelectOptions(pageSizeOptions: (string | number)[]): ListOption<string>[] {
        return pageSizeOptions.map((value) => ({
            value: String(value),
        }));
    }

    private createPageSizeSelectorComp(pageSizeOptions: (string | number)[], value: string): void {
        const localeTextFunc = this.getLocaleTextFunc();

        const localisedLabel = localeTextFunc('pageSizeSelectorLabel', 'Page Size:');
        const localisedAriaLabel = localeTextFunc('ariaPageSizeSelectorLabel', 'Page Size');

        this.selectPageSizeComp = this.createManagedBean(new AgSelect())
            .addOptions(this.createPageSizeSelectOptions(pageSizeOptions))
            .setValue(value)
            .setAriaLabel(localisedAriaLabel)
            .setLabel(localisedLabel)
            .onValueChange(() => this.handlePageSizeItemSelected());

        this.appendChild(this.selectPageSizeComp);
    }

    private getPageSizeSelectorValues(): number[] {
        const defaultValues = [20, 50, 100];
        const paginationPageSizeSelectorValues = this.gos.get(paginationPageSizeSelector);

        if (!Array.isArray(paginationPageSizeSelectorValues) || !paginationPageSizeSelectorValues?.length) {
            return defaultValues;
        }

        return [...paginationPageSizeSelectorValues].sort((a, b) => a - b);
    }

    public override destroy() {
        this.toggleSelectDisplay(false);
        super.destroy();
    }
}

export const PageSizeSelectorSelector: ComponentSelector = {
    selector: 'AG-PAGE-SIZE-SELECTOR',
    component: PageSizeSelectorComp,
};
