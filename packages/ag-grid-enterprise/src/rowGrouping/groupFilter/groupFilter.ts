import type {
    AgColumn,
    BeanCollection,
    ColumnNameService,
    FilterDestroyedEvent,
    FilterManager,
    FuncColsService,
    IAfterGuiAttachedParams,
    IFilterComp,
    IFilterParams,
} from 'ag-grid-community';
import {
    AgPromise,
    AgSelect,
    FilterWrapperComp,
    RefPlaceholder,
    TabGuardComp,
    _clearElement,
    _loadTemplate,
    _setDisplayed,
    _warn,
} from 'ag-grid-community';

interface FilterColumnPair {
    filter: IFilterComp;
    column: AgColumn;
}

export type GroupFilterEvent = 'columnRowGroupChanged' | 'selectedColumnChanged';
export class GroupFilter extends TabGuardComp<GroupFilterEvent> implements IFilterComp {
    private filterManager?: FilterManager;
    private columnNameService: ColumnNameService;
    private funcColsService: FuncColsService;

    public wireBeans(beans: BeanCollection) {
        this.filterManager = beans.filterManager;
        this.columnNameService = beans.columnNameService;
        this.funcColsService = beans.funcColsService;
    }

    private readonly eGroupField: HTMLElement = RefPlaceholder;
    private readonly eUnderlyingFilter: HTMLElement = RefPlaceholder;

    private params: IFilterParams;
    private groupColumn: AgColumn;
    private selectedColumn: AgColumn | undefined;
    private selectedFilter: IFilterComp | undefined;
    private filterColumnPairs: FilterColumnPair[] | undefined;
    private eGroupFieldSelect: AgSelect;
    private afterGuiAttachedParams: IAfterGuiAttachedParams | undefined;
    private filterWrapperComp?: FilterWrapperComp;

    constructor() {
        super(/* html */ `
            <div class="ag-group-filter">
                <div data-ref="eGroupField"></div>
                <div data-ref="eUnderlyingFilter"></div>
            </div>
        `);
    }

    public postConstruct() {
        this.initialiseTabGuard({});
    }

    public init(params: IFilterParams): AgPromise<void> {
        return this.updateParams(params).then(() => {
            this.addManagedEventListeners({
                columnRowGroupChanged: () => this.onColumnRowGroupChanged(),
                filterDestroyed: (event) => this.onFilterDestroyed(event),
            });
        });
    }

    public refresh(params: IFilterParams): boolean {
        this.updateParams(params);
        return true;
    }

    private updateParams(params: IFilterParams): AgPromise<void> {
        this.params = params;
        this.validateParams();
        return this.updateGroups();
    }

    private validateParams(): void {
        const { colDef } = this.params;
        if (colDef.field) {
            _warn(234);
        }
        if (colDef.filterValueGetter) {
            _warn(235);
        }
        if (colDef.filterParams) {
            _warn(236);
        }
    }

    private updateGroups(): AgPromise<void> {
        const sourceColumns = this.updateGroupField();
        return this.getUnderlyingFilters(sourceColumns);
    }

    private getSourceColumns(): AgColumn[] {
        this.groupColumn = this.params.column as AgColumn;
        if (this.gos.get('treeData')) {
            _warn(237);
            return [];
        }
        const sourceColumns = this.funcColsService.getSourceColumnsForGroupColumn(this.groupColumn);
        if (!sourceColumns) {
            _warn(183);
            return [];
        }
        return sourceColumns;
    }

    private updateGroupField(): AgColumn[] | null {
        _clearElement(this.eGroupField);
        if (this.eGroupFieldSelect) {
            this.destroyBean(this.eGroupFieldSelect);
        }
        const allSourceColumns = this.getSourceColumns();
        const sourceColumns = allSourceColumns.filter((sourceColumn) => sourceColumn.isFilterAllowed());
        if (!sourceColumns.length) {
            this.selectedColumn = undefined;
            _setDisplayed(this.eGroupField, false);
            return null;
        }
        if (allSourceColumns.length === 1) {
            // we only want to hide the group field element if there's only one group column.
            // If there's one group column that has a filter, but multiple columns in total,
            // we should still show the select so the user knows which column it's for.
            this.selectedColumn = sourceColumns[0];
            _setDisplayed(this.eGroupField, false);
        } else {
            // keep the old selected column if it's still valid
            if (
                !this.selectedColumn ||
                !sourceColumns.some((column) => column.getId() === this.selectedColumn!.getId())
            ) {
                this.selectedColumn = sourceColumns[0];
            }
            this.createGroupFieldSelectElement(sourceColumns);
            this.eGroupField.appendChild(this.eGroupFieldSelect.getGui());
            this.eGroupField.appendChild(_loadTemplate(/* html */ `<div class="ag-filter-separator"></div>`));
            _setDisplayed(this.eGroupField, true);
        }

        return sourceColumns;
    }

    private createGroupFieldSelectElement(sourceColumns: AgColumn[]): void {
        this.eGroupFieldSelect = this.createManagedBean(new AgSelect());
        const localeTextFunc = this.getLocaleTextFunc();
        this.eGroupFieldSelect.setLabel(localeTextFunc('groupFilterSelect', 'Select field:'));
        this.eGroupFieldSelect.setLabelAlignment('top');
        this.eGroupFieldSelect.addOptions(
            sourceColumns.map((sourceColumn) => ({
                value: sourceColumn.getId(),
                text: this.columnNameService.getDisplayNameForColumn(sourceColumn, 'groupFilter', false) ?? undefined,
            }))
        );
        this.eGroupFieldSelect.setValue(this.selectedColumn!.getId());
        this.eGroupFieldSelect.onValueChange((newValue) => this.updateSelectedColumn(newValue));
        this.eGroupFieldSelect.addCssClass('ag-group-filter-field-select-wrapper');
        if (sourceColumns.length === 1) {
            this.eGroupFieldSelect.setDisabled(true);
        }
    }

    private getUnderlyingFilters(sourceColumns: AgColumn[] | null): AgPromise<void> {
        if (!sourceColumns) {
            this.filterColumnPairs = undefined;
            this.selectedFilter = undefined;
            this.groupColumn.setFilterActive(false, 'columnRowGroupChanged');
            return AgPromise.resolve();
        }
        const filterPromises: AgPromise<IFilterComp>[] = [];
        const filterColumnPairs: FilterColumnPair[] = [];
        sourceColumns.forEach((column) => {
            const filterWrapper = this.filterManager!.getOrCreateFilterWrapper(column);
            if (filterWrapper?.filterPromise) {
                filterPromises.push(
                    filterWrapper.filterPromise.then((filter) => {
                        if (filter) {
                            filterColumnPairs.push({
                                filter,
                                column,
                            });
                        }
                        if (column.getId() === this.selectedColumn!.getId()) {
                            this.selectedFilter = filter ?? undefined;
                        }
                        return filter!;
                    })
                );
            }
        });
        return AgPromise.all(filterPromises).then(() => {
            this.filterColumnPairs = filterColumnPairs;
            this.groupColumn.setFilterActive(this.isFilterActive(), 'columnRowGroupChanged');
        });
    }

    private addUnderlyingFilterElement(): AgPromise<void> {
        _clearElement(this.eUnderlyingFilter);
        if (!this.selectedColumn) {
            return AgPromise.resolve();
        }
        const comp = this.createManagedBean(new FilterWrapperComp(this.selectedColumn, 'COLUMN_MENU'));
        this.filterWrapperComp = comp;
        if (!comp.hasFilter()) {
            return AgPromise.resolve();
        }
        this.eUnderlyingFilter.appendChild(comp.getGui());

        return (
            comp.getFilter()?.then(() => {
                comp.afterGuiAttached?.(this.afterGuiAttachedParams);
                if (
                    !this.afterGuiAttachedParams?.suppressFocus &&
                    this.eGroupFieldSelect &&
                    !this.eGroupFieldSelect.isDisabled()
                ) {
                    this.eGroupFieldSelect.getFocusableElement().focus();
                }
            }) ?? AgPromise.resolve()
        );
    }

    private updateSelectedColumn(columnId: string | null | undefined): void {
        if (!columnId) {
            return;
        }
        this.filterWrapperComp?.afterGuiDetached();
        this.destroyBean(this.filterWrapperComp);
        const selectedFilterColumnPair = this.getFilterColumnPair(columnId);
        this.selectedColumn = selectedFilterColumnPair?.column;
        this.selectedFilter = selectedFilterColumnPair?.filter;

        this.dispatchLocalEvent({
            type: 'selectedColumnChanged',
        });
        this.addUnderlyingFilterElement();
    }

    public isFilterActive(): boolean {
        return !!this.filterColumnPairs?.some(({ filter }) => filter.isFilterActive());
    }

    public doesFilterPass(): boolean {
        return true;
    }

    public getModel(): null {
        return null;
    }

    public setModel(): AgPromise<void> {
        return AgPromise.resolve();
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        this.afterGuiAttachedParams = params;
        this.addUnderlyingFilterElement();
    }

    public afterGuiDetached(): void {
        _clearElement(this.eUnderlyingFilter);
        this.selectedFilter?.afterGuiDetached?.();
    }

    private onColumnRowGroupChanged(): void {
        this.updateGroups().then(() => {
            this.dispatchLocalEvent({
                type: 'columnRowGroupChanged',
            });
        });
    }

    private onFilterDestroyed({ column: eventColumn, source }: FilterDestroyedEvent): void {
        if (source === 'gridDestroyed') {
            return;
        }
        const colId = eventColumn.getColId();
        if (this.filterColumnPairs?.some(({ column }) => column.getColId() === colId)) {
            // filter may already be getting recreated, so wait before updating
            setTimeout(() => {
                if (this.isAlive()) {
                    this.updateGroups();
                }
            });
        }
    }

    private getFilterColumnPair(columnId: string | undefined): FilterColumnPair | undefined {
        if (!columnId) {
            return undefined;
        }
        return this.filterColumnPairs?.find(({ column }) => column.getId() === columnId);
    }

    public getSelectedFilter(): IFilterComp | undefined {
        return this.selectedFilter;
    }

    public getSelectedColumn(): AgColumn | undefined {
        return this.selectedColumn;
    }

    public isFilterAllowed(): boolean {
        return !!this.selectedColumn;
    }

    public override destroy(): void {
        super.destroy();
    }
}
