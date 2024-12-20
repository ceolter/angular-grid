import type {
    FilterEvaluator,
    FilterEvaluatorFuncParams,
    FilterEvaluatorParams,
    IRowNode,
    ISetFilterParams,
    RowNode,
    SetFilterModel,
} from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import type { SetFilterHelper } from './setFilterHelper';
import type { SetFilterService } from './setFilterService';
import { processDataPath } from './setFilterUtils';

export class SetFilterEvaluator<TValue = string>
    extends BeanStub
    implements FilterEvaluator<any, any, TValue, SetFilterModel, ISetFilterParams<any, TValue>>
{
    private params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>;

    private helper: SetFilterHelper<TValue>;

    public init(params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>): void {
        this.helper = (this.beans.setFilterSvc as SetFilterService).getHelper(params);
        this.refresh(params);
    }

    public refresh(
        params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>
    ): void {
        this.params = params;
    }

    public doesFilterPass(params: FilterEvaluatorFuncParams<any, SetFilterModel>): boolean {
        const { filteringKeys, treeDataTreeList, groupingTreeList } = this.helper;
        if (!filteringKeys.allFilteringKeysCaseFormatted()) {
            return true;
        }

        // if nothing selected, don't need to check value
        if (filteringKeys.hasNoAppliedFilteringKeys) {
            return false;
        }

        const { node } = params;
        if (treeDataTreeList) {
            return this.doesFilterPassForTreeData(node);
        }
        if (groupingTreeList) {
            return this.doesFilterPassForGrouping(node);
        }

        const value = this.getValueFromNode(node);

        if (value != null && Array.isArray(value)) {
            if (value.length === 0) {
                return this.isInAppliedModel(null);
            }
            return value.some((v) => this.isInAppliedModel(this.helper.createKey(v, node)));
        }

        return this.isInAppliedModel(this.helper.createKey(value, node));
    }

    private doesFilterPassForTreeData(node: IRowNode): boolean {
        if (node.childrenAfterGroup?.length) {
            // only perform checking on leaves. The core filtering logic for tree data won't work properly otherwise
            return false;
        }
        return this.isInAppliedModel(
            this.helper.createKey(
                processDataPath(
                    (node as RowNode).getRoute() ?? [node.key ?? node.id!],
                    true,
                    this.gos.get('groupAllowUnbalanced')
                ) as any
            ) as any
        );
    }

    private doesFilterPassForGrouping(node: IRowNode): boolean {
        const { rowGroupColsSvc, valueSvc } = this.beans;
        const dataPath = (rowGroupColsSvc?.columns ?? []).map((groupCol) => valueSvc.getKeyForNode(groupCol, node));
        dataPath.push(this.getValueFromNode(node));
        return this.isInAppliedModel(
            this.helper.createKey(processDataPath(dataPath, false, this.gos.get('groupAllowUnbalanced')) as any) as any
        );
    }

    private isInAppliedModel(key: string | null): boolean {
        return this.helper.filteringKeys.hasCaseFormattedFilteringKey(key);
    }

    private getValueFromNode(node: IRowNode): TValue | null | undefined {
        return this.params.getValue(node);
    }
}
