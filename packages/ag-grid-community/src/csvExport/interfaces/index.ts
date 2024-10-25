import type { ColumnModel } from '../../columns/columnModel';
import type { ColumnNameService } from '../../columns/columnNameService';
import type { FuncColsService } from '../../columns/funcColsService';
import type { AgColumn } from '../../entities/agColumn';
import type { RowNode } from '../../entities/rowNode';
import type { GridOptionsService } from '../../gridOptionsService';
import type {
    ProcessCellForExportParams,
    ProcessGroupHeaderForExportParams,
    ProcessHeaderForExportParams,
    ProcessRowGroupForExportParams,
} from '../../interfaces/exportParams';
import type { ColumnGroup } from '../../interfaces/iColumn';
import type { ValueService } from '../../valueService/valueService';
import type { GridSerializer } from '../gridSerializer';

export interface BaseCreatorBeans {
    gridSerializer: GridSerializer;
    gos: GridOptionsService;
}

export interface RowAccumulator {
    onColumn(column: AgColumn, index: number, node?: RowNode): void;
}

export interface RowSpanningAccumulator {
    onColumn(
        columnGroup: ColumnGroup,
        header: string,
        index: number,
        span: number,
        collapsibleGroupRanges: number[][]
    ): void;
}

export interface GridSerializingParams {
    colModel: ColumnModel;
    funcColsSvc: FuncColsService;
    colNames: ColumnNameService;
    valueSvc: ValueService;
    gos: GridOptionsService;
    processCellCallback?: (params: ProcessCellForExportParams) => string;
    processHeaderCallback?: (params: ProcessHeaderForExportParams) => string;
    processGroupHeaderCallback?: (params: ProcessGroupHeaderForExportParams) => string;
    processRowGroupCallback?: (params: ProcessRowGroupForExportParams) => string;
}

export interface CsvSerializingParams extends GridSerializingParams {
    suppressQuotes: boolean;
    columnSeparator: string;
}

export interface GridSerializingSession<T> {
    prepare(columnsToExport: AgColumn[]): void;
    onNewHeaderGroupingRow(): RowSpanningAccumulator;
    onNewHeaderRow(): RowAccumulator;
    onNewBodyRow(node?: RowNode): RowAccumulator;
    addCustomContent(customContent: T): void;

    /**
     * FINAL RESULT
     */
    parse(): string;
}
