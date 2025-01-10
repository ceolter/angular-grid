import type { AgColumn } from '../entities/agColumn';
import type { FilterDestroyedEvent } from '../events';
import type { IAfterGuiAttachedParams } from '../interfaces/iAfterGuiAttachedParams';
import type { IFilterComp } from '../interfaces/iFilter';
import { _clearElement } from '../utils/dom';
import { _exists } from '../utils/generic';
import { AgPromise } from '../utils/promise';
import { _warn } from '../validation/logging';
import { Component } from '../widgets/component';
import type { FilterRequestSource } from './iColumnFilter';

export class FilterWrapperComp extends Component {
    private filterPromise: AgPromise<IFilterComp> | null = null;

    constructor(
        private readonly column: AgColumn,
        private readonly source: FilterRequestSource
    ) {
        super(/* html */ `<div class="ag-filter"></div>`);
    }

    public postConstruct(): void {
        this.createFilter(true);

        this.addManagedEventListeners({ filterDestroyed: this.onFilterDestroyed.bind(this) });
    }

    public hasFilter(): boolean {
        return this.filterPromise != null;
    }

    public getFilter(): AgPromise<IFilterComp> | null {
        return this.filterPromise;
    }

    public afterInit(): AgPromise<void> {
        return this.filterPromise?.then(() => {}) ?? AgPromise.resolve();
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        this.filterPromise?.then((filter) => {
            filter?.afterGuiAttached?.(params);
        });
    }

    public afterGuiDetached(): void {
        this.filterPromise?.then((filter) => {
            filter?.afterGuiDetached?.();
        });
    }

    private createFilter(init?: boolean): void {
        const { column, source } = this;
        const filterPromise = this.beans.colFilter?.getOrCreateFilterUi(column) ?? null;
        this.filterPromise = filterPromise;
        filterPromise?.then((filter) => {
            const guiFromFilter = filter!.getGui();

            if (!_exists(guiFromFilter)) {
                _warn(69, { guiFromFilter });
            }

            this.appendChild(guiFromFilter);
            if (init) {
                this.eventSvc.dispatchEvent({
                    type: 'filterOpened',
                    column,
                    source,
                    eGui: this.getGui(),
                });
            }
        });
    }

    private onFilterDestroyed(event: FilterDestroyedEvent): void {
        if (
            (event.source === 'api' || event.source === 'paramsUpdated') &&
            event.column.getId() === this.column.getId() &&
            this.beans.colModel.getColDefCol(this.column)
        ) {
            // filter has been destroyed by the API or params changing. If the column still exists, need to recreate UI component
            _clearElement(this.getGui());
            this.createFilter();
        }
    }

    public override destroy(): void {
        this.filterPromise = null;
        super.destroy();
    }
}
