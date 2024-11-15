import type {
    AdvancedFilterModel,
    BeanCollection,
    FilterManager,
    FilterModel,
    NamedBean,
    StoreRefreshAfterParams,
} from 'ag-grid-community';
import { BeanStub, _isServerSideRowModel } from 'ag-grid-community';

import type { ServerSideRowModel } from '../serverSideRowModel';
import type { ListenerUtils } from './listenerUtils';

export class FilterListener extends BeanStub implements NamedBean {
    beanName = 'ssrmFilterListener' as const;

    private serverSideRowModel: ServerSideRowModel;
    private filterManager?: FilterManager;
    private listenerUtils: ListenerUtils;

    public wireBeans(beans: BeanCollection) {
        this.serverSideRowModel = beans.rowModel as ServerSideRowModel;
        this.filterManager = beans.filterManager;
        this.listenerUtils = beans.ssrmListenerUtils as ListenerUtils;
    }

    public postConstruct(): void {
        // only want to be active if SSRM active, otherwise would be interfering with other row models
        if (!_isServerSideRowModel(this.gos)) {
            return;
        }

        this.addManagedEventListeners({
            advancedFilterEnabledChanged: () => this.onFilterChanged(true),
            filterChanged: () => this.onFilterChanged(),
        });
    }

    private onFilterChanged(advancedFilterEnabledChanged?: boolean): void {
        const storeParams = this.serverSideRowModel.getParams();
        if (!storeParams) {
            return;
        } // params is undefined if no datasource set

        const oldModel = storeParams.filterModel;
        let newModel: FilterModel | AdvancedFilterModel | null;
        let changedColumns: string[];

        if (this.filterManager?.isAdvFilterEnabled()) {
            newModel = this.filterManager.getAdvFilterModel();
            // if advancedFilterEnabledChanged, old model is of type `FilterModel`
            const oldColumns = advancedFilterEnabledChanged
                ? Object.keys(oldModel ?? {})
                : this.getAdvancedFilterColumns(oldModel as AdvancedFilterModel | null);
            const newColumns = this.getAdvancedFilterColumns(newModel as AdvancedFilterModel | null);
            oldColumns.forEach((column) => newColumns.add(column));
            changedColumns = Array.from(newColumns);
        } else {
            newModel = this.filterManager?.getFilterModel() ?? {};
            if (advancedFilterEnabledChanged) {
                // old model is of type `AdvancedFilterModel | null`
                const oldColumns = this.getAdvancedFilterColumns(oldModel as AdvancedFilterModel | null);
                Object.keys(newModel).forEach((column) => oldColumns.add(column));
                changedColumns = Array.from(oldColumns);
            } else {
                changedColumns = this.findChangedColumns(oldModel as FilterModel, newModel as FilterModel);
            }
        }

        const valueColChanged = this.listenerUtils.isSortingWithValueColumn(changedColumns);
        const secondaryColChanged = this.listenerUtils.isSortingWithSecondaryColumn(changedColumns);

        const params: StoreRefreshAfterParams = {
            valueColChanged,
            secondaryColChanged,
            changedColumns,
        };

        this.serverSideRowModel.refreshAfterFilter(newModel, params);
    }

    private findChangedColumns(oldModel: FilterModel, newModel: FilterModel): string[] {
        const allColKeysMap: { [key: string]: boolean } = {};

        Object.keys(oldModel).forEach((key) => (allColKeysMap[key] = true));
        Object.keys(newModel).forEach((key) => (allColKeysMap[key] = true));

        const res: string[] = [];

        Object.keys(allColKeysMap).forEach((key) => {
            const oldJson = JSON.stringify(oldModel[key]);
            const newJson = JSON.stringify(newModel[key]);
            const filterChanged = oldJson != newJson;
            if (filterChanged) {
                res.push(key);
            }
        });

        return res;
    }

    private getAdvancedFilterColumns(model: AdvancedFilterModel | null): Set<string> {
        const columns = new Set<string>();
        if (!model) {
            return columns;
        }

        const processAdvancedFilterModel = (filterModel: AdvancedFilterModel) => {
            if (filterModel.filterType === 'join') {
                filterModel.conditions.forEach((condition) => processAdvancedFilterModel(condition));
            } else {
                columns.add(filterModel.colId);
            }
        };

        processAdvancedFilterModel(model);

        return columns;
    }
}
