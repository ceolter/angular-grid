/**
 * These are used to create links from types to relevant documentation.
 */
const TYPE_LINKS = {
    AgChartTheme: '/integrated-charts-customisation/#custom-chart-themes',
    AgChartThemeName: '/integrated-charts-customisation/#provided-themes',
    AgChartThemeDefinition: 'https://charts.ag-grid.com/themes-api',
    AgChartThemeOverrides: 'https://charts.ag-grid.com/themes-api/#reference-AgChartTheme-overrides',
    AgChartThemePalette: 'https://charts.ag-grid.com/themes-api/#reference-AgChartTheme-palette',
    AgCartesianChartOptions: '/integrated-charts-customisation/#overriding-themes',
    AgCartesianAxesTheme: '/integrated-charts-customisation/#overriding-themes',
    AgCartesianSeriesTheme: '/integrated-charts-customisation/#overriding-themes',
    AgBarSeriesOptions: '/integrated-charts-customisation/#bar-overrides',
    AgLineSeriesOptions: '/integrated-charts-customisation/#line-overrides',
    AgAreaSeriesOptions: '/integrated-charts-customisation/#area-overrides',
    AgScatterSeriesOptions: '/integrated-charts-customisation/#scatter-overrides',
    AgHistogramSeriesOptions: '/integrated-charts-customisation/#histogram-overrides',
    AgPolarChartOptions: '/integrated-charts-customisation/#overriding-themes',
    AgPolarAxesTheme: '/integrated-charts-customisation/#overriding-themes',
    AgPolarSeriesTheme: '/integrated-charts-customisation/#overriding-themes',
    AgPieSeriesOptions: '/integrated-charts-customisation/#pie-overrides',
    Blob: 'https://developer.mozilla.org/en-US/docs/Web/API/Blob',
    CellPosition: '/keyboard-navigation/#cellposition',
    CellRange: '/range-selection/#range-selection-api',
    ICellRendererParams: 'component-cell-renderer/#complementing-cell-renderer-params',
    ICellEditorParams: '/component-cell-editor/#reference-ICellEditorParams',
    ChartModel: '/integrated-charts-api-save-restore-charts/#api-reference',
    ColDef: '/column-properties/',
    ColGroupDef: '/column-properties/',
    AbstractColDef: '/column-properties/',
    Column: '/column-object/',
    ColumnEventType: '/column-object/#reference-events',
    ColumnApi: '/column-api/',
    CreatePivotChartParams: '/integrated-charts-api-pivot-chart/#pivot-chart-api',
    CreateRangeChartParams: '/integrated-charts-api-range-chart/#range-chart-api',
    GetChartImageDataUrlParams: '/integrated-charts-api-downloading-image',
    CsvExportParams: '/csv-export/#csvexportparams',
    Document: 'https://developer.mozilla.org/en-US/docs/Web/API/Document',
    ExcelAlignment: '/excel-export-api/#excelalignment',
    ExcelBorder: '/excel-export-api/#excelborder',
    ExcelBorders: '/excel-export-api/#excelborders',
    ExcelCell: '/excel-export-api/#excelcell',
    ExcelData: '/excel-export-api/#exceldata',
    ExcelDataType: '/excel-export-api/#exceldatatype',
    ExcelOOXMLDataType: '/excel-export-api/#excelooxmldatatype',
    ExcelExportParams: '/excel-export-api/#excelexportparams',
    ExcelExportMultipleSheetParams: '/excel-export-api/#excelexportmultiplesheetparams',
    ExcelFont: '/excel-export-api/#excelfont',
    ExcelHeaderFooter: '/excel-export-api/#excelheaderfooter',
    ExcelImage: '/excel-export-api/#excelimage',
    ExcelImagePosition: '/excel-export-api/#excelimageposition',
    ExcelInterior: '/excel-export-api/#excelinterior',
    ExcelNumberFormat: '/excel-export-api/#excelnumberformat',
    ExcelProtection: '/excel-export-api/#excelprotection',
    ExcelStyle: '/excel-export-api/#excelstyle',
    ExcelSheetConfig: '/excel-export-api/#excelsheetconfig',
    ExcelSheetPageSetup: '/excel-export-api/#excelsheetpagesetup',
    ExcelSheetMargin: '/excel-export-api/#excelsheetmargin',
    GridApi: '/grid-api/',
    GridOptions: '/grid-options/',
    HeaderPosition: '/keyboard-navigation/#headerposition',
    HTMLElement: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement',
    IAggFunc: '/aggregation-custom-functions/#custom-aggregation-functions',
    IDatasource: '/infinite-scrolling/#datasource-interface',
    IFilterDef: '/filtering/',
    IFilterComp: '/component-filter/',
    IFloatingFilterComp: '/component-floating-filter/',
    IServerSideDatasource: '/server-side-model-datasource/#registering-the-datasource',
    IViewportDatasource: '/viewport/#interface-iviewportdatasource',
    IComponent: '/components',
    KeyboardEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent',
    MouseEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent',
    RowNode: '/row-object/',
    IRowNode: '/row-object/',
    ServerSideTransaction: '/server-side-model-transactions/#transaction-api',
    Touch: 'https://developer.mozilla.org/en-US/docs/Web/API/Touch',
};

export function getTypeLink(type) {
    if (typeof (type) === 'string') {
        // handle removal of generics.
        const cleanType = type?.split('<')[0];
        return TYPE_LINKS[cleanType];
    }
    return undefined;
}