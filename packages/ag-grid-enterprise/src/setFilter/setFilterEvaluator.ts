import type {
    FilterEvaluator,
    FilterEvaluatorFuncParams,
    FilterEvaluatorParams,
    FilterModelValidation,
    IRowNode,
    ISetFilterParams,
    RowNode,
    SetFilterModel,
    SetFilterModelValue,
} from 'ag-grid-community';
import { BeanStub, _makeNull } from 'ag-grid-community';

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

    public init(
        params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>
    ): Promise<FilterModelValidation<SetFilterModel>> {
        const helper = (this.beans.setFilterSvc as SetFilterService).getHelper(params);
        this.helper = helper;
        this.appliedModel = new SetFilterAppliedModel(helper.caseFormat.bind(helper));
        this.refresh(params);

        return this.validateModel(params);
    }

    public refresh(
        params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>
    ): Promise<FilterModelValidation<SetFilterModel>> {
        this.params = params;

        return this.validateModel(params).then((result) => {
            const { valid, model } = result;
            this.appliedModel.update(valid ? params.model : model ?? null);
            return result;
        });
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

    protected validateModel(
        params: FilterEvaluatorParams<any, any, TValue, SetFilterModel> & ISetFilterParams<any, TValue>
    ): Promise<FilterModelValidation<SetFilterModel>> {
        const helper = this.helper;
        const allValues = helper.allValues;
        return new Promise((resolve) => {
            allValues.allValuesPromise.then(() => {
                const model = params.model;
                if (model == null) {
                    resolve({ valid: true });
                    return;
                }
                const existingFormattedKeys: Map<string | null, string | null> = new Map();
                allValues.allValues.forEach((_value, key) => {
                    existingFormattedKeys.set(helper.caseFormat(key), key);
                });
                const newValues: SetFilterModelValue = [];
                let updated = false;
                for (const unformattedKey of model.values) {
                    const formattedKey = helper.caseFormat(_makeNull(unformattedKey));
                    const existingUnformattedKey = existingFormattedKeys.get(formattedKey);
                    if (existingUnformattedKey !== undefined) {
                        newValues.push(existingUnformattedKey);
                    } else {
                        updated = true;
                    }
                }
                if (newValues.length === 0 && params.excelMode) {
                    resolve({ valid: false, model: null });
                    return;
                }
                resolve(updated ? { valid: false, model: { ...model, values: newValues } } : { valid: true });
            });
        });
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
