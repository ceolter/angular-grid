import type {
    AgColumn,
    ExcelFactoryMode,
    ExcelHeaderFooterImage,
    ExcelImage,
    ExcelRelationship,
    ExcelStyle,
    ExcelTableConfig,
    ExcelWorksheet,
    RowHeightCallbackParams,
} from 'ag-grid-community';
import { _escapeString, _getHeaderRowCount, _warn } from 'ag-grid-community';

import type {
    ExcelCalculatedImage,
    ExcelDataTable,
    ExcelHeaderFooterCalculatedImage,
    ExcelHeaderFooterPosition,
    ImageIdMap,
} from './assets/excelInterfaces';
import { createXmlPart, setExcelImageTotalHeight, setExcelImageTotalWidth } from './assets/excelUtils';
import type { ExcelGridSerializingParams } from './excelSerializingSession';
import contentTypesFactory, { _normaliseImageExtension } from './files/ooxml/contentTypes';
import coreFactory from './files/ooxml/core';
import drawingFactory from './files/ooxml/drawing';
import relationshipsFactory from './files/ooxml/relationships';
import sharedStringsFactory from './files/ooxml/sharedStrings';
import stylesheetFactory, { registerStyles } from './files/ooxml/styles/stylesheet';
import tableFactory from './files/ooxml/table';
import officeThemeFactory from './files/ooxml/themes/office';
import vmlDrawingFactory from './files/ooxml/vmlDrawing';
import workbookFactory from './files/ooxml/workbook';
import worksheetFactory from './files/ooxml/worksheet';

/*
 * See links for more info on the Office Open XML format being used:
 * https://www.ecma-international.org/wp-content/uploads/Office-Open-XML-White-Paper.pdf
 * https://ecma-international.org/publications-and-standards/standards/ecma-376/
 */

const XLSX_SHARED_STRINGS: Map<string, number> = new Map();
let XLSX_SHEET_NAMES: string[] = [];

/** Maps images to sheet */
export const XLSX_IMAGES: Map<
    string,
    { sheetId: number; image: (ExcelCalculatedImage | ExcelHeaderFooterCalculatedImage)[] }[]
> = new Map();
/** Maps sheets to images */
export const XLSX_WORKSHEET_IMAGES: Map<number, ExcelCalculatedImage[]> = new Map();
/** Maps sheets to header/footer images */
export const XLSX_WORKSHEET_HEADER_FOOTER_IMAGES: Map<number, ExcelHeaderFooterCalculatedImage[]> = new Map();
/** Maps all workbook images to a global Id */
export const XLSX_WORKBOOK_IMAGE_IDS: ImageIdMap = new Map();
/** Maps all sheet images to unique Ids */
export const XLSX_WORKSHEET_IMAGE_IDS: Map<number, ImageIdMap> = new Map();
/** Maps all sheet tables to unique Ids */
export const XLSX_WORKSHEET_DATA_TABLES: Map<number, ExcelDataTable> = new Map();
/** Default name to be used for tables when no name is provided */
export const DEFAULT_TABLE_DISPLAY_NAME = 'AG-GRID-TABLE';

let XLSX_FACTORY_MODE: ExcelFactoryMode = 'SINGLE_SHEET';

export function getXlsxFactoryMode(): ExcelFactoryMode {
    return XLSX_FACTORY_MODE;
}

export function setXlsxFactoryMode(factoryMode: ExcelFactoryMode): void {
    XLSX_FACTORY_MODE = factoryMode;
}

export function createXlsxExcel(
    styles: ExcelStyle[],
    worksheet: ExcelWorksheet,
    config: ExcelGridSerializingParams
): string {
    addSheetName(worksheet);
    registerStyles(styles, XLSX_SHEET_NAMES.length);

    const newConfig = Object.assign({}, config);

    // Table export is not compatible with pivot mode nor master/detail features
    if (config.exportAsExcelTable) {
        if (config.colModel.isPivotActive()) {
            showExcelTableNonCompatibleFeaturesWarning('pivot mode');
            newConfig.exportAsExcelTable = false;
        }

        if (config.gos.get('masterDetail')) {
            showExcelTableNonCompatibleFeaturesWarning('master/detail');
            newConfig.exportAsExcelTable = false;
        }
    }

    processTableConfig(worksheet, newConfig);
    return createWorksheet(worksheet, newConfig);
}

export function showExcelTableNonCompatibleFeaturesWarning(featureName: string) {
    _warn(163, { featureName });
}

export function getXlsxTableNameFromIndex(idx: number) {
    return `table${idx + 1}`;
}

export function getXlsxSanitizedTableName(name: string) {
    return name
        .replace(/^[^a-zA-Z_]+/, '_')
        .replace(/\s/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '_');
}

export function addXlsxTableToSheet(sheetIndex: number, table: ExcelDataTable): void {
    if (XLSX_WORKSHEET_DATA_TABLES.has(sheetIndex)) {
        _warn(164);
        return;
    }

    XLSX_WORKSHEET_DATA_TABLES.set(sheetIndex, table);
}

function processTableConfig(worksheet: ExcelWorksheet, config: ExcelGridSerializingParams) {
    if (!config.exportAsExcelTable) {
        return;
    }

    const tableConfig: Partial<ExcelTableConfig> =
        typeof config.exportAsExcelTable === 'boolean' ? {} : config.exportAsExcelTable;

    const {
        name: nameFromConfig,
        showColumnStripes,
        showRowStripes,
        showFilterButton,
        highlightFirstColumn,
        highlightLastColumn,
    } = tableConfig;

    const tableName = getXlsxSanitizedTableName(nameFromConfig || DEFAULT_TABLE_DISPLAY_NAME);

    const sheetIndex = XLSX_SHEET_NAMES.length - 1;
    const { table } = worksheet;
    const { rows, columns } = table;
    const headerRowCount = _getHeaderRowCount(config.colModel);
    const tableHeaderRowIndex: number = headerRowCount - 1; // Assuming that header starts at row 0
    const tableRowCount = rows.length;
    const tableColCount = columns.length;

    const tableColumns: string[] = [];
    const showFilterButtons: boolean[] = [];

    for (let i = 0; i < tableColCount; i++) {
        const col = columns[i];
        tableColumns.push(col.displayName || '');
        showFilterButtons.push(
            showFilterButton === 'match' || showFilterButton === undefined
                ? col.filterAllowed ?? false // We fall back to the column's filterAllowed property on match
                : showFilterButton
        );
    }

    if (!tableColumns || !tableColumns.length || !tableRowCount || !tableName) {
        _warn(165);
        return;
    }

    addXlsxTableToSheet(sheetIndex, {
        name: getXlsxTableNameFromIndex(sheetIndex),
        displayName: tableName,
        columns: tableColumns,
        showFilterButtons: showFilterButtons,
        headerRowIndex: tableHeaderRowIndex,
        rowCount: tableRowCount - headerRowCount,
        showRowStripes: showRowStripes ?? true,
        showColumnStripes: showColumnStripes ?? false,
        highlightFirstColumn: highlightFirstColumn ?? false,
        highlightLastColumn: highlightLastColumn ?? false,
    });
}

export function addXlsxHeaderFooterImageToMap(
    image: ExcelHeaderFooterImage,
    position: ExcelHeaderFooterPosition
): void {
    const sheetIndex = XLSX_SHEET_NAMES.length - 1;
    const headerFooterImage = image as ExcelHeaderFooterCalculatedImage;

    headerFooterImage.headerFooterPosition = position;

    buildImageMap({ imageToAdd: headerFooterImage, idx: sheetIndex });

    let headerFooterImagesForSheet = XLSX_WORKSHEET_HEADER_FOOTER_IMAGES.get(sheetIndex);

    if (!headerFooterImagesForSheet) {
        headerFooterImagesForSheet = [];
        XLSX_WORKSHEET_HEADER_FOOTER_IMAGES.set(sheetIndex, headerFooterImagesForSheet);
    }

    if (!headerFooterImagesForSheet.find((img) => img.id === image.id)) {
        headerFooterImagesForSheet.push(image as ExcelHeaderFooterCalculatedImage);
    }
}

export function addXlsxBodyImageToMap(
    image: ExcelImage,
    rowIndex: number,
    col: AgColumn,
    columnsToExport?: AgColumn[],
    rowHeight?: number | ((params: RowHeightCallbackParams) => number)
): void {
    const sheetIndex = XLSX_SHEET_NAMES.length;
    const { row, column } = image.position || {};
    const calculatedImage = image as ExcelCalculatedImage;

    if (columnsToExport) {
        if (rowIndex != null && col != null && (!row || !column)) {
            if (!image.position) {
                image.position = {};
            }

            image.position = Object.assign({}, image.position, {
                row: rowIndex,
                column: columnsToExport.indexOf(col) + 1,
            });
        }
        setExcelImageTotalWidth(calculatedImage, columnsToExport);
        setExcelImageTotalHeight(calculatedImage, rowHeight);
    }

    buildImageMap({ imageToAdd: calculatedImage, idx: sheetIndex });

    let worksheetImageIdMap = XLSX_WORKSHEET_IMAGE_IDS.get(sheetIndex);

    if (!worksheetImageIdMap) {
        worksheetImageIdMap = new Map();
        XLSX_WORKSHEET_IMAGE_IDS.set(sheetIndex, worksheetImageIdMap);
    }

    const sheetImages = XLSX_WORKSHEET_IMAGES.get(sheetIndex);

    if (!sheetImages) {
        XLSX_WORKSHEET_IMAGES.set(sheetIndex, [calculatedImage]);
    } else {
        sheetImages.push(calculatedImage);
    }

    if (!worksheetImageIdMap.get(image.id)) {
        worksheetImageIdMap.set(image.id, { index: worksheetImageIdMap.size, type: image.imageType });
    }
}

function buildImageMap(params: {
    imageToAdd: ExcelCalculatedImage | ExcelHeaderFooterCalculatedImage;
    idx: number;
}): void {
    const { imageToAdd, idx } = params;
    const mappedImagesToSheet = XLSX_IMAGES.get(imageToAdd.id);

    if (mappedImagesToSheet) {
        const currentSheetImages = mappedImagesToSheet.find((currentImage) => currentImage.sheetId === idx);
        if (currentSheetImages) {
            currentSheetImages.image.push(imageToAdd);
        } else {
            mappedImagesToSheet.push({
                sheetId: idx,
                image: [imageToAdd],
            });
        }
    } else {
        XLSX_IMAGES.set(imageToAdd.id, [{ sheetId: idx, image: [imageToAdd] }]);
        XLSX_WORKBOOK_IMAGE_IDS.set(imageToAdd.id, {
            type: imageToAdd.imageType,
            index: XLSX_WORKBOOK_IMAGE_IDS.size,
        });
    }
}

function addSheetName(worksheet: ExcelWorksheet): void {
    const name = _escapeString(worksheet.name) || '';
    let append = '';

    while (XLSX_SHEET_NAMES.indexOf(`${name}${append}`) !== -1) {
        if (append === '') {
            append = '_1';
        } else {
            const curr = parseInt(append.slice(1), 10);
            append = `_${curr + 1}`;
        }
    }

    worksheet.name = `${name}${append}`;
    XLSX_SHEET_NAMES.push(worksheet.name);
}

export function getXlsxStringPosition(str: string): number {
    if (XLSX_SHARED_STRINGS.has(str)) {
        return XLSX_SHARED_STRINGS.get(str)!;
    }

    XLSX_SHARED_STRINGS.set(str, XLSX_SHARED_STRINGS.size);
    return XLSX_SHARED_STRINGS.size - 1;
}

export function resetXlsxFactory(): void {
    XLSX_SHARED_STRINGS.clear();

    XLSX_IMAGES.clear();
    XLSX_WORKSHEET_IMAGES.clear();
    XLSX_WORKSHEET_HEADER_FOOTER_IMAGES.clear();

    XLSX_WORKBOOK_IMAGE_IDS.clear();
    XLSX_WORKSHEET_IMAGE_IDS.clear();
    XLSX_WORKSHEET_DATA_TABLES.clear();

    XLSX_SHEET_NAMES = [];
    XLSX_FACTORY_MODE = 'SINGLE_SHEET';
}

export function createXlsxWorkbook(currentSheet: number): string {
    return createXmlPart(workbookFactory.getTemplate(XLSX_SHEET_NAMES, currentSheet));
}

export function createXlsxStylesheet(defaultFontSize: number): string {
    return createXmlPart(stylesheetFactory.getTemplate(defaultFontSize));
}

export function createXlsxSharedStrings(): string {
    return createXmlPart(sharedStringsFactory.getTemplate(XLSX_SHARED_STRINGS));
}

export function createXlsxCore(author: string): string {
    return createXmlPart(coreFactory.getTemplate(author));
}

export function createXlsxContentTypes(sheetLen: number): string {
    return createXmlPart(contentTypesFactory.getTemplate(sheetLen));
}

export function createXlsxRels(): string {
    const rs = relationshipsFactory.getTemplate([
        {
            Id: 'rId1',
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
            Target: 'xl/workbook.xml',
        },
        {
            Id: 'rId2',
            Type: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
            Target: 'docProps/core.xml',
        },
    ]);

    return createXmlPart(rs);
}

export function createXlsxTheme(): string {
    return createXmlPart(officeThemeFactory.getTemplate());
}

export function createXlsxTable(dataTable: ExcelDataTable, index?: number): string {
    return createXmlPart(tableFactory.getTemplate(dataTable, index));
}

export function createXlsxWorkbookRels(sheetLen: number): string {
    const worksheets = new Array(sheetLen).fill(undefined).map((v, i) => ({
        Id: `rId${i + 1}`,
        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
        Target: `worksheets/sheet${i + 1}.xml`,
    }));

    const rs = relationshipsFactory.getTemplate([
        ...worksheets,
        {
            Id: `rId${sheetLen + 1}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
            Target: 'theme/theme1.xml',
        },
        {
            Id: `rId${sheetLen + 2}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
            Target: 'styles.xml',
        },
        {
            Id: `rId${sheetLen + 3}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings',
            Target: 'sharedStrings.xml',
        },
    ]);

    return createXmlPart(rs);
}

export function createXlsxDrawing(sheetIndex: number) {
    return createXmlPart(drawingFactory.getTemplate({ sheetIndex }));
}

export function createXlsxDrawingRel(sheetIndex: number) {
    const worksheetImageIds = XLSX_WORKSHEET_IMAGE_IDS.get(sheetIndex) || [];
    const XMLArr: ExcelRelationship[] = [];

    for (const [key, value] of worksheetImageIds) {
        const { index, type } = value;

        XMLArr.push({
            Id: `rId${index + 1}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            Target: `../media/image${XLSX_WORKBOOK_IMAGE_IDS.get(key)!.index + 1}.${_normaliseImageExtension(type)}`,
        });
    }

    return createXmlPart(relationshipsFactory.getTemplate(XMLArr));
}

export function createXlsxVmlDrawing(sheetIndex: number) {
    return createXmlPart(vmlDrawingFactory.getTemplate({ sheetIndex }), true);
}

export function createXlsxVmlDrawingRel(sheetIndex: number) {
    const worksheetHeaderFooterImages = XLSX_WORKSHEET_HEADER_FOOTER_IMAGES.get(sheetIndex) || [];
    const XMLArr: ExcelRelationship[] = [];

    for (let i = 0; i < worksheetHeaderFooterImages.length; i++) {
        const headerFooterImage = worksheetHeaderFooterImages[i];
        const workbookImage = XLSX_WORKBOOK_IMAGE_IDS.get(headerFooterImage.id);

        if (!workbookImage) {
            continue;
        }

        const { index, type } = workbookImage;

        XMLArr.push({
            Id: `rId${i + 1}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            Target: `../media/image${index + 1}.${_normaliseImageExtension(type)}`,
        });
    }

    return createXmlPart(relationshipsFactory.getTemplate(XMLArr));
}

export function createXlsxRelationships({
    drawingIndex,
    vmlDrawingIndex,
    tableIndex,
}: {
    drawingIndex?: number;
    vmlDrawingIndex?: number;
    tableIndex?: number;
} = {}) {
    if (drawingIndex === undefined && vmlDrawingIndex === undefined && tableIndex === undefined) {
        return '';
    }

    const config = [];
    if (drawingIndex != null) {
        config.push({
            Id: `rId${config.length + 1}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing',
            Target: `../drawings/drawing${drawingIndex + 1}.xml`,
        });
    }

    if (vmlDrawingIndex != null) {
        config.push({
            Id: `rId${config.length + 1}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing',
            Target: `../drawings/vmlDrawing${vmlDrawingIndex + 1}.vml`,
        });
    }

    if (tableIndex != null) {
        config.push({
            Id: `rId${config.length + 1}`,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/table',
            Target: `../tables/${getXlsxTableNameFromIndex(tableIndex)}.xml`,
        });
    }

    const rs = relationshipsFactory.getTemplate(config);
    return createXmlPart(rs);
}

function createWorksheet(worksheet: ExcelWorksheet, config: ExcelGridSerializingParams): string {
    return createXmlPart(
        worksheetFactory.getTemplate({
            worksheet,
            currentSheet: XLSX_SHEET_NAMES.length - 1,
            config,
        })
    );
}
