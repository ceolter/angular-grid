import type {
    ExcelCell,
    ExcelColumn,
    ExcelFont,
    ExcelHeaderFooterConfig,
    ExcelHeaderFooterContent,
    ExcelOOXMLTemplate,
    ExcelRow,
    ExcelSheetMargin,
    ExcelSheetPageSetup,
    ExcelWorksheet,
    XmlElement,
} from 'ag-grid-community';
import { _escapeString } from 'ag-grid-community';

import type { ExcelDataTable, ExcelHeaderFooterPosition } from '../../assets/excelInterfaces';
import { getExcelColumnName } from '../../assets/excelUtils';
import type { ExcelGridSerializingParams } from '../../excelSerializingSession';
import {
    XLSX_WORKSHEET_DATA_TABLES,
    XLSX_WORKSHEET_HEADER_FOOTER_IMAGES,
    XLSX_WORKSHEET_IMAGES,
    addXlsxHeaderFooterImageToMap,
} from '../../excelXlsxFactory';
import colFactory from './column';
import mergeCellFactory from './mergeCell';
import rowFactory from './row';

const getMergedCellsAndAddColumnGroups = (
    rows: ExcelRow[],
    cols: ExcelColumn[],
    suppressColumnOutline: boolean
): string[] => {
    const mergedCells: string[] = [];
    const cellsWithCollapsibleGroups: number[][] = [];

    rows.forEach((currentRow, rowIdx) => {
        const cells = currentRow.cells;
        let merges = 0;
        let lastCol: ExcelColumn;

        cells.forEach((currentCell: ExcelCell, cellIdx: number) => {
            const min = cellIdx + merges + 1;
            const start = getExcelColumnName(min);
            const outputRow = rowIdx + 1;

            if (currentCell.mergeAcross) {
                merges += currentCell.mergeAcross;
                const end = getExcelColumnName(cellIdx + merges + 1);

                mergedCells.push(`${start}${outputRow}:${end}${outputRow}`);
            }

            if (!cols[min - 1]) {
                cols[min - 1] = {} as ExcelColumn;
            }

            const { collapsibleRanges } = currentCell;

            if (collapsibleRanges) {
                collapsibleRanges.forEach((range) => {
                    cellsWithCollapsibleGroups.push([min + range[0], min + range[1]]);
                });
            }

            lastCol = cols[min - 1];
            lastCol.min = min;
            lastCol.max = min;
            currentCell.ref = `${start}${outputRow}`;
        });
    });

    cellsWithCollapsibleGroups.sort((a, b) => {
        if (a[0] !== b[0]) {
            return a[0] - b[0];
        }
        return b[1] - a[1];
    });

    const rangeMap = new Map<string, boolean>();
    const outlineLevel = new Map<number, number>();

    cellsWithCollapsibleGroups
        .filter((currentRange) => {
            const rangeString = currentRange.toString();
            const inMap = rangeMap.get(rangeString);

            if (inMap) {
                return false;
            }
            rangeMap.set(rangeString, true);

            return true;
        })
        .forEach((range) => {
            const refCol = cols.find((col) => col.min == range[0] && col.max == range[1]);
            const currentOutlineLevel = outlineLevel.get(range[0]);
            cols.push({
                min: range[0],
                max: range[1],
                outlineLevel: suppressColumnOutline ? undefined : currentOutlineLevel || 1,
                width: (refCol || { width: 100 }).width,
            });

            outlineLevel.set(range[0], (currentOutlineLevel || 0) + 1);
        });

    return mergedCells;
};

const getPageOrientation = (orientation?: 'Portrait' | 'Landscape'): 'portrait' | 'landscape' => {
    if (!orientation || (orientation !== 'Portrait' && orientation !== 'Landscape')) {
        return 'portrait';
    }

    return orientation.toLocaleLowerCase() as 'portrait' | 'landscape';
};

const getPageSize = (pageSize?: string): number => {
    if (pageSize == null) {
        return 1;
    }

    const positions = [
        'Letter',
        'Letter Small',
        'Tabloid',
        'Ledger',
        'Legal',
        'Statement',
        'Executive',
        'A3',
        'A4',
        'A4 Small',
        'A5',
        'A6',
        'B4',
        'B5',
        'Folio',
        'Envelope',
        'Envelope DL',
        'Envelope C5',
        'Envelope B5',
        'Envelope C3',
        'Envelope C4',
        'Envelope C6',
        'Envelope Monarch',
        'Japanese Postcard',
        'Japanese Double Postcard',
    ];
    const pos = positions.indexOf(pageSize);

    return pos === -1 ? 1 : pos + 1;
};

const replaceHeaderFooterTokens = (value: string): string => {
    const map = {
        '&[Page]': '&P',
        '&[Pages]': '&N',
        '&[Date]': '&D',
        '&[Time]': '&T',
        '&[Tab]': '&A',
        '&[Path]': '&Z',
        '&[File]': '&F',
        '&[Picture]': '&G',
    };

    Object.entries(map).forEach(([key, val]) => {
        value = value.replace(key, val);
    });

    return value;
};

const getHeaderPosition = (position?: string): 'L' | 'C' | 'R' => {
    if (position === 'Center') {
        return 'C';
    }
    if (position === 'Right') {
        return 'R';
    }

    return 'L';
};

const applyHeaderFontStyle = (headerString: string, font?: ExcelFont): string => {
    if (!font) {
        return headerString;
    }

    headerString += '&amp;&quot;';
    headerString += font.fontName || 'Calibri';

    if (font.bold !== font.italic) {
        headerString += font.bold ? ',Bold' : ',Italic';
    } else if (font.bold) {
        headerString += ',Bold Italic';
    } else {
        headerString += ',Regular';
    }
    headerString += '&quot;';

    if (font.size) {
        headerString += `&amp;${font.size}`;
    }
    if (font.strikeThrough) {
        headerString += '&amp;S';
    }
    if (font.underline) {
        headerString += `&amp;${font.underline === 'Double' ? 'E' : 'U'}`;
    }
    if (font.color) {
        headerString += `&amp;K${font.color.replace('#', '').toUpperCase()}`;
    }

    return headerString;
};

const processHeaderFooterContent = (
    content: ExcelHeaderFooterContent[],
    location: 'H' | 'F',
    rule: 'EVEN' | 'FIRST' | ''
): string =>
    content.reduce((prev, curr, idx) => {
        const pos = getHeaderPosition(curr.position);
        const output = applyHeaderFontStyle(`${prev}&amp;${pos}`, curr.font);
        const PositionMap: ['Left', 'Center', 'Right'] = ['Left', 'Center', 'Right'];

        if (!curr.position) {
            curr.position = PositionMap[idx];
        }

        const { image } = curr;
        if (curr.value === '&[Picture]' && image) {
            const imagePosition: ExcelHeaderFooterPosition = `${pos}${location}${rule}`;
            addXlsxHeaderFooterImageToMap(image, imagePosition);
        }

        return `${output}${_escapeString(replaceHeaderFooterTokens(curr.value))}`;
    }, '');

const buildHeaderFooter = (headerFooterConfig: ExcelHeaderFooterConfig): XmlElement[] => {
    const rules: ['all', 'first', 'even'] = ['all', 'first', 'even'];
    const headersAndFooters = [] as XmlElement[];

    rules.forEach((rule) => {
        const headerFooter = headerFooterConfig[rule];
        const namePrefix = rule === 'all' ? 'odd' : rule;

        if (!headerFooter) {
            return;
        }

        for (const [key, value] of Object.entries<ExcelHeaderFooterContent[]>(headerFooter)) {
            const nameSuffix = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            const location: 'H' | 'F' = key[0].toUpperCase() as 'H' | 'F';

            if (value) {
                const normalizedRule: 'FIRST' | 'EVEN' | '' =
                    rule === 'all' ? '' : (rule.toUpperCase() as 'FIRST' | 'EVEN');
                headersAndFooters.push({
                    name: `${namePrefix}${nameSuffix}`,
                    properties: {
                        rawMap: { 'xml:space': 'preserve' },
                    },
                    textNode: processHeaderFooterContent(value, location, normalizedRule),
                });
            }
        }
    });

    return headersAndFooters;
};

const addColumns = (columns: ExcelColumn[]) => {
    return (params: ComposedWorksheetParams) => {
        if (columns.length) {
            params.children.push({
                name: 'cols',
                children: columns.map((column) => colFactory.getTemplate(column)),
            });
        }
        return params;
    };
};

const addSheetData = (rows: ExcelRow[], sheetNumber: number) => {
    return (params: ComposedWorksheetParams) => {
        if (rows.length) {
            params.children.push({
                name: 'sheetData',
                children: rows.map((row, idx) => rowFactory.getTemplate(row, idx, sheetNumber)),
            });
        }
        return params;
    };
};

const addMergeCells = (mergeCells: string[]) => {
    return (params: ComposedWorksheetParams) => {
        if (mergeCells.length) {
            params.children.push({
                name: 'mergeCells',
                properties: {
                    rawMap: {
                        count: mergeCells.length,
                    },
                },
                children: mergeCells.map((mergedCell) => mergeCellFactory.getTemplate(mergedCell)),
            });
        }
        return params;
    };
};

const addPageMargins = (margins: ExcelSheetMargin) => {
    return (params: ComposedWorksheetParams) => {
        const { top = 0.75, right = 0.7, bottom = 0.75, left = 0.7, header = 0.3, footer = 0.3 } = margins;

        params.children.push({
            name: 'pageMargins',
            properties: {
                rawMap: { bottom, footer, header, left, right, top },
            },
        });

        return params;
    };
};

const addPageSetup = (pageSetup?: ExcelSheetPageSetup) => {
    return (params: ComposedWorksheetParams) => {
        if (pageSetup) {
            params.children.push({
                name: 'pageSetup',
                properties: {
                    rawMap: {
                        horizontalDpi: 0,
                        verticalDpi: 0,
                        orientation: getPageOrientation(pageSetup.orientation),
                        paperSize: getPageSize(pageSetup.pageSize),
                    },
                },
            });
        }
        return params;
    };
};

const addHeaderFooter = (headerFooterConfig?: ExcelHeaderFooterConfig) => {
    return (params: ComposedWorksheetParams) => {
        if (!headerFooterConfig) {
            return params;
        }

        const differentFirst = headerFooterConfig.first != null ? 1 : 0;
        const differentOddEven = headerFooterConfig.even != null ? 1 : 0;

        params.children.push({
            name: 'headerFooter',
            properties: {
                rawMap: {
                    differentFirst,
                    differentOddEven,
                },
            },
            children: buildHeaderFooter(headerFooterConfig),
        });
        return params;
    };
};

const addExcelTableRel = (excelTable?: ExcelDataTable) => {
    return (params: ComposedWorksheetParams) => {
        if (excelTable) {
            params.children.push({
                name: 'tableParts',
                properties: {
                    rawMap: {
                        count: '1',
                    },
                },
                children: [
                    {
                        name: 'tablePart',
                        properties: {
                            rawMap: {
                                'r:id': `rId${++params.rIdCounter}`,
                            },
                        },
                    },
                ],
            });
        }

        return params;
    };
};

const addDrawingRel = (currentSheet: number) => {
    return (params: ComposedWorksheetParams) => {
        const worksheetImages = XLSX_WORKSHEET_IMAGES.get(currentSheet);
        if (worksheetImages?.length) {
            params.children.push({
                name: 'drawing',
                properties: {
                    rawMap: {
                        'r:id': `rId${++params.rIdCounter}`,
                    },
                },
            });
        }

        return params;
    };
};

const addVmlDrawingRel = (currentSheet: number) => {
    return (params: ComposedWorksheetParams) => {
        if (XLSX_WORKSHEET_HEADER_FOOTER_IMAGES.get(currentSheet)) {
            params.children.push({
                name: 'legacyDrawingHF',
                properties: {
                    rawMap: {
                        'r:id': `rId${++params.rIdCounter}`,
                    },
                },
            });
        }

        return params;
    };
};

const getPane = (xSplit: number = 0, ySplit: number = 0) => {
    const shouldSplit = xSplit > 0 || ySplit > 0;

    return shouldSplit
        ? [
              {
                  name: 'pane',
                  properties: {
                      rawMap: {
                          state: shouldSplit ? 'frozen' : undefined,
                          topLeftCell: shouldSplit ? `${getExcelColumnName(xSplit + 1)}${ySplit + 1}` : undefined,
                          xSplit: xSplit === 0 ? undefined : xSplit,
                          ySplit: ySplit === 0 ? undefined : ySplit,
                      },
                  },
              },
          ]
        : undefined;
};

const addSheetViews = (rtl: boolean = false, xSplit?: number, ySplit?: number) => {
    return (params: ComposedWorksheetParams) => {
        params.children.push({
            name: 'sheetViews',
            children: [
                {
                    name: 'sheetView',
                    properties: {
                        rawMap: {
                            rightToLeft: rtl === true ? '1' : '0',
                            workbookViewId: '0',
                        },
                    },
                    children: getPane(xSplit, ySplit),
                },
            ],
        });
        return params;
    };
};

const addSheetPr = () => {
    return (params: ComposedWorksheetParams) => {
        params.children.push({
            name: 'sheetPr',
            children: [
                {
                    name: 'outlinePr',
                    properties: {
                        rawMap: {
                            summaryBelow: 0,
                        },
                    },
                },
            ],
        });
        return params;
    };
};

const addSheetFormatPr = (rows: ExcelRow[]) => {
    return (params: ComposedWorksheetParams) => {
        const maxOutline = rows.reduce((prev: number, row: ExcelRow) => {
            if (row.outlineLevel && row.outlineLevel > prev) {
                return row.outlineLevel;
            }
            return prev;
        }, 0);

        params.children.push({
            name: 'sheetFormatPr',
            properties: {
                rawMap: {
                    baseColWidth: 10,
                    defaultRowHeight: 16,
                    outlineLevelRow: maxOutline ? maxOutline : undefined,
                },
            },
        });
        return params;
    };
};

interface ComposedWorksheetParams {
    children: XmlElement[];
    rIdCounter: number;
}

const worksheetFactory: ExcelOOXMLTemplate = {
    getTemplate(params: { worksheet: ExcelWorksheet; currentSheet: number; config: ExcelGridSerializingParams }) {
        const { worksheet, currentSheet, config } = params;
        const {
            margins = {},
            pageSetup,
            headerFooterConfig,
            suppressColumnOutline,
            rightToLeft,
            frozenRowCount,
            frozenColumnCount,
        } = config;

        const { table } = worksheet;
        const { rows, columns } = table;
        const mergedCells =
            columns && columns.length ? getMergedCellsAndAddColumnGroups(rows, columns, !!suppressColumnOutline) : [];

        const worksheetExcelTables = XLSX_WORKSHEET_DATA_TABLES.get(currentSheet);

        const { children } = [
            addSheetPr(),
            addSheetViews(rightToLeft, frozenColumnCount, frozenRowCount),
            addSheetFormatPr(rows),
            addColumns(columns),
            addSheetData(rows, currentSheet + 1),
            addMergeCells(mergedCells),
            addPageMargins(margins),
            addPageSetup(pageSetup),
            addHeaderFooter(headerFooterConfig),
            addDrawingRel(currentSheet),
            addVmlDrawingRel(currentSheet),
            addExcelTableRel(worksheetExcelTables),
        ].reduce((composed, f) => f(composed), { children: [], rIdCounter: 0 });

        return {
            name: 'worksheet',
            properties: {
                prefixedAttributes: [
                    {
                        prefix: 'xmlns:',
                        map: {
                            r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
                        },
                    },
                ],
                rawMap: {
                    xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
                },
            },
            children,
        };
    },
};

export default worksheetFactory;
