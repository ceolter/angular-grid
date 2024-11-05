import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { RowNode } from '../entities/rowNode';
import { BaseGridSerializingSession } from '../export/baseGridSerializingSession';
import type { GridSerializingParams, RowAccumulator, RowSpanningAccumulator } from '../export/iGridSerializer';
import type { CsvCustomContent } from '../interfaces/exportParams';
import { _warn } from '../validation/logging';

const LINE_SEPARATOR = '\r\n';

interface CsvSerializingParams extends GridSerializingParams {
    suppressQuotes: boolean;
    columnSeparator: string;
}

export class CsvSerializingSession extends BaseGridSerializingSession<CsvCustomContent> {
    private isFirstLine = true;
    private result: string = '';
    private suppressQuotes: boolean;
    private columnSeparator: string;

    constructor(config: CsvSerializingParams) {
        super(config);

        const { suppressQuotes, columnSeparator } = config;

        this.suppressQuotes = suppressQuotes;
        this.columnSeparator = columnSeparator;
    }

    public addCustomContent(content: CsvCustomContent) {
        if (!content) {
            return;
        }
        if (typeof content === 'string') {
            if (!/^\s*\n/.test(content)) {
                this.beginNewLine();
            }
            // replace whatever newlines are supplied with the style we're using
            content = content.replace(/\r?\n/g, LINE_SEPARATOR);
            this.result += content;
        } else {
            content.forEach((row) => {
                this.beginNewLine();
                row.forEach((cell, index) => {
                    if (index !== 0) {
                        this.result += this.columnSeparator;
                    }
                    this.result += this.putInQuotes(cell.data.value || '');
                    if (cell.mergeAcross) {
                        this.appendEmptyCells(cell.mergeAcross);
                    }
                });
            });
        }
    }

    public onNewHeaderGroupingRow(): RowSpanningAccumulator {
        this.beginNewLine();

        return {
            onColumn: this.onNewHeaderGroupingRowColumn.bind(this),
        };
    }

    private onNewHeaderGroupingRowColumn(columnGroup: AgColumnGroup, header: string, index: number, span: number) {
        if (index != 0) {
            this.result += this.columnSeparator;
        }

        this.result += this.putInQuotes(header);

        this.appendEmptyCells(span);
    }

    private appendEmptyCells(count: number) {
        for (let i = 1; i <= count; i++) {
            this.result += this.columnSeparator + this.putInQuotes('');
        }
    }

    public onNewHeaderRow(): RowAccumulator {
        this.beginNewLine();

        return {
            onColumn: this.onNewHeaderRowColumn.bind(this),
        };
    }

    private onNewHeaderRowColumn(column: AgColumn, index: number): void {
        if (index != 0) {
            this.result += this.columnSeparator;
        }
        this.result += this.putInQuotes(this.extractHeaderValue(column));
    }

    public onNewBodyRow(): RowAccumulator {
        this.beginNewLine();

        return {
            onColumn: this.onNewBodyRowColumn.bind(this),
        };
    }

    private onNewBodyRowColumn(column: AgColumn, index: number, node: RowNode): void {
        if (index != 0) {
            this.result += this.columnSeparator;
        }
        const rowCellValue = this.extractRowCellValue(column, index, index, 'csv', node);
        this.result += this.putInQuotes(rowCellValue.valueFormatted ?? rowCellValue.value);
    }

    private putInQuotes(value: any): string {
        if (this.suppressQuotes) {
            return value;
        }

        if (value === null || value === undefined) {
            return '""';
        }

        let stringValue: string;
        if (typeof value === 'string') {
            stringValue = value;
        } else if (typeof value.toString === 'function') {
            stringValue = value.toString();
        } else {
            _warn(53);
            stringValue = '';
        }

        // replace each " with "" (ie two sets of double quotes is how to do double quotes in csv)
        const valueEscaped = stringValue.replace(/"/g, '""');

        return '"' + valueEscaped + '"';
    }

    public parse(): string {
        return this.result;
    }

    private beginNewLine() {
        if (!this.isFirstLine) {
            this.result += LINE_SEPARATOR;
        }
        this.isFirstLine = false;
    }
}
