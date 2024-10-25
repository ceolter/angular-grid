import type { ColumnModel } from '../columns/columnModel';
import type { ColumnNameService } from '../columns/columnNameService';
import type { FuncColsService } from '../columns/funcColsService';
import type { NamedBean } from '../context/bean';
import type { BeanCollection } from '../context/context';
import type { CsvCustomContent, CsvExportParams } from '../interfaces/exportParams';
import type { ICsvCreator } from '../interfaces/iCsvCreator';
import { _warn } from '../validation/logging';
import type { ValueService } from '../valueService/valueService';
import { BaseCreator } from './baseCreator';
import { _downloadFile } from './downloader';
import { CsvSerializingSession } from './sessions/csvSerializingSession';

export class CsvCreator
    extends BaseCreator<CsvCustomContent, CsvSerializingSession, CsvExportParams>
    implements NamedBean, ICsvCreator
{
    beanName = 'csvCreator' as const;

    private columnModel: ColumnModel;
    private columnNameService: ColumnNameService;
    private funcColsService: FuncColsService;
    private valueService: ValueService;

    public wireBeans(beans: BeanCollection): void {
        this.columnModel = beans.columnModel;
        this.columnNameService = beans.columnNameService;
        this.funcColsService = beans.funcColsService;
        this.valueService = beans.valueService;
    }

    protected getMergedParams(params?: CsvExportParams): CsvExportParams {
        const baseParams = this.gos.get('defaultCsvExportParams');
        return Object.assign({}, baseParams, params);
    }

    protected export(userParams?: CsvExportParams): void {
        if (this.isExportSuppressed()) {
            // Export cancelled.
            _warn(51);
            return;
        }

        const mergedParams = this.getMergedParams(userParams);
        const data = this.getData(mergedParams);

        const packagedFile = new Blob(['\ufeff', data], { type: 'text/plain' });

        const fileName =
            typeof mergedParams.fileName === 'function'
                ? mergedParams.fileName(this.gos.getGridCommonParams())
                : mergedParams.fileName;

        _downloadFile(this.getFileName(fileName), packagedFile);
    }

    public exportDataAsCsv(params?: CsvExportParams): void {
        this.export(params);
    }

    public getDataAsCsv(params?: CsvExportParams, skipDefaultParams = false): string {
        const mergedParams = skipDefaultParams ? Object.assign({}, params) : this.getMergedParams(params);

        return this.getData(mergedParams);
    }

    public getDefaultFileExtension(): string {
        return 'csv';
    }

    public createSerializingSession(params?: CsvExportParams): CsvSerializingSession {
        const { columnModel, columnNameService, funcColsService, valueService, gos } = this;
        const {
            processCellCallback,
            processHeaderCallback,
            processGroupHeaderCallback,
            processRowGroupCallback,
            suppressQuotes,
            columnSeparator,
        } = params!;

        return new CsvSerializingSession({
            columnModel,
            columnNameService,
            funcColsService,
            valueService,
            gos,
            processCellCallback: processCellCallback || undefined,
            processHeaderCallback: processHeaderCallback || undefined,
            processGroupHeaderCallback: processGroupHeaderCallback || undefined,
            processRowGroupCallback: processRowGroupCallback || undefined,
            suppressQuotes: suppressQuotes || false,
            columnSeparator: columnSeparator || ',',
        });
    }

    public isExportSuppressed(): boolean {
        return this.gos.get('suppressCsvExport');
    }
}
