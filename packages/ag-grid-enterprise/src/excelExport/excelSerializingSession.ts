import type {
    AgColumn,
    AgColumnGroup,
    Column,
    ColumnGroup,
    ExcelCell,
    ExcelColumn,
    ExcelExportParams,
    ExcelImage,
    ExcelOOXMLDataType,
    ExcelRow,
    ExcelStyle,
    ExcelWorksheet,
    ExcelWorksheetConfigParams,
    GridSerializingParams,
    RowAccumulator,
    RowHeightCallbackParams,
    RowNode,
    RowSpanningAccumulator,
} from 'ag-grid-community';
import { BaseGridSerializingSession, _last, _mergeDeep, _warn } from 'ag-grid-community';

import { getHeightFromProperty } from './assets/excelUtils';
import { addXlsxBodyImageToMap, createXlsxExcel, getXlsxStringPosition } from './excelXlsxFactory';

export interface StyleLinkerInterface {
    rowType: 'HEADER_GROUPING' | 'HEADER' | 'BODY';
    rowIndex: number;
    value: string;
    column?: Column;
    columnGroup?: ColumnGroup;
    node?: RowNode;
}

interface ExcelMixedStyle {
    key: string;
    excelID: string;
    result: ExcelStyle;
}

export interface ExcelGridSerializingParams extends ExcelWorksheetConfigParams, GridSerializingParams {
    baseExcelStyles: ExcelStyle[];
    styleLinker: (params: StyleLinkerInterface) => string[];
    frozenRowCount?: number;
    frozenColumnCount?: number;
}

export class ExcelSerializingSession extends BaseGridSerializingSession<ExcelRow[]> {
    private readonly config: ExcelGridSerializingParams & ExcelExportParams;
    private readonly stylesByIds: { [key: string]: ExcelStyle };

    private mixedStyles: { [key: string]: ExcelMixedStyle } = {};
    private mixedStyleCounter: number = 0;

    private readonly excelStyles: (ExcelStyle & { quotePrefix?: 1 })[];

    private rows: ExcelRow[] = [];
    private cols: ExcelColumn[];
    private columnsToExport: AgColumn[];
    private frozenRowCount: number = 0;
    private skipFrozenRows = false;
    private frozenColumnCount: number = 0;
    private skipFrozenColumns = false;

    constructor(config: ExcelGridSerializingParams) {
        super(config);
        this.config = Object.assign({}, config);
        this.stylesByIds = {};
        this.config.baseExcelStyles.forEach((style) => {
            this.stylesByIds[style.id] = style;
        });
        this.excelStyles = [...this.config.baseExcelStyles, { id: '_quotePrefix', quotePrefix: 1 }];
    }

    public addCustomContent(customContent: ExcelRow[]): void {
        customContent.forEach((row) => {
            const rowLen = this.rows.length + 1;
            let outlineLevel: number | undefined;

            if (!this.config.suppressRowOutline && row.outlineLevel != null) {
                outlineLevel = row.outlineLevel;
            }

            const rowObj: ExcelRow = {
                height: getHeightFromProperty(rowLen, row.height || this.config.rowHeight),
                cells: (row.cells || []).map((cell, idx) => {
                    const image = this.addImage(rowLen, this.columnsToExport[idx], cell.data?.value as string);

                    let excelStyles: string[] | null = null;

                    if (cell.styleId) {
                        excelStyles = typeof cell.styleId === 'string' ? [cell.styleId] : cell.styleId;
                    }

                    const excelStyleId = this.getStyleId(excelStyles);

                    if (image) {
                        return this.createCell(
                            excelStyleId,
                            this.getDataTypeForValue(image.value),
                            image.value == null ? '' : image.value
                        );
                    }

                    const value = cell.data?.value ?? '';
                    const type = this.getDataTypeForValue(value);

                    if (cell.mergeAcross) {
                        return this.createMergedCell(excelStyleId, type, value, cell.mergeAcross);
                    }

                    return this.createCell(excelStyleId, type, value);
                }),
                outlineLevel,
            };

            if (row.collapsed != null) {
                rowObj.collapsed = row.collapsed;
            }
            if (row.hidden != null) {
                rowObj.hidden = row.hidden;
            }

            this.rows.push(rowObj);
        });
    }

    public onNewHeaderGroupingRow(): RowSpanningAccumulator {
        const currentCells: ExcelCell[] = [];
        const { freezeRows, headerRowHeight } = this.config;

        this.rows.push({
            cells: currentCells,
            height: getHeightFromProperty(this.rows.length + 1, headerRowHeight),
        });

        if (freezeRows) {
            this.frozenRowCount++;
        }

        return {
            onColumn: (
                columnGroup: AgColumnGroup,
                header: string,
                index: number,
                span: number,
                collapsibleRanges: number[][]
            ) => {
                const styleIds: string[] = this.config.styleLinker({
                    rowType: 'HEADER_GROUPING',
                    rowIndex: 1,
                    value: `grouping-${header}`,
                    columnGroup,
                });
                currentCells.push({
                    ...this.createMergedCell(
                        this.getStyleId(styleIds),
                        this.getDataTypeForValue('string'),
                        header,
                        span
                    ),
                    collapsibleRanges,
                });
            },
        };
    }

    public onNewHeaderRow(): RowAccumulator {
        const { freezeRows, headerRowHeight } = this.config;

        if (freezeRows) {
            this.frozenRowCount++;
        }

        return this.onNewRow(this.onNewHeaderColumn, headerRowHeight);
    }

    public onNewBodyRow(node?: RowNode): RowAccumulator {
        const { freezeRows, rowHeight } = this.config;

        if (!this.skipFrozenRows) {
            if (freezeRows === 'headersAndPinnedRows' && node?.rowPinned === 'top') {
                this.frozenRowCount++;
            } else if (typeof freezeRows === 'function') {
                if (freezeRows({ ...this.gos.getGridCommonParams(), node: node! })) {
                    this.frozenRowCount++;
                } else {
                    this.skipFrozenRows = true;
                }
            } else {
                this.skipFrozenRows = true;
            }
        }

        const rowAccumulator = this.onNewRow(this.onNewBodyColumn, rowHeight);

        if (node) {
            this.addRowOutlineIfNecessary(node);
        }

        return rowAccumulator;
    }

    public override prepare(columnsToExport: AgColumn[]): void {
        super.prepare(columnsToExport);
        this.columnsToExport = [...columnsToExport];
        this.cols = columnsToExport.map((col, i) => this.convertColumnToExcel(col, i));
    }

    public parse(): string {
        // adding custom content might have made some rows wider than the grid, so add new columns
        const longestRow = this.rows.reduce((a, b) => Math.max(a, b.cells.length), 0);
        while (this.cols.length < longestRow) {
            this.cols.push(this.convertColumnToExcel(null, this.cols.length + 1));
        }

        const { config } = this;

        let name: string;
        if (config.sheetName != null) {
            const { sheetName } = config;
            const sheetNameValue =
                typeof sheetName === 'function' ? sheetName(this.gos.getGridCommonParams()) : sheetName;

            name = String(sheetNameValue).substring(0, 31);
        } else {
            name = 'ag-grid';
        }

        const data: ExcelWorksheet = {
            name,
            table: {
                columns: this.cols,
                rows: this.rows,
            },
        };

        return this.createExcel(data);
    }

    private addRowOutlineIfNecessary(node: RowNode): void {
        const { gos, suppressRowOutline, rowGroupExpandState = 'expanded' } = this.config;
        const isGroupHideOpenParents = gos.get('groupHideOpenParents');

        if (isGroupHideOpenParents || suppressRowOutline || node.level == null) {
            return;
        }

        const padding = node.footer ? 1 : 0;
        const currentRow = _last(this.rows);

        // Excel only supports up to 7 levels of outline
        const outlineLevel = Math.min(node.level + padding, 7);

        currentRow.outlineLevel = outlineLevel;

        if (rowGroupExpandState === 'expanded') {
            return;
        }

        const collapseAll = rowGroupExpandState === 'collapsed';

        if (node.isExpandable()) {
            const isExpanded = !collapseAll && node.expanded;
            currentRow.collapsed = !isExpanded;
        }

        currentRow.hidden =
            // always show the node if there is no parent to be expanded
            !!node.parent &&
            // or if it is a child of the root node
            node.parent.level !== -1 &&
            (collapseAll || this.isAnyParentCollapsed(node.parent));
    }

    private isAnyParentCollapsed(node?: RowNode | null): boolean {
        while (node && node.level !== -1) {
            if (!node.expanded) {
                return true;
            }

            node = node.parent;
        }

        return false;
    }

    private convertColumnToExcel(column: AgColumn | null, index: number): ExcelColumn {
        const columnWidth = this.config.columnWidth;
        const headerValue = column ? this.extractHeaderValue(column) : undefined;
        const displayName = headerValue ?? '';
        const filterAllowed = column ? column.isFilterAllowed() : false;
        if (columnWidth) {
            if (typeof columnWidth === 'number') {
                return { width: columnWidth, displayName, filterAllowed };
            }

            return { width: columnWidth({ column, index }), displayName, filterAllowed };
        }

        if (column) {
            const smallestUsefulWidth = 75;
            return { width: Math.max(column.getActualWidth(), smallestUsefulWidth), displayName, filterAllowed };
        }

        return {
            displayName,
            filterAllowed,
        };
    }

    private onNewHeaderColumn(
        rowIndex: number,
        currentCells: ExcelCell[]
    ): (column: AgColumn, index: number, node: RowNode) => void {
        return (column) => {
            const nameForCol = this.extractHeaderValue(column);
            const styleIds: string[] = this.config.styleLinker({
                rowType: 'HEADER',
                rowIndex,
                value: nameForCol,
                column,
            });
            currentCells.push(
                this.createCell(this.getStyleId(styleIds), this.getDataTypeForValue('string'), nameForCol)
            );
        };
    }

    private onNewBodyColumn(
        rowIndex: number,
        currentCells: ExcelCell[]
    ): (column: AgColumn, index: number, node: RowNode) => void {
        let skipCols = 0;
        const { freezeColumns, rightToLeft } = this.config;
        return (column, index, node) => {
            if (skipCols > 0) {
                skipCols -= 1;
                return;
            }

            if (!this.skipFrozenColumns) {
                const pinned = column.getPinned();
                const isPinnedLeft = pinned === true || pinned === 'left';

                if (freezeColumns === 'pinned' && pinned && isPinnedLeft !== rightToLeft) {
                    this.frozenColumnCount++;
                } else if (
                    typeof freezeColumns === 'function' &&
                    freezeColumns({ ...this.gos.getGridCommonParams(), column })
                ) {
                    this.frozenColumnCount++;
                } else {
                    this.skipFrozenColumns = true;
                }
            }

            const { value: valueForCell, valueFormatted } = this.extractRowCellValue(
                column,
                index,
                rowIndex,
                'excel',
                node
            );
            const styleIds: string[] = this.config.styleLinker({
                rowType: 'BODY',
                rowIndex,
                value: valueForCell,
                column,
                node,
            });
            const excelStyleId: string | null = this.getStyleId(styleIds);
            const colSpan = column.getColSpan(node);
            const addedImage = this.addImage(rowIndex, column, valueForCell);

            if (addedImage) {
                currentCells.push(
                    this.createCell(
                        excelStyleId,
                        this.getDataTypeForValue(addedImage.value),
                        addedImage.value == null ? '' : addedImage.value
                    )
                );
            } else if (colSpan > 1) {
                skipCols = colSpan - 1;
                currentCells.push(
                    this.createMergedCell(
                        excelStyleId,
                        this.getDataTypeForValue(valueForCell),
                        valueForCell,
                        colSpan - 1
                    )
                );
            } else {
                currentCells.push(
                    this.createCell(excelStyleId, this.getDataTypeForValue(valueForCell), valueForCell, valueFormatted)
                );
            }
        };
    }

    private onNewRow(
        onNewColumnAccumulator: (
            rowIndex: number,
            currentCells: ExcelCell[]
        ) => (column: AgColumn, index: number, node: RowNode) => void,
        height?: number | ((params: RowHeightCallbackParams) => number)
    ): RowAccumulator {
        const currentCells: ExcelCell[] = [];
        this.rows.push({
            cells: currentCells,
            height: getHeightFromProperty(this.rows.length + 1, height),
        });
        return {
            onColumn: onNewColumnAccumulator.bind(this, this.rows.length, currentCells)(),
        };
    }

    private createExcel(data: ExcelWorksheet): string {
        const { excelStyles, config } = this;

        if (this.frozenColumnCount) {
            config.frozenColumnCount = this.frozenColumnCount;
        }

        if (this.frozenRowCount) {
            config.frozenRowCount = this.frozenRowCount;
        }

        return createXlsxExcel(excelStyles, data, config);
    }

    private getDataTypeForValue(valueForCell?: string): ExcelOOXMLDataType {
        if (valueForCell === undefined) {
            return 'empty';
        }
        return this.isNumerical(valueForCell) ? 'n' : 's';
    }

    private getTypeFromStyle(style: ExcelStyle | null, value: string | null): ExcelOOXMLDataType | null {
        if (this.isFormula(value)) {
            return 'f';
        }

        if (style && style.dataType) {
            switch (style.dataType.toLocaleLowerCase()) {
                case 'formula':
                    return 'f';
                case 'string':
                    return 's';
                case 'number':
                    return 'n';
                case 'datetime':
                    return 'd';
                case 'error':
                    return 'e';
                case 'boolean':
                    return 'b';
                default:
                    _warn(162, { id: style.id, dataType: style.dataType });
            }
        }

        return null;
    }

    private addImage(
        rowIndex: number,
        column: AgColumn,
        value: string
    ): { image: ExcelImage; value?: string } | undefined {
        if (!this.config.addImageToCell) {
            return;
        }

        const addedImage = this.config.addImageToCell(rowIndex, column, value);

        if (!addedImage) {
            return;
        }

        addXlsxBodyImageToMap(addedImage.image, rowIndex, column, this.columnsToExport, this.config.rowHeight);

        return addedImage;
    }

    private createCell(
        styleId: string | null | undefined,
        type: ExcelOOXMLDataType,
        value: string,
        valueFormatted?: string | null
    ): ExcelCell {
        const actualStyle: ExcelStyle | null = this.getStyleById(styleId);
        if (!actualStyle?.dataType && type === 's' && valueFormatted) {
            value = valueFormatted;
        }
        const processedType = this.getTypeFromStyle(actualStyle, value) || type;

        const { value: processedValue, escaped } = this.getCellValue(processedType, value);
        const styles: string[] = [];

        if (actualStyle) {
            styles.push(styleId!);
        }

        if (escaped) {
            styles.push('_quotePrefix');
        }

        styleId = this.getStyleId(styles) || undefined;

        return {
            styleId,
            data: {
                type: processedType,
                value: processedValue,
            },
        };
    }

    private createMergedCell(
        styleId: string | null,
        type: ExcelOOXMLDataType,
        value: string,
        numOfCells: number
    ): ExcelCell {
        const valueToUse = value == null ? '' : value;
        return {
            styleId: this.getStyleById(styleId) ? styleId! : undefined,
            data: {
                type: type,
                value: type === 's' ? getXlsxStringPosition(valueToUse).toString() : value,
            },
            mergeAcross: numOfCells,
        };
    }

    private getCellValue(type: ExcelOOXMLDataType, value: string | null): { value: string | null; escaped?: boolean } {
        let escaped = false;

        if (value == null || (type === 's' && value === '')) {
            return { value: '', escaped: false };
        }

        if (type === 's') {
            if (value && value[0] === "'") {
                escaped = true;
                value = value.slice(1);
            }

            value = getXlsxStringPosition(value).toString();
        } else if (type === 'f') {
            value = value.slice(1);
        } else if (type === 'n') {
            const numberValue = Number(value);

            if (isNaN(numberValue)) {
                value = '';
            } else if (value !== '') {
                value = numberValue.toString();
            }
        }

        return { value, escaped };
    }

    private getStyleId(styleIds?: string[] | null): string | null {
        if (!styleIds || !styleIds.length) {
            return null;
        }
        if (styleIds.length === 1) {
            return styleIds[0];
        }

        const key: string = styleIds.join('-');
        if (!this.mixedStyles[key]) {
            this.addNewMixedStyle(styleIds);
        }
        return this.mixedStyles[key].excelID;
    }

    private deepCloneObject<T>(object: T): T {
        return JSON.parse(JSON.stringify(object));
    }

    private addNewMixedStyle(styleIds: string[]): void {
        this.mixedStyleCounter += 1;
        const excelId = `mixedStyle${this.mixedStyleCounter}`;
        const resultantStyle: ExcelStyle = {} as ExcelStyle;

        for (const styleId of styleIds) {
            for (const excelStyle of this.excelStyles) {
                if (excelStyle.id === styleId) {
                    _mergeDeep(resultantStyle, this.deepCloneObject(excelStyle));
                }
            }
        }

        resultantStyle.id = excelId;
        const key: string = styleIds.join('-');
        this.mixedStyles[key] = {
            excelID: excelId,
            key: key,
            result: resultantStyle,
        };
        this.excelStyles.push(resultantStyle);
        this.stylesByIds[excelId] = resultantStyle;
    }

    private isFormula(value: string | null) {
        if (value == null) {
            return false;
        }
        return this.config.autoConvertFormulas && value.toString().startsWith('=');
    }

    private isNumerical(value: any): boolean {
        if (typeof value === 'bigint') {
            return true;
        }
        return isFinite(value) && value !== '' && !isNaN(parseFloat(value));
    }

    private getStyleById(styleId?: string | null): ExcelStyle | null {
        if (styleId == null) {
            return null;
        }
        return this.stylesByIds[styleId] || null;
    }
}
