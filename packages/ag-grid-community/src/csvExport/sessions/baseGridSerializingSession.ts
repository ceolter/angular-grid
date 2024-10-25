import type { ColumnModel } from '../../columns/columnModel';
import type { ColumnNameService } from '../../columns/columnNameService';
import type { FuncColsService } from '../../columns/funcColsService';
import type { AgColumn } from '../../entities/agColumn';
import type { RowNode } from '../../entities/rowNode';
import type { GridOptionsService } from '../../gridOptionsService';
import { _isGroupMultiAutoColumn, _isGroupUseEntireRow, _isServerSideRowModel } from '../../gridOptionsUtils';
import type {
    ProcessCellForExportParams,
    ProcessGroupHeaderForExportParams,
    ProcessHeaderForExportParams,
    ProcessRowGroupForExportParams,
} from '../../interfaces/exportParams';
import type { ValueService } from '../../valueService/valueService';
import type {
    GridSerializingParams,
    GridSerializingSession,
    RowAccumulator,
    RowSpanningAccumulator,
} from '../interfaces';

export abstract class BaseGridSerializingSession<T> implements GridSerializingSession<T> {
    public colModel: ColumnModel;
    private colNames: ColumnNameService;
    public funcColsSvc: FuncColsService;
    public valueSvc: ValueService;
    public gos: GridOptionsService;
    public processCellCallback?: (params: ProcessCellForExportParams) => string;
    public processHeaderCallback?: (params: ProcessHeaderForExportParams) => string;
    public processGroupHeaderCallback?: (params: ProcessGroupHeaderForExportParams) => string;
    public processRowGroupCallback?: (params: ProcessRowGroupForExportParams) => string;

    private groupColumns: AgColumn[] = [];

    constructor(config: GridSerializingParams) {
        const {
            colModel,
            funcColsSvc,
            colNames,
            valueSvc,
            gos,
            processCellCallback,
            processHeaderCallback,
            processGroupHeaderCallback,
            processRowGroupCallback,
        } = config;

        this.colModel = colModel;
        this.funcColsSvc = funcColsSvc;
        this.colNames = colNames;
        this.valueSvc = valueSvc;
        this.gos = gos;
        this.processCellCallback = processCellCallback;
        this.processHeaderCallback = processHeaderCallback;
        this.processGroupHeaderCallback = processGroupHeaderCallback;
        this.processRowGroupCallback = processRowGroupCallback;
    }

    abstract addCustomContent(customContent: T): void;
    abstract onNewHeaderGroupingRow(): RowSpanningAccumulator;
    abstract onNewHeaderRow(): RowAccumulator;
    abstract onNewBodyRow(node?: RowNode): RowAccumulator;
    abstract parse(): string;

    public prepare(columnsToExport: AgColumn[]): void {
        this.groupColumns = columnsToExport.filter((col) => !!col.getColDef().showRowGroup);
    }

    public extractHeaderValue(column: AgColumn): string {
        const value = this.getHeaderName(this.processHeaderCallback, column);
        return value ?? '';
    }

    public extractRowCellValue(
        column: AgColumn,
        index: number,
        accumulatedRowIndex: number,
        type: string,
        node: RowNode
    ): { value: any; valueFormatted?: string | null } {
        // we render the group summary text e.g. "-> Parent -> Child"...
        const hideOpenParents = this.gos.get('groupHideOpenParents');
        const value =
            (!hideOpenParents || node.footer) && this.shouldRenderGroupSummaryCell(node, column, index)
                ? this.createValueForGroupNode(column, node)
                : this.valueSvc.getValue(column, node);

        const processedValue = this.processCell({
            accumulatedRowIndex,
            rowNode: node,
            column,
            value,
            processCellCallback: this.processCellCallback,
            type,
        });

        return processedValue;
    }

    private shouldRenderGroupSummaryCell(node: RowNode, column: AgColumn, currentColumnIndex: number): boolean {
        const isGroupNode = node && node.group;
        // only on group rows
        if (!isGroupNode) {
            return false;
        }

        const currentColumnGroupIndex = this.groupColumns.indexOf(column);

        if (currentColumnGroupIndex !== -1) {
            if (node.groupData?.[column.getId()] !== undefined) {
                return true;
            }

            if (_isServerSideRowModel(this.gos) && node.group) {
                return true;
            }

            // if this is a top level footer, always render`Total` in the left-most cell
            if (node.footer && node.level === -1) {
                const colDef = column.getColDef();
                const isFullWidth = colDef == null || colDef.showRowGroup === true;

                return isFullWidth || colDef.showRowGroup === this.funcColsSvc.rowGroupCols[0].getId();
            }
        }

        const isGroupUseEntireRow = _isGroupUseEntireRow(this.gos, this.colModel.isPivotMode());

        return currentColumnIndex === 0 && isGroupUseEntireRow;
    }

    private getHeaderName(
        callback: ((params: ProcessHeaderForExportParams) => string) | undefined,
        column: AgColumn
    ): string | null {
        if (callback) {
            return callback(this.gos.addGridCommonParams({ column }));
        }

        return this.colNames.getDisplayNameForColumn(column, 'csv', true);
    }

    private createValueForGroupNode(column: AgColumn, node: RowNode): string {
        if (this.processRowGroupCallback) {
            return this.processRowGroupCallback(this.gos.addGridCommonParams({ column, node }));
        }

        const isTreeData = this.gos.get('treeData');

        // if not tree data then we get the value from the group data
        const getValueFromNode = (node: RowNode) => {
            if (isTreeData) {
                return node.key;
            }
            const value = node.groupData?.[column.getId()];
            if (
                !value ||
                !node.rowGroupColumn ||
                node.rowGroupColumn.getColDef().useValueFormatterForExport === false
            ) {
                return value;
            }
            return this.valueSvc.formatValue(node.rowGroupColumn, node, value) ?? value;
        };

        const isFooter = node.footer;
        const keys = [getValueFromNode(node)];

        if (!_isGroupMultiAutoColumn(this.gos)) {
            while (node.parent) {
                node = node.parent;
                keys.push(getValueFromNode(node));
            }
        }

        const groupValue = keys.reverse().join(' -> ');

        return isFooter ? `Total ${groupValue}` : groupValue;
    }

    private processCell(params: {
        accumulatedRowIndex: number;
        rowNode: RowNode;
        column: AgColumn;
        value: any;
        processCellCallback: ((params: ProcessCellForExportParams) => string) | undefined;
        type: string;
    }): { value: any; valueFormatted?: string | null } {
        const { accumulatedRowIndex, rowNode, column, value, processCellCallback, type } = params;

        if (processCellCallback) {
            return {
                value:
                    processCellCallback(
                        this.gos.addGridCommonParams({
                            accumulatedRowIndex,
                            column: column,
                            node: rowNode,
                            value: value,
                            type: type,
                            parseValue: (valueToParse: string) =>
                                this.valueSvc.parseValue(
                                    column,
                                    rowNode,
                                    valueToParse,
                                    this.valueSvc.getValue(column, rowNode)
                                ),
                            formatValue: (valueToFormat: any) =>
                                this.valueSvc.formatValue(column, rowNode, valueToFormat) ?? valueToFormat,
                        })
                    ) ?? '',
            };
        }

        if (column.getColDef().useValueFormatterForExport !== false) {
            return {
                value: value ?? '',
                valueFormatted: this.valueSvc.formatValue(column, rowNode, value),
            };
        }

        return { value: value ?? '' };
    }
}
