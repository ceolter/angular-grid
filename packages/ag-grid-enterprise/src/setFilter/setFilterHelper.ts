import type {
    ColDef,
    Column,
    IRowNode,
    ISetFilterParams,
    KeyCreatorParams,
    SetFilterParams,
    ValueFormatterParams,
} from 'ag-grid-community';
import { BeanStub, GROUP_AUTO_COLUMN_ID, _error, _makeNull, _toStringOrNull } from 'ag-grid-community';

export interface SetFilterHelperParams<TValue = string> extends ISetFilterParams<any, TValue> {
    colDef: ColDef<any, TValue>;
    column: Column<TValue>;
}

export class SetFilterHelper<TValue = string> extends BeanStub {
    public createKey: (value: TValue | null | undefined, node?: IRowNode | null) => string | null;
    public treeDataTreeList = false;
    public groupingTreeList = false;
    public caseSensitive: boolean = false;
    public valueFormatter?: (params: ValueFormatterParams) => string;
    public noValueFormatterSupplied = false;

    private params: SetFilterHelperParams<TValue>;

    public init(params: SetFilterHelperParams<TValue>): void {
        this.refresh(params);
    }

    public refresh(params: SetFilterHelperParams<TValue>): void {
        this.params = params;
        const { caseSensitive, treeList, column, colDef, keyCreator, valueFormatter } = params;
        this.caseSensitive = !!caseSensitive;
        const isGroupCol = column.getId().startsWith(GROUP_AUTO_COLUMN_ID);
        this.treeDataTreeList = this.gos.get('treeData') && !!treeList && isGroupCol;
        this.groupingTreeList = !!this.beans.rowGroupColsSvc?.columns.length && !!treeList && isGroupCol;
        const resolvedKeyCreator = keyCreator ?? colDef.keyCreator;
        this.createKey = this.generateCreateKey(resolvedKeyCreator, this.treeDataTreeList || this.groupingTreeList);
        this.setValueFormatter(valueFormatter, resolvedKeyCreator, !!treeList, !!colDef.refData);
    }

    public caseFormat<T extends string | number | null>(valueToFormat: T): typeof valueToFormat {
        if (valueToFormat == null || typeof valueToFormat !== 'string') {
            return valueToFormat;
        }
        return this.caseSensitive ? valueToFormat : (valueToFormat.toUpperCase() as T);
    }

    public haveColDefParamsChanged(params: SetFilterParams<any, TValue>): boolean {
        const { colDef, keyCreator } = params;
        const { colDef: existingColDef, keyCreator: existingKeyCreator } = this.params;

        const currentKeyCreator = keyCreator ?? colDef.keyCreator;
        const previousKeyCreator = existingKeyCreator ?? existingColDef?.keyCreator;

        const filterValueGetterChanged = colDef.filterValueGetter !== existingColDef?.filterValueGetter;
        const keyCreatorChanged = currentKeyCreator !== previousKeyCreator;
        const dataTypeSvc = this.beans.dataTypeSvc;
        const valueFormatterIsKeyCreatorAndHasChanged =
            !!dataTypeSvc &&
            !!currentKeyCreator &&
            dataTypeSvc.getFormatValue(colDef.cellDataType as string) === currentKeyCreator &&
            colDef.valueFormatter !== existingColDef?.valueFormatter;

        return filterValueGetterChanged || keyCreatorChanged || valueFormatterIsKeyCreatorAndHasChanged;
    }

    private generateCreateKey(
        keyCreator: ((params: KeyCreatorParams<any, any>) => string) | undefined,
        treeDataOrGrouping: boolean
    ): (value: TValue | null | undefined, node?: IRowNode | null) => string | null {
        if (treeDataOrGrouping && !keyCreator) {
            _error(250);
            return () => null;
        }
        if (keyCreator) {
            return (value, node = null) => {
                const params = this.getKeyCreatorParams(value, node);
                return _makeNull(keyCreator!(params));
            };
        }
        return (value) => _makeNull(_toStringOrNull(value));
    }

    private getKeyCreatorParams(value: TValue | null | undefined, node: IRowNode | null = null): KeyCreatorParams {
        const { colDef, column } = this.params;
        return this.gos.addGridCommonParams({
            value,
            colDef,
            column,
            node,
            data: node?.data,
        });
    }

    private setValueFormatter(
        providedValueFormatter: ((params: ValueFormatterParams) => string) | undefined,
        keyCreator: ((params: KeyCreatorParams<any, any>) => string) | undefined,
        treeList: boolean,
        isRefData: boolean
    ) {
        let valueFormatter = providedValueFormatter;
        if (!valueFormatter) {
            if (keyCreator && !treeList) {
                _error(249);
                return;
            }
            this.noValueFormatterSupplied = true;
            // ref data is handled by ValueService
            if (!isRefData) {
                valueFormatter = (params) => _toStringOrNull(params.value)!;
            }
        }
        this.valueFormatter = valueFormatter;
    }
}
