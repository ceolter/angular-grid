import { ExcelExportParams, ExcelFactoryMode, GridOptionsService, IExcelCreator, ExcelExportMultipleSheetParams, ExcelRow } from '@ag-grid-community/core';
import { ExcelXmlSerializingSession } from './excelXmlSerializingSession';
import { ExcelXlsxSerializingSession } from './excelXlsxSerializingSession';
import { BaseCreator } from "@ag-grid-community/csv-export";
declare type SerializingSession = ExcelXlsxSerializingSession | ExcelXmlSerializingSession;
export declare const getMultipleSheetsAsExcel: (params: ExcelExportMultipleSheetParams) => Blob | undefined;
export declare const exportMultipleSheetsAsExcel: (params: ExcelExportMultipleSheetParams) => void;
export declare class ExcelCreator extends BaseCreator<ExcelRow[], SerializingSession, ExcelExportParams> implements IExcelCreator {
    private columnModel;
    private valueService;
    private stylingService;
    private gridSerializer;
    gridOptionsService: GridOptionsService;
    private exportMode;
    postConstruct(): void;
    protected getMergedParams(params?: ExcelExportParams): ExcelExportParams;
    protected getData(params: ExcelExportParams): string;
    export(userParams?: ExcelExportParams): string;
    exportDataAsExcel(params?: ExcelExportParams): string;
    getDataAsExcel(params?: ExcelExportParams): Blob | string | undefined;
    setFactoryMode(factoryMode: ExcelFactoryMode, exportMode?: 'xml' | 'xlsx'): void;
    getFactoryMode(exportMode: 'xml' | 'xlsx'): ExcelFactoryMode;
    getSheetDataForExcel(params: ExcelExportParams): string;
    getMultipleSheetsAsExcel(params: ExcelExportMultipleSheetParams): Blob | undefined;
    exportMultipleSheetsAsExcel(params: ExcelExportMultipleSheetParams): void;
    getDefaultFileName(): string;
    getDefaultFileExtension(): string;
    createSerializingSession(params: ExcelExportParams): SerializingSession;
    private styleLinker;
    isExportSuppressed(): boolean;
    private setExportMode;
    private getExportMode;
    private packageFile;
}
export {};
