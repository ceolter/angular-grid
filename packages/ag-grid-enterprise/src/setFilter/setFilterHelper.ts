import type {
    ColDef,
    Column,
    IRowNode,
    ISetFilterParams,
    KeyCreatorParams,
    ValueFormatterParams,
} from 'ag-grid-community';
import {
    BeanStub,
    GROUP_AUTO_COLUMN_ID,
    _error,
    _isClientSideRowModel,
    _makeNull,
    _toStringOrNull,
} from 'ag-grid-community';

import { ClientSideValuesExtractor } from './clientSideValueExtractor';
import { SetFilterAllValues } from './setFilterAllValues';

export interface SetFilterHelperParams<TValue> extends ISetFilterParams<any, TValue> {
    colDef: ColDef<any, TValue>;
    column: Column<TValue>;
    getValue: <TValue = any>(
        node: IRowNode<any>,
        column?: string | ColDef<any, TValue> | Column<TValue>
    ) => TValue | null | undefined;
}

export class SetFilterHelper<TValue> extends BeanStub {
    public createKey: (value: TValue | null | undefined, node?: IRowNode | null) => string | null;
    public treeDataTreeList = false;
    public groupingTreeList = false;
    public caseSensitive: boolean = false;
    public valueFormatter?: (params: ValueFormatterParams) => string;
    public noValueFormatterSupplied = false;
    public allValues: SetFilterAllValues<TValue>;

    private params: SetFilterHelperParams<TValue>;

    public init(params: SetFilterHelperParams<TValue>): void {
        this.updateParams(params);
        const isTreeDataOrGrouping = () => this.treeDataTreeList || this.groupingTreeList;
        const isTreeData = () => this.treeDataTreeList;
        const createKey = (value: TValue | null | undefined, node?: IRowNode | null) => this.createKey(value, node);
        const caseFormat = this.caseFormat.bind(this);
        const { gos, beans } = this;
        const clientSideValuesExtractor = _isClientSideRowModel(gos, beans.rowModel)
            ? this.createManagedBean(
                  new ClientSideValuesExtractor<TValue>(
                      createKey,
                      caseFormat,
                      params.getValue,
                      isTreeDataOrGrouping,
                      isTreeData
                  )
              )
            : undefined;
        this.allValues = this.createManagedBean(
            new SetFilterAllValues(clientSideValuesExtractor, caseFormat, createKey, isTreeDataOrGrouping, {
                filterParams: params,
                usingComplexObjects: !!(params.keyCreator ?? params.colDef.keyCreator),
            })
        );
    }

    public refresh(params: SetFilterHelperParams<TValue>): void {
        this.updateParams(params);
        this.allValues.refresh({
            filterParams: params,
            usingComplexObjects: !!(params.keyCreator ?? params.colDef.keyCreator),
        });
    }

    private updateParams(params: SetFilterHelperParams<TValue>): void {
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
