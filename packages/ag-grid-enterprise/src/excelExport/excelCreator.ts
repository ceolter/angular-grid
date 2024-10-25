import type {
    AgColumn,
    AgColumnGroup,
    BeanCollection,
    CellStyleService,
    ColumnModel,
    ColumnNameService,
    ExcelExportMultipleSheetParams,
    ExcelExportParams,
    ExcelFactoryMode,
    ExcelRow,
    ExcelStyle,
    FuncColsService,
    IExcelCreator,
    NamedBean,
    ValueService,
} from 'ag-grid-community';
import { BaseCreator, _downloadFile, _getHeaderClassesFromColDef, _warn } from 'ag-grid-community';

import type { ExcelGridSerializingParams, StyleLinkerInterface } from './excelSerializingSession';
import { ExcelSerializingSession } from './excelSerializingSession';
import {
    XLSX_IMAGES,
    XLSX_WORKSHEET_DATA_TABLES,
    XLSX_WORKSHEET_HEADER_FOOTER_IMAGES,
    XLSX_WORKSHEET_IMAGES,
    createXlsxContentTypes,
    createXlsxCore,
    createXlsxDrawing,
    createXlsxDrawingRel,
    createXlsxRelationships,
    createXlsxRels,
    createXlsxSharedStrings,
    createXlsxStylesheet,
    createXlsxTable,
    createXlsxTheme,
    createXlsxVmlDrawing,
    createXlsxVmlDrawingRel,
    createXlsxWorkbook,
    createXlsxWorkbookRels,
    getXlsxFactoryMode,
    resetXlsxFactory,
    setXlsxFactoryMode,
} from './excelXlsxFactory';
import { _normaliseImageExtension } from './files/ooxml/contentTypes';
import { ZipContainer } from './zipContainer/zipContainer';

const createExcelXMLCoreFolderStructure = (zipContainer: ZipContainer): void => {
    zipContainer.addFolders(['_rels/', 'docProps/', 'xl/', 'xl/theme/', 'xl/_rels/', 'xl/worksheets/']);

    if (!XLSX_IMAGES.size) {
        return;
    }

    zipContainer.addFolders(['xl/worksheets/_rels', 'xl/drawings/', 'xl/drawings/_rels', 'xl/media/']);

    let imgCounter = 0;

    XLSX_IMAGES.forEach((value) => {
        const firstImage = value[0].image[0];
        const { base64, imageType } = firstImage;

        zipContainer.addFile(`xl/media/image${++imgCounter}.${_normaliseImageExtension(imageType)}`, base64, true);
    });
};

const createExcelXmlWorksheets = (zipContainer: ZipContainer, data: string[]): void => {
    let imageRelationCounter = 0;
    let headerFooterImageCounter = 0;
    let tableRelationCounter = 0;

    for (let i = 0; i < data.length; i++) {
        const value = data[i];
        zipContainer.addFile(`xl/worksheets/sheet${i + 1}.xml`, value, false);

        const hasImages = XLSX_IMAGES.size > 0 && XLSX_WORKSHEET_IMAGES.has(i);
        const hasTables = XLSX_WORKSHEET_DATA_TABLES.size > 0 && XLSX_WORKSHEET_DATA_TABLES.has(i);
        const hasHeaderFooterImages = XLSX_IMAGES.size && XLSX_WORKSHEET_HEADER_FOOTER_IMAGES.has(i);

        if (!hasImages && !hasTables && !hasHeaderFooterImages) {
            continue;
        }

        let tableIndex: number | undefined;
        let drawingIndex: number | undefined;
        let vmlDrawingIndex: number | undefined;

        if (hasImages) {
            createExcelXmlDrawings(zipContainer, i, imageRelationCounter);
            drawingIndex = imageRelationCounter;
            imageRelationCounter++;
        }

        if (hasHeaderFooterImages) {
            createExcelVmlDrawings(zipContainer, i, headerFooterImageCounter);
            vmlDrawingIndex = headerFooterImageCounter;
            headerFooterImageCounter++;
        }

        if (hasTables) {
            tableIndex = tableRelationCounter++;
        }

        const worksheetRelFile = `xl/worksheets/_rels/sheet${i + 1}.xml.rels`;

        zipContainer.addFile(
            worksheetRelFile,
            createXlsxRelationships({
                tableIndex,
                drawingIndex,
                vmlDrawingIndex,
            })
        );
    }
};

const createExcelXmlDrawings = (zipContainer: ZipContainer, sheetIndex: number, drawingIndex: number): void => {
    const drawingFolder = 'xl/drawings';
    const drawingFileName = `${drawingFolder}/drawing${drawingIndex + 1}.xml`;
    const relFileName = `${drawingFolder}/_rels/drawing${drawingIndex + 1}.xml.rels`;

    zipContainer.addFile(relFileName, createXlsxDrawingRel(sheetIndex));
    zipContainer.addFile(drawingFileName, createXlsxDrawing(sheetIndex));
};

const createExcelVmlDrawings = (zipContainer: ZipContainer, sheetIndex: number, drawingIndex: number): void => {
    const drawingFolder = 'xl/drawings';
    const drawingFileName = `${drawingFolder}/vmlDrawing${drawingIndex + 1}.vml`;
    const relFileName = `${drawingFolder}/_rels/vmlDrawing${drawingIndex + 1}.vml.rels`;

    zipContainer.addFile(drawingFileName, createXlsxVmlDrawing(sheetIndex));
    zipContainer.addFile(relFileName, createXlsxVmlDrawingRel(sheetIndex));
};

const createExcelXmlTables = (zipContainer: ZipContainer): void => {
    const tablesDataByWorksheet = XLSX_WORKSHEET_DATA_TABLES;
    const worksheetKeys = Array.from(tablesDataByWorksheet.keys());

    for (let i = 0; i < worksheetKeys.length; i++) {
        const sheetIndex = worksheetKeys[i];
        const dataTable = tablesDataByWorksheet.get(sheetIndex);

        if (!dataTable) {
            continue;
        }

        zipContainer.addFile(`xl/tables/${dataTable.name}.xml`, createXlsxTable(dataTable, i));
    }
};

const createExcelXmlCoreSheets = (
    zipContainer: ZipContainer,
    fontSize: number,
    author: string,
    sheetLen: number,
    activeTab: number
): void => {
    zipContainer.addFile('xl/workbook.xml', createXlsxWorkbook(activeTab));
    zipContainer.addFile('xl/styles.xml', createXlsxStylesheet(fontSize));
    zipContainer.addFile('xl/sharedStrings.xml', createXlsxSharedStrings());
    zipContainer.addFile('xl/theme/theme1.xml', createXlsxTheme());
    zipContainer.addFile('xl/_rels/workbook.xml.rels', createXlsxWorkbookRels(sheetLen));
    zipContainer.addFile('docProps/core.xml', createXlsxCore(author));
    zipContainer.addFile('[Content_Types].xml', createXlsxContentTypes(sheetLen));
    zipContainer.addFile('_rels/.rels', createXlsxRels());
};

const createExcelFileForExcel = (
    zipContainer: ZipContainer,
    data: string[],
    options: {
        columns?: string[];
        rowCount?: number;
        fontSize?: number;
        author?: string;
        activeTab?: number;
    } = {}
): boolean => {
    if (!data || data.length === 0) {
        _warn(159);
        resetXlsxFactory();
        return false;
    }

    const { fontSize = 11, author = 'AG Grid', activeTab = 0 } = options;

    const len = data.length;
    const activeTabWithinBounds = Math.max(Math.min(activeTab, len - 1), 0);

    createExcelXMLCoreFolderStructure(zipContainer);
    createExcelXmlTables(zipContainer);
    createExcelXmlWorksheets(zipContainer, data);
    createExcelXmlCoreSheets(zipContainer, fontSize, author, len, activeTabWithinBounds);

    resetXlsxFactory();

    return true;
};

const getMultipleSheetsAsExcelCompressed = (params: ExcelExportMultipleSheetParams): Promise<Blob | undefined> => {
    const { data, fontSize, author, activeSheetIndex } = params;
    const mimeType = params.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const zipContainer = new ZipContainer();

    if (
        !createExcelFileForExcel(zipContainer, data, {
            author,
            fontSize,
            activeTab: activeSheetIndex,
        })
    ) {
        return Promise.resolve(undefined);
    }

    return zipContainer.getZipFile(mimeType);
};

export const getMultipleSheetsAsExcel = (params: ExcelExportMultipleSheetParams): Blob | undefined => {
    const { data, fontSize, author, activeSheetIndex } = params;
    const mimeType = params.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const zipContainer = new ZipContainer();

    if (
        !createExcelFileForExcel(zipContainer, data, {
            author,
            fontSize,
            activeTab: activeSheetIndex,
        })
    ) {
        return;
    }

    return zipContainer.getUncompressedZipFile(mimeType);
};

export const exportMultipleSheetsAsExcel = (params: ExcelExportMultipleSheetParams) => {
    const { fileName = 'export.xlsx' } = params;

    getMultipleSheetsAsExcelCompressed(params).then((contents) => {
        if (contents) {
            const downloadFileName = typeof fileName === 'function' ? fileName() : fileName;

            _downloadFile(downloadFileName, contents);
        }
    });
};

export class ExcelCreator
    extends BaseCreator<ExcelRow[], ExcelSerializingSession, ExcelExportParams>
    implements NamedBean, IExcelCreator
{
    beanName = 'excelCreator' as const;

    private colModel: ColumnModel;
    private colNames: ColumnNameService;
    private funcColsSvc: FuncColsService;
    private valueSvc: ValueService;
    private cellStyles?: CellStyleService;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.colNames = beans.colNames;
        this.funcColsSvc = beans.funcColsSvc;
        this.valueSvc = beans.valueSvc;
        this.cellStyles = beans.cellStyles;
    }

    protected getMergedParams(params?: ExcelExportParams): ExcelExportParams {
        const baseParams = this.gos.get('defaultExcelExportParams');
        return Object.assign({}, baseParams, params);
    }

    protected export(userParams?: ExcelExportParams): void {
        if (this.isExportSuppressed()) {
            _warn(160);
            return;
        }

        const mergedParams = this.getMergedParams(userParams);
        const data = this.getData(mergedParams);

        const exportParams: ExcelExportMultipleSheetParams = {
            data: [data],
            fontSize: mergedParams.fontSize,
            author: mergedParams.author,
            mimeType: mergedParams.mimeType,
        };

        this.packageCompressedFile(exportParams).then((packageFile) => {
            if (packageFile) {
                const { fileName } = mergedParams;
                const providedFileName =
                    typeof fileName === 'function' ? fileName(this.gos.getGridCommonParams()) : fileName;

                _downloadFile(this.getFileName(providedFileName), packageFile);
            }
        });
    }

    public exportDataAsExcel(params?: ExcelExportParams): void {
        this.export(params);
    }

    public getDataAsExcel(params?: ExcelExportParams): Blob | string | undefined {
        const mergedParams = this.getMergedParams(params);
        const data = this.getData(mergedParams);

        const exportParams: ExcelExportMultipleSheetParams = {
            data: [data],
            fontSize: mergedParams.fontSize,
            author: mergedParams.author,
            mimeType: mergedParams.mimeType,
        };

        return this.packageFile(exportParams);
    }

    public setFactoryMode(factoryMode: ExcelFactoryMode): void {
        setXlsxFactoryMode(factoryMode);
    }

    public getFactoryMode(): ExcelFactoryMode {
        return getXlsxFactoryMode();
    }

    public getSheetDataForExcel(params: ExcelExportParams): string {
        const mergedParams = this.getMergedParams(params);
        return this.getData(mergedParams);
    }

    public getMultipleSheetsAsExcel(params: ExcelExportMultipleSheetParams): Blob | undefined {
        return getMultipleSheetsAsExcel(params);
    }

    public exportMultipleSheetsAsExcel(params: ExcelExportMultipleSheetParams): void {
        exportMultipleSheetsAsExcel(params);
    }

    public getDefaultFileExtension(): 'xlsx' {
        return 'xlsx';
    }

    public createSerializingSession(params: ExcelExportParams): ExcelSerializingSession {
        const { colModel, colNames, funcColsSvc, valueSvc, gos } = this;

        const config: ExcelGridSerializingParams = {
            ...params,
            colModel,
            colNames,
            funcColsSvc,
            valueSvc,
            gos,
            suppressRowOutline: params.suppressRowOutline || params.skipRowGroups,
            headerRowHeight: params.headerRowHeight || params.rowHeight,
            baseExcelStyles: this.gos.get('excelStyles') || [],
            rightToLeft: params.rightToLeft ?? this.gos.get('enableRtl'),
            styleLinker: this.styleLinker.bind(this),
        };

        return new ExcelSerializingSession(config);
    }

    private styleLinker(params: StyleLinkerInterface): string[] {
        const { rowType, rowIndex, value, column, columnGroup, node } = params;
        const isHeader = rowType === 'HEADER';
        const isGroupHeader = rowType === 'HEADER_GROUPING';
        const col = (isHeader ? column : columnGroup) as AgColumn | AgColumnGroup | null;
        let headerClasses: string[] = [];

        if (isHeader || isGroupHeader) {
            headerClasses.push('header');
            if (isGroupHeader) {
                headerClasses.push('headerGroup');
            }

            if (col) {
                headerClasses = headerClasses.concat(
                    _getHeaderClassesFromColDef(
                        col.getDefinition(),
                        this.gos,
                        (column as AgColumn) || null,
                        (columnGroup as AgColumnGroup) || null
                    )
                );
            }

            return headerClasses;
        }

        const styles = this.gos.get('excelStyles');

        const applicableStyles: string[] = ['cell'];

        if (!styles || !styles.length) {
            return applicableStyles;
        }

        const styleIds: string[] = styles.map((it: ExcelStyle) => {
            return it.id;
        });

        const colDef = (column as AgColumn).getDefinition();
        this.cellStyles?.processAllCellClasses(
            colDef,
            this.gos.addGridCommonParams({
                value,
                data: node!.data,
                node: node!,
                colDef,
                column: column!,
                rowIndex: rowIndex,
            }),
            (className: string) => {
                if (styleIds.indexOf(className) > -1) {
                    applicableStyles.push(className);
                }
            }
        );

        return applicableStyles.sort((left: string, right: string): number => {
            return styleIds.indexOf(left) < styleIds.indexOf(right) ? -1 : 1;
        });
    }

    public isExportSuppressed(): boolean {
        return this.gos.get('suppressExcelExport');
    }

    private packageCompressedFile(params: ExcelExportMultipleSheetParams): Promise<Blob | undefined> {
        return getMultipleSheetsAsExcelCompressed(params);
    }

    private packageFile(params: ExcelExportMultipleSheetParams): Blob | undefined {
        return getMultipleSheetsAsExcel(params);
    }
}
