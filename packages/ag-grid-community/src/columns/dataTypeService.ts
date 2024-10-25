import type { ColumnAutosizeService } from '../columnAutosize/columnAutosizeService';
import { KeyCode } from '../constants/keyCode';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColDef, SuppressKeyboardEventParams, ValueFormatterFunc, ValueFormatterParams } from '../entities/colDef';
import type {
    BaseCellDataType,
    CoreDataTypeDefinition,
    DataTypeDefinition,
    DataTypeFormatValueFunc,
    DateStringDataTypeDefinition,
    ValueFormatterLiteParams,
    ValueParserLiteParams,
} from '../entities/dataType';
import type { AgGridEvent, ColumnEventType } from '../events';
import type { FilterManager } from '../filter/filterManager';
import { _isClientSideRowModel } from '../gridOptionsUtils';
import type { IClientSideRowModel } from '../interfaces/iClientSideRowModel';
import type { ColumnEventName } from '../interfaces/iColumn';
import type { IEventListener } from '../interfaces/iEventEmitter';
import type { IRowModel } from '../interfaces/iRowModel';
import { _parseDateTimeFromString, _serialiseDate } from '../utils/date';
import { _toStringOrNull } from '../utils/generic';
import { _getValueUsingField } from '../utils/object';
import { _warn } from '../validation/logging';
import type { ValueService } from '../valueService/valueService';
import type { ColumnFactory } from './columnFactory';
import type { ColumnModel } from './columnModel';
import type { ColumnState, ColumnStateParams, ColumnStateService } from './columnStateService';
import { _convertColumnEventSourceType, convertColumnTypes } from './columnUtils';
import type { FuncColsService } from './funcColsService';

interface GroupSafeValueFormatter {
    groupSafeValueFormatter?: ValueFormatterFunc;
}

export class DataTypeService extends BeanStub implements NamedBean {
    beanName = 'dataTypeSvc' as const;

    private rowModel: IRowModel;
    private colModel: ColumnModel;
    private funcColsSvc: FuncColsService;
    private valueSvc: ValueService;
    private colState: ColumnStateService;
    private filterManager?: FilterManager;
    private colAutosize?: ColumnAutosizeService;
    private colFactory: ColumnFactory;

    public wireBeans(beans: BeanCollection): void {
        this.rowModel = beans.rowModel;
        this.colModel = beans.colModel;
        this.funcColsSvc = beans.funcColsSvc;
        this.valueSvc = beans.valueSvc;
        this.colState = beans.colState;
        this.filterManager = beans.filterManager;
        this.colAutosize = beans.colAutosize;
        this.colFactory = beans.colFactory;
    }

    private dataTypeDefinitions: {
        [cellDataType: string]: (DataTypeDefinition | CoreDataTypeDefinition) & GroupSafeValueFormatter;
    } = {};
    private dataTypeMatchers: { [cellDataType: string]: ((value: any) => boolean) | undefined };
    private formatValueFuncs: { [cellDataType: string]: DataTypeFormatValueFunc };
    private isWaitingForRowData: boolean = false;
    private hasObjectValueParser: boolean;
    private hasObjectValueFormatter: boolean;
    private groupHideOpenParents: boolean;
    private initialData: any | null | undefined;
    private isColumnTypeOverrideInDataTypeDefinitions: boolean = false;
    // keep track of any column state updates whilst waiting for data types to be inferred
    private columnStateUpdatesPendingInference: { [colId: string]: Set<keyof ColumnStateParams> } = {};
    private columnStateUpdateListenerDestroyFuncs: (() => void)[] = [];

    public postConstruct(): void {
        this.groupHideOpenParents = this.gos.get('groupHideOpenParents');
        this.addManagedPropertyListener('groupHideOpenParents', () => {
            this.groupHideOpenParents = this.gos.get('groupHideOpenParents');
        });
        this.processDataTypeDefinitions();

        this.addManagedPropertyListener('dataTypeDefinitions', (event) => {
            this.processDataTypeDefinitions();
            this.colModel.recreateColumnDefs(_convertColumnEventSourceType(event.source));
        });
    }

    private processDataTypeDefinitions(): void {
        const defaultDataTypes = this.getDefaultDataTypes();
        this.dataTypeDefinitions = {};
        this.formatValueFuncs = {};
        const generateFormatValueFunc = (
            dataTypeDefinition: (DataTypeDefinition | CoreDataTypeDefinition) & GroupSafeValueFormatter
        ): DataTypeFormatValueFunc => {
            return (params) => {
                const { column, node, value } = params;
                let valueFormatter = column.getColDef().valueFormatter;
                if (valueFormatter === dataTypeDefinition.groupSafeValueFormatter) {
                    valueFormatter = dataTypeDefinition.valueFormatter;
                }
                return this.valueSvc.formatValue(column as AgColumn, node, value, valueFormatter as any)!;
            };
        };
        Object.entries(defaultDataTypes).forEach(([cellDataType, dataTypeDefinition]) => {
            const mergedDataTypeDefinition = {
                ...dataTypeDefinition,
                groupSafeValueFormatter: this.createGroupSafeValueFormatter(dataTypeDefinition),
            };
            this.dataTypeDefinitions[cellDataType] = mergedDataTypeDefinition;
            this.formatValueFuncs[cellDataType] = generateFormatValueFunc(mergedDataTypeDefinition);
        });
        const dataTypeDefinitions = this.gos.get('dataTypeDefinitions') ?? {};
        this.dataTypeMatchers = {};

        Object.entries(dataTypeDefinitions).forEach(([cellDataType, dataTypeDefinition]) => {
            const mergedDataTypeDefinition = this.processDataTypeDefinition(
                dataTypeDefinition,
                dataTypeDefinitions,
                [cellDataType],
                defaultDataTypes
            );
            if (mergedDataTypeDefinition) {
                this.dataTypeDefinitions[cellDataType] = mergedDataTypeDefinition;
                if (dataTypeDefinition.dataTypeMatcher) {
                    this.dataTypeMatchers[cellDataType] = dataTypeDefinition.dataTypeMatcher;
                }
                this.formatValueFuncs[cellDataType] = generateFormatValueFunc(mergedDataTypeDefinition);
            }
        });
        this.checkObjectValueHandlers(defaultDataTypes);

        ['dateString', 'text', 'number', 'boolean', 'date'].forEach((cellDataType) => {
            const overriddenDataTypeMatcher = this.dataTypeMatchers[cellDataType];
            if (overriddenDataTypeMatcher) {
                // remove to maintain correct ordering
                delete this.dataTypeMatchers[cellDataType];
            }
            this.dataTypeMatchers[cellDataType] =
                overriddenDataTypeMatcher ?? defaultDataTypes[cellDataType].dataTypeMatcher;
        });
    }

    private mergeDataTypeDefinitions(
        parentDataTypeDefinition: DataTypeDefinition | CoreDataTypeDefinition,
        childDataTypeDefinition: DataTypeDefinition
    ): DataTypeDefinition {
        const mergedDataTypeDefinition = {
            ...parentDataTypeDefinition,
            ...childDataTypeDefinition,
        } as DataTypeDefinition;
        if (
            parentDataTypeDefinition.columnTypes &&
            childDataTypeDefinition.columnTypes &&
            (childDataTypeDefinition as any).appendColumnTypes
        ) {
            mergedDataTypeDefinition.columnTypes = [
                ...convertColumnTypes(parentDataTypeDefinition.columnTypes),
                ...convertColumnTypes(childDataTypeDefinition.columnTypes),
            ];
        }
        return mergedDataTypeDefinition;
    }

    private processDataTypeDefinition(
        dataTypeDefinition: DataTypeDefinition,
        dataTypeDefinitions: { [key: string]: DataTypeDefinition },
        alreadyProcessedDataTypes: string[],
        defaultDataTypes: { [key: string]: CoreDataTypeDefinition }
    ): (DataTypeDefinition & GroupSafeValueFormatter) | undefined {
        let mergedDataTypeDefinition: DataTypeDefinition;
        const extendsCellDataType = dataTypeDefinition.extendsDataType;

        if (dataTypeDefinition.columnTypes) {
            this.isColumnTypeOverrideInDataTypeDefinitions = true;
        }

        if (dataTypeDefinition.extendsDataType === dataTypeDefinition.baseDataType) {
            let baseDataTypeDefinition = defaultDataTypes[extendsCellDataType];
            const overriddenBaseDataTypeDefinition = dataTypeDefinitions[extendsCellDataType];
            if (baseDataTypeDefinition && overriddenBaseDataTypeDefinition) {
                // only if it's valid do we override with a provided one
                baseDataTypeDefinition = overriddenBaseDataTypeDefinition;
            }
            if (!this.validateDataTypeDefinition(dataTypeDefinition, baseDataTypeDefinition, extendsCellDataType)) {
                return undefined;
            }
            mergedDataTypeDefinition = this.mergeDataTypeDefinitions(baseDataTypeDefinition, dataTypeDefinition);
        } else {
            if (alreadyProcessedDataTypes.includes(extendsCellDataType)) {
                _warn(44);
                return undefined;
            }
            const extendedDataTypeDefinition = dataTypeDefinitions[extendsCellDataType];
            if (!this.validateDataTypeDefinition(dataTypeDefinition, extendedDataTypeDefinition, extendsCellDataType)) {
                return undefined;
            }
            const mergedExtendedDataTypeDefinition = this.processDataTypeDefinition(
                extendedDataTypeDefinition,
                dataTypeDefinitions,
                [...alreadyProcessedDataTypes, extendsCellDataType],
                defaultDataTypes
            );
            if (!mergedExtendedDataTypeDefinition) {
                return undefined;
            }
            mergedDataTypeDefinition = this.mergeDataTypeDefinitions(
                mergedExtendedDataTypeDefinition,
                dataTypeDefinition
            );
        }

        return {
            ...mergedDataTypeDefinition,
            groupSafeValueFormatter: this.createGroupSafeValueFormatter(mergedDataTypeDefinition),
        };
    }

    private validateDataTypeDefinition(
        dataTypeDefinition: DataTypeDefinition,
        parentDataTypeDefinition: DataTypeDefinition | CoreDataTypeDefinition,
        parentCellDataType: string
    ): boolean {
        if (!parentDataTypeDefinition) {
            _warn(45, { parentCellDataType });
            return false;
        }
        if (parentDataTypeDefinition.baseDataType !== dataTypeDefinition.baseDataType) {
            _warn(46);
            return false;
        }
        return true;
    }

    private createGroupSafeValueFormatter(
        dataTypeDefinition: DataTypeDefinition | CoreDataTypeDefinition
    ): ValueFormatterFunc | undefined {
        if (!dataTypeDefinition.valueFormatter) {
            return undefined;
        }
        return (params: ValueFormatterParams) => {
            if (params.node?.group) {
                const aggFunc = (params.colDef.pivotValueColumn ?? params.column).getAggFunc();
                if (aggFunc) {
                    // the resulting type of these will be the same, so we call valueFormatter anyway
                    if (aggFunc === 'first' || aggFunc === 'last') {
                        return dataTypeDefinition.valueFormatter!(params);
                    }

                    if (dataTypeDefinition.baseDataType === 'number' && aggFunc !== 'count') {
                        if (typeof params.value === 'number') {
                            return dataTypeDefinition.valueFormatter!(params);
                        }

                        if (typeof params.value === 'object') {
                            if (!params.value) {
                                return undefined;
                            }

                            if ('toNumber' in params.value) {
                                return dataTypeDefinition.valueFormatter!({
                                    ...params,
                                    value: params.value.toNumber(),
                                });
                            }

                            if ('value' in params.value) {
                                return dataTypeDefinition.valueFormatter!({
                                    ...params,
                                    value: params.value.value,
                                });
                            }
                        }
                    }

                    // by default don't use value formatter for agg func as type may have changed
                    return undefined as any;
                }

                // `groupRows` use the key as the value
                if (this.gos.get('groupDisplayType') === 'groupRows' && !this.gos.get('treeData')) {
                    // we don't want to double format the value
                    // as this is already formatted by using the valueFormatter as the keyCreator
                    return undefined as any;
                }
            } else if (this.groupHideOpenParents && params.column.isRowGroupActive()) {
                // `groupHideOpenParents` passes leaf values in the group column, so need to format still.
                // If it's not a string, we know it hasn't been formatted. Otherwise check the data type matcher.
                if (typeof params.value === 'string' && !dataTypeDefinition.dataTypeMatcher?.(params.value)) {
                    return undefined as any;
                }
            }
            return dataTypeDefinition.valueFormatter!(params);
        };
    }

    public updateColDefAndGetColumnType(
        colDef: ColDef,
        userColDef: ColDef,
        colId: string
    ): string | string[] | undefined {
        let { cellDataType } = userColDef;
        const { field } = userColDef;
        if (cellDataType === undefined) {
            cellDataType = colDef.cellDataType;
        }
        if (cellDataType == null || cellDataType === true) {
            cellDataType = this.canInferCellDataType(colDef, userColDef) ? this.inferCellDataType(field, colId) : false;
        }
        if (!cellDataType) {
            colDef.cellDataType = false;
            return undefined;
        }
        const dataTypeDefinition = this.dataTypeDefinitions[cellDataType as string];
        if (!dataTypeDefinition) {
            _warn(47, { cellDataType });
            return undefined;
        }
        colDef.cellDataType = cellDataType;
        if (dataTypeDefinition.groupSafeValueFormatter) {
            colDef.valueFormatter = dataTypeDefinition.groupSafeValueFormatter;
        }
        if (dataTypeDefinition.valueParser) {
            colDef.valueParser = dataTypeDefinition.valueParser;
        }
        if (!dataTypeDefinition.suppressDefaultProperties) {
            this.setColDefPropertiesForBaseDataType(colDef, cellDataType, dataTypeDefinition, colId);
        }
        return dataTypeDefinition.columnTypes;
    }

    public addColumnListeners(column: AgColumn): void {
        if (!this.isWaitingForRowData) {
            return;
        }
        const columnStateUpdates = this.columnStateUpdatesPendingInference[column.getColId()];
        if (!columnStateUpdates) {
            return;
        }
        const columnListener: IEventListener<ColumnEventName> = (
            event: AgGridEvent<any, any, ColumnEventName> & { key: keyof ColumnStateParams }
        ) => {
            columnStateUpdates.add(event.key);
        };
        column.addEventListener('columnStateUpdated', columnListener);
        this.columnStateUpdateListenerDestroyFuncs.push(() =>
            column.removeEventListener('columnStateUpdated', columnListener)
        );
    }

    private canInferCellDataType(colDef: ColDef, userColDef: ColDef): boolean {
        if (!_isClientSideRowModel(this.gos)) {
            return false;
        }
        const propsToCheckForInference = { cellRenderer: true, valueGetter: true, valueParser: true, refData: true };
        if (this.doColDefPropsPreventInference(userColDef, propsToCheckForInference)) {
            return false;
        }
        const columnTypes = userColDef.type === null ? colDef.type : userColDef.type;
        if (columnTypes) {
            const columnTypeDefs = this.gos.get('columnTypes') ?? {};
            const hasPropsPreventingInference = convertColumnTypes(columnTypes).some((columnType) => {
                const columnTypeDef = columnTypeDefs[columnType.trim()];
                return columnTypeDef && this.doColDefPropsPreventInference(columnTypeDef, propsToCheckForInference);
            });
            if (hasPropsPreventingInference) {
                return false;
            }
        }
        return !this.doColDefPropsPreventInference(colDef, propsToCheckForInference);
    }

    private doColDefPropsPreventInference(
        colDef: ColDef,
        propsToCheckForInference: { [key in keyof ColDef]: boolean }
    ): boolean {
        return [
            ['cellRenderer', 'agSparklineCellRenderer'],
            ['valueGetter', undefined],
            ['valueParser', undefined],
            ['refData', undefined],
        ].some(([prop, comparisonValue]: [keyof ColDef, any]) =>
            this.doesColDefPropPreventInference(colDef, propsToCheckForInference, prop, comparisonValue)
        );
    }

    private doesColDefPropPreventInference(
        colDef: ColDef,
        checkProps: { [key in keyof ColDef]: boolean },
        prop: keyof ColDef,
        comparisonValue?: any
    ): boolean {
        if (!checkProps[prop]) {
            return false;
        }
        const value = colDef[prop];
        if (value === null) {
            checkProps[prop] = false;
            return false;
        } else {
            return comparisonValue === undefined ? !!value : value === comparisonValue;
        }
    }

    private inferCellDataType(field: string | undefined, colId: string): string | undefined {
        if (!field) {
            return undefined;
        }
        let value: any;
        const initialData = this.getInitialData();
        if (initialData) {
            const fieldContainsDots = field.indexOf('.') >= 0 && !this.gos.get('suppressFieldDotNotation');
            value = _getValueUsingField(initialData, field, fieldContainsDots);
        } else {
            this.initWaitForRowData(colId);
        }
        if (value == null) {
            return undefined;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [cellDataType] = Object.entries(this.dataTypeMatchers).find(([_cellDataType, dataTypeMatcher]) =>
            dataTypeMatcher!(value)
        ) ?? ['object'];
        return cellDataType;
    }

    private getInitialData(): any {
        const rowData = this.gos.get('rowData');
        if (rowData?.length) {
            return rowData[0];
        } else if (this.initialData) {
            return this.initialData;
        } else {
            const rowNodes = (this.rowModel as IClientSideRowModel).rootNode?.allLeafChildren;
            if (rowNodes?.length) {
                return rowNodes[0].data;
            }
        }
        return null;
    }

    private initWaitForRowData(colId: string): void {
        this.columnStateUpdatesPendingInference[colId] = new Set();
        if (this.isWaitingForRowData) {
            return;
        }
        this.isWaitingForRowData = true;
        const columnTypeOverridesExist = this.isColumnTypeOverrideInDataTypeDefinitions;
        if (columnTypeOverridesExist && this.colAutosize) {
            this.colAutosize.shouldQueueResizeOperations = true;
        }
        const [destroyFunc] = this.addManagedEventListeners({
            rowDataUpdateStarted: (event) => {
                const { firstRowData } = event;
                if (!firstRowData) {
                    return;
                }
                destroyFunc?.();
                this.isWaitingForRowData = false;
                this.processColumnsPendingInference(firstRowData, columnTypeOverridesExist);
                this.columnStateUpdatesPendingInference = {};
                if (columnTypeOverridesExist) {
                    this.colAutosize?.processResizeOperations();
                }
                this.eventSvc.dispatchEvent({
                    type: 'dataTypesInferred',
                });
            },
        });
    }

    public isPendingInference(): boolean {
        return this.isWaitingForRowData;
    }

    private processColumnsPendingInference(firstRowData: any, columnTypeOverridesExist: boolean): void {
        this.initialData = firstRowData;
        const state: ColumnState[] = [];
        this.destroyColumnStateUpdateListeners();
        const newRowGroupColumnStateWithoutIndex: { [colId: string]: ColumnState } = {};
        const newPivotColumnStateWithoutIndex: { [colId: string]: ColumnState } = {};
        Object.entries(this.columnStateUpdatesPendingInference).forEach(([colId, columnStateUpdates]) => {
            const column = this.colModel.getCol(colId);
            if (!column) {
                return;
            }
            const oldColDef = column.getColDef();
            if (!this.resetColDefIntoCol(column, 'cellDataTypeInferred')) {
                return;
            }
            const newColDef = column.getColDef();
            if (columnTypeOverridesExist && newColDef.type && newColDef.type !== oldColDef.type) {
                const updatedColumnState = this.getUpdatedColumnState(column, columnStateUpdates);
                if (updatedColumnState.rowGroup && updatedColumnState.rowGroupIndex == null) {
                    newRowGroupColumnStateWithoutIndex[colId] = updatedColumnState;
                }
                if (updatedColumnState.pivot && updatedColumnState.pivotIndex == null) {
                    newPivotColumnStateWithoutIndex[colId] = updatedColumnState;
                }
                state.push(updatedColumnState);
            }
        });
        if (columnTypeOverridesExist) {
            state.push(
                ...this.funcColsSvc.generateColumnStateForRowGroupAndPivotIndexes(
                    newRowGroupColumnStateWithoutIndex,
                    newPivotColumnStateWithoutIndex
                )
            );
        }
        if (state.length) {
            this.colState.applyColumnState({ state }, 'cellDataTypeInferred');
        }
        this.initialData = null;
    }

    private resetColDefIntoCol(column: AgColumn, source: ColumnEventType): boolean {
        const userColDef = column.getUserProvidedColDef();
        if (!userColDef) {
            return false;
        }
        const newColDef = this.colFactory.addColumnDefaultAndTypes(userColDef, column.getColId());
        column.setColDef(newColDef, userColDef, source);
        return true;
    }

    private getUpdatedColumnState(column: AgColumn, columnStateUpdates: Set<keyof ColumnStateParams>): ColumnState {
        const columnState = this.colState.getColumnStateFromColDef(column);
        columnStateUpdates.forEach((key) => {
            // if the column state has been updated, don't update again
            delete columnState[key];
            if (key === 'rowGroup') {
                delete columnState.rowGroupIndex;
            } else if (key === 'pivot') {
                delete columnState.pivotIndex;
            }
        });
        return columnState;
    }

    private checkObjectValueHandlers(defaultDataTypes: { [key: string]: CoreDataTypeDefinition }): void {
        const resolvedObjectDataTypeDefinition = this.dataTypeDefinitions.object;
        const defaultObjectDataTypeDefinition = defaultDataTypes.object;
        this.hasObjectValueParser =
            resolvedObjectDataTypeDefinition.valueParser !== defaultObjectDataTypeDefinition.valueParser;
        this.hasObjectValueFormatter =
            resolvedObjectDataTypeDefinition.valueFormatter !== defaultObjectDataTypeDefinition.valueFormatter;
    }

    private getDateStringTypeDefinition(column?: AgColumn | null): DateStringDataTypeDefinition {
        if (!column) {
            return this.dataTypeDefinitions.dateString as DateStringDataTypeDefinition;
        }
        return (this.getDataTypeDefinition(column) ??
            this.dataTypeDefinitions.dateString) as DateStringDataTypeDefinition;
    }

    public getDateParserFunction(column?: AgColumn | null): (value: string | undefined) => Date | undefined {
        return this.getDateStringTypeDefinition(column).dateParser!;
    }

    public getDateFormatterFunction(column?: AgColumn | null): (value: Date | undefined) => string | undefined {
        return this.getDateStringTypeDefinition(column).dateFormatter!;
    }

    public getDataTypeDefinition(column: AgColumn): DataTypeDefinition | CoreDataTypeDefinition | undefined {
        const colDef = column.getColDef();
        if (!colDef.cellDataType) {
            return undefined;
        }
        return this.dataTypeDefinitions[colDef.cellDataType as string];
    }

    public getBaseDataType(column: AgColumn): BaseCellDataType | undefined {
        return this.getDataTypeDefinition(column)?.baseDataType;
    }

    public checkType(column: AgColumn, value: any): boolean {
        if (value == null) {
            return true;
        }
        const dataTypeMatcher = this.getDataTypeDefinition(column)?.dataTypeMatcher;
        if (!dataTypeMatcher) {
            return true;
        }
        return dataTypeMatcher(value);
    }

    public validateColDef(colDef: ColDef): void {
        const warning = (property: 'Formatter' | 'Parser') => _warn(48, { property });
        if (colDef.cellDataType === 'object') {
            if (
                colDef.valueFormatter === this.dataTypeDefinitions.object.groupSafeValueFormatter &&
                !this.hasObjectValueFormatter
            ) {
                warning('Formatter');
            }
            if (
                colDef.editable &&
                colDef.valueParser === this.dataTypeDefinitions.object.valueParser &&
                !this.hasObjectValueParser
            ) {
                warning('Parser');
            }
        }
    }

    public getFormatValue(cellDataType: string): DataTypeFormatValueFunc | undefined {
        return this.formatValueFuncs[cellDataType];
    }

    private setColDefPropertiesForBaseDataType(
        colDef: ColDef,
        cellDataType: string,
        dataTypeDefinition: (DataTypeDefinition | CoreDataTypeDefinition) & GroupSafeValueFormatter,
        colId: string
    ): void {
        const formatValue = this.formatValueFuncs[cellDataType];
        switch (dataTypeDefinition.baseDataType) {
            case 'number': {
                colDef.cellEditor = 'agNumberCellEditor';
                break;
            }
            case 'boolean': {
                colDef.cellEditor = 'agCheckboxCellEditor';
                colDef.cellRenderer = 'agCheckboxCellRenderer';
                colDef.suppressKeyboardEvent = (params: SuppressKeyboardEventParams<any, boolean>) =>
                    !!params.colDef.editable && params.event.key === KeyCode.SPACE;
                break;
            }
            case 'date': {
                colDef.cellEditor = 'agDateCellEditor';
                colDef.keyCreator = formatValue;
                break;
            }
            case 'dateString': {
                colDef.cellEditor = 'agDateStringCellEditor';
                colDef.keyCreator = formatValue;
                break;
            }
            case 'object': {
                colDef.cellEditorParams = {
                    useFormatter: true,
                };
                colDef.comparator = (a: any, b: any) => {
                    const column = this.colModel.getColDefCol(colId);
                    const colDef = column?.getColDef();
                    if (!column || !colDef) {
                        return 0;
                    }
                    const valA = a == null ? '' : formatValue({ column, node: null, value: a });
                    const valB = b == null ? '' : formatValue({ column, node: null, value: b });
                    if (valA === valB) return 0;
                    return valA > valB ? 1 : -1;
                };
                colDef.keyCreator = formatValue;
                break;
            }
        }
        this.filterManager?.setColDefPropertiesForDataType(colDef, dataTypeDefinition, formatValue);
    }

    private getDefaultDataTypes(): { [key: string]: CoreDataTypeDefinition } {
        const defaultDateFormatMatcher = (value: string) => !!value.match('^\\d{4}-\\d{2}-\\d{2}$');
        const translate = this.getLocaleTextFunc();
        return {
            number: {
                baseDataType: 'number',
                // can be empty space with legacy copy
                valueParser: (params: ValueParserLiteParams<any, number>) =>
                    params.newValue?.trim?.() === '' ? null : Number(params.newValue),
                valueFormatter: (params: ValueFormatterLiteParams<any, number>) => {
                    if (params.value == null) {
                        return '';
                    }
                    if (typeof params.value !== 'number' || isNaN(params.value)) {
                        return translate('invalidNumber', 'Invalid Number');
                    }
                    return String(params.value);
                },
                dataTypeMatcher: (value: any) => typeof value === 'number',
            },
            text: {
                baseDataType: 'text',
                valueParser: (params: ValueParserLiteParams<any, string>) =>
                    params.newValue === '' ? null : _toStringOrNull(params.newValue),
                dataTypeMatcher: (value: any) => typeof value === 'string',
            },
            boolean: {
                baseDataType: 'boolean',
                valueParser: (params: ValueParserLiteParams<any, boolean>) => {
                    if (params.newValue == null) {
                        return params.newValue;
                    }
                    // can be empty space with legacy copy
                    return params.newValue?.trim?.() === '' ? null : String(params.newValue).toLowerCase() === 'true';
                },
                valueFormatter: (params: ValueFormatterLiteParams<any, boolean>) =>
                    params.value == null ? '' : String(params.value),
                dataTypeMatcher: (value: any) => typeof value === 'boolean',
            },
            date: {
                baseDataType: 'date',
                valueParser: (params: ValueParserLiteParams<any, Date>) =>
                    _parseDateTimeFromString(params.newValue == null ? null : String(params.newValue)),
                valueFormatter: (params: ValueFormatterLiteParams<any, Date>) => {
                    if (params.value == null) {
                        return '';
                    }
                    if (!(params.value instanceof Date) || isNaN(params.value.getTime())) {
                        return translate('invalidDate', 'Invalid Date');
                    }
                    return _serialiseDate(params.value, false) ?? '';
                },
                dataTypeMatcher: (value: any) => value instanceof Date,
            },
            dateString: {
                baseDataType: 'dateString',
                dateParser: (value: string | undefined) => _parseDateTimeFromString(value) ?? undefined,
                dateFormatter: (value: Date | undefined) => _serialiseDate(value ?? null, false) ?? undefined,
                valueParser: (params: ValueParserLiteParams<any, string>) =>
                    defaultDateFormatMatcher(String(params.newValue)) ? params.newValue : null,
                valueFormatter: (params: ValueFormatterLiteParams<any, string>) =>
                    defaultDateFormatMatcher(String(params.value)) ? params.value! : '',
                dataTypeMatcher: (value: any) => typeof value === 'string' && defaultDateFormatMatcher(value),
            },
            object: {
                baseDataType: 'object',
                valueParser: () => null,
                valueFormatter: (params: ValueFormatterLiteParams<any, any>) => _toStringOrNull(params.value) ?? '',
            },
        };
    }

    private destroyColumnStateUpdateListeners(): void {
        this.columnStateUpdateListenerDestroyFuncs.forEach((destroyFunc) => destroyFunc());
        this.columnStateUpdateListenerDestroyFuncs = [];
    }

    public override destroy(): void {
        this.dataTypeDefinitions = {};
        this.dataTypeMatchers = {};
        this.formatValueFuncs = {};
        this.columnStateUpdatesPendingInference = {};
        this.destroyColumnStateUpdateListeners();
        super.destroy();
    }
}
