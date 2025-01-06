import type {
    FilterEvaluator,
    FilterEvaluatorFuncParams,
    FilterEvaluatorParams,
    FilterModelValidation,
    IRowNode,
    ISetFilterParams,
    RowNode,
    SetFilterModel,
} from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import { SetFilterAppliedModel } from './setFilterAppliedModel';
import type { SetFilterHelper } from './setFilterHelper';
import type { SetFilterService } from './setFilterService';
import { processDataPath } from './setFilterUtils';

export class SetFilterEvaluator<TValue = string>
    extends BeanStub
    implements FilterEvaluator<any, any, TValue, SetFilterModel, ISetFilterParams<any, TValue>>
{
    private params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>;
    private helper: SetFilterHelper<TValue>;
    /**
     * Here we keep track of the keys that are currently being used for filtering.
     * In most cases, the filtering keys are the same as the selected keys,
     * but for the specific case when excelMode = 'windows' and the user has ticked 'Add current selection to filter',
     * the filtering keys can be different from the selected keys.
     */
    private appliedModel: SetFilterAppliedModel;

    public init(params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>): void {
        const helper = (this.beans.setFilterSvc as SetFilterService).getHelper(params);
        this.helper = helper;
        this.appliedModel = new SetFilterAppliedModel(helper.caseFormat.bind(helper));
        this.refresh(params);
    }

    public refresh(
        params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>
    ): void {
        this.params = params;
        this.appliedModel.update(params.model);
    }

    public doesFilterPass(params: FilterEvaluatorFuncParams<any, SetFilterModel>): boolean {
        const { helper, appliedModel } = this;
        const { treeDataTreeList, groupingTreeList } = helper;
        if (appliedModel.isNull()) {
            return true;
        }

        // optimisation - if nothing selected, don't need to check value
        if (appliedModel.isEmpty()) {
            return false;
        }

        const { node } = params;
        if (treeDataTreeList) {
            return this.doesFilterPassForTreeData(node);
        }
        if (groupingTreeList) {
            return this.doesFilterPassForGrouping(node);
        }

        const value = this.params.getValue(node);

        if (value != null && Array.isArray(value)) {
            if (value.length === 0) {
                return appliedModel.has(null);
            }
            return value.some((v) => appliedModel.has(helper.createKey(v, node)));
        }

        return appliedModel.has(helper.createKey(value, node));
    }

    public validateModel() // params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>
    : Promise<FilterModelValidation<SetFilterModel>> {
        // TODO - need to check against available values
        // need to move set value model into helper
        return Promise.resolve({ valid: true });
    }

    private doesFilterPassForTreeData(node: IRowNode): boolean {
        if (node.childrenAfterGroup?.length) {
            // only perform checking on leaves. The core filtering logic for tree data won't work properly otherwise
            return false;
        }
        const { helper, gos, appliedModel } = this;
        return appliedModel.has(
            helper.createKey(
                processDataPath(
                    (node as RowNode).getRoute() ?? [node.key ?? node.id!],
                    true,
                    gos.get('groupAllowUnbalanced')
                ) as any
            ) as any
        );
    }

    private doesFilterPassForGrouping(node: IRowNode): boolean {
        const {
            helper,
            appliedModel,
            params,
            gos,
            beans: { rowGroupColsSvc, valueSvc },
        } = this;
        const dataPath = (rowGroupColsSvc?.columns ?? []).map((groupCol) => valueSvc.getKeyForNode(groupCol, node));
        dataPath.push(params.getValue(node));
        return appliedModel.has(
            helper.createKey(processDataPath(dataPath, false, gos.get('groupAllowUnbalanced')) as any) as any
        );
    }

    public override destroy(): void {
        this.appliedModel.destroy();
    }
}
