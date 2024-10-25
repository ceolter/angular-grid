import type {
    BeanCollection,
    ColumnModel,
    ColumnVO,
    NamedBean,
    RowNode,
    StoreRefreshAfterParams,
} from 'ag-grid-community';
import { BeanStub, _isServerSideRowModel } from 'ag-grid-community';

import type { ServerSideRowModel } from '../serverSideRowModel';
import type { LazyStore } from './lazy/lazyStore';
import type { StoreFactory } from './storeFactory';

export class StoreUtils extends BeanStub implements NamedBean {
    beanName = 'ssrmStoreUtils' as const;

    private colModel: ColumnModel;
    private serverSideRowModel: ServerSideRowModel;
    private storeFactory: StoreFactory;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.serverSideRowModel = beans.rowModel as ServerSideRowModel;
        this.storeFactory = beans.ssrmStoreFactory as StoreFactory;
    }

    public getChildStore(
        keys: string[],
        currentCache: LazyStore,
        findNodeFunc: (key: string) => RowNode | null
    ): LazyStore | null {
        if (!keys?.length) {
            return currentCache;
        }

        const nextKey = keys[0];
        const nextNode = findNodeFunc(nextKey);

        if (nextNode) {
            // if we have the final node, but not the final store, we create it to allow
            // early population of data
            if (keys.length === 1 && !nextNode.childStore) {
                const storeParams = this.serverSideRowModel.getParams();
                nextNode.childStore = this.createBean(this.storeFactory.createStore(storeParams, nextNode));
            }

            const keyListForNextLevel = keys.slice(1, keys.length);
            const nextStore = nextNode.childStore as LazyStore | undefined;
            return nextStore ? nextStore.getChildStore(keyListForNextLevel) : null;
        }

        return null;
    }

    public isServerRefreshNeeded(
        parentRowNode: RowNode,
        rowGroupCols: ColumnVO[],
        params: StoreRefreshAfterParams
    ): boolean {
        if (params.valueColChanged || params.secondaryColChanged) {
            return true;
        }

        const level = parentRowNode.level + 1;
        const grouping = level < rowGroupCols.length;
        const leafNodes = !grouping;

        if (leafNodes) {
            return true;
        }

        const colIdThisGroup = rowGroupCols[level].id;
        const actionOnThisGroup = params.changedColumns.indexOf(colIdThisGroup) > -1;

        if (actionOnThisGroup) {
            return true;
        }

        const allCols = this.colModel.getCols();
        const affectedGroupCols = allCols
            // find all impacted cols which also a group display column
            .filter((col) => col.getColDef().showRowGroup && params.changedColumns.includes(col.getId()))
            .map((col) => col.getColDef().showRowGroup)
            // if displaying all groups, or displaying the effected col for this group, refresh
            .some((group) => group === true || group === colIdThisGroup);

        return affectedGroupCols;
    }

    public getServerSideInitialRowCount(): number | null {
        return this.gos.get('serverSideInitialRowCount');
    }

    public isServerSideSortAllLevels() {
        return this.gos.get('serverSideSortAllLevels') && _isServerSideRowModel(this.gos);
    }

    public isServerSideOnlyRefreshFilteredGroups() {
        return this.gos.get('serverSideOnlyRefreshFilteredGroups') && _isServerSideRowModel(this.gos);
    }
}
