import { BASE_URL } from '../../baseUrl';
import type { UserComponentName } from '../../context/context';
import type { Column } from '../../interfaces/iColumn';
import type { ModuleName } from '../../interfaces/iModule';
import type { RowNodeEventType } from '../../interfaces/iRowNode';
import { _fuzzySuggestions } from '../../utils/fuzzyMatch';
import { getErrorLink } from '../logging';

const missingModule = ({
    reason,
    moduleName,
    gridScoped,
    gridId,
    isEnterprise,
}: {
    reason: string;
    moduleName: ModuleName;
    gridScoped: boolean;
    gridId: string;
    isEnterprise?: boolean;
}) =>
    `Unable to use ${reason} as ${moduleName} is not registered${gridScoped ? ' for gridId: ' + gridId : ''}. Check if you have registered the module:
import { ModuleRegistry } from 'ag-grid-community';
import { ${moduleName} } from '${isEnterprise ? 'ag-grid-enterprise' : 'ag-grid-community'}';

ModuleRegistry.registerModules([ ${moduleName} ]);

For more info see: ${BASE_URL}/javascript-grid/modules/`;

const clipboardApiError = (method: string) =>
    `AG Grid: Unable to use the Clipboard API (navigator.clipboard.${method}()). ` +
    'The reason why it could not be used has been logged in the previous line. ' +
    "For this reason the grid has defaulted to using a workaround which doesn't perform as well. " +
    'Either fix why Clipboard API is blocked, OR stop this message from appearing by setting grid ' +
    'property suppressClipboardApi=true (which will default the grid to using the workaround rather than the API.';

/**
 * NOTES on setting console messages:
 * 1. The message is a function that returns either a string or an array of any type.
 * 2. Returning an array enables the console to log actual objects / numbers / booleans nicely as this will be spread to the underlying console call instead of being cast to a string.
 * 3. Each entry should be followed by as const so that the IDE hover shows the actual message to aid devs
 */
export const AG_GRID_ERRORS = {
    1: () => '`rowData` must be an array' as const,
    2: ({ nodeId }: { nodeId: string | undefined }) =>
        `Duplicate node id '${nodeId}' detected from getRowId callback, this could cause issues in your grid.` as const,
    3: () => 'Calling gridApi.resetRowHeights() makes no sense when using Auto Row Height.' as const,
    4: ({ id }: { id: string }) => `Could not find row id=${id}, data item was not found for this id` as const,
    5: ({ data }: { data: any }) =>
        [
            `Could not find data item as object was not found.`,
            data,
            ' Consider using getRowId to help the Grid find matching row data',
        ] as const,
    6: () => `'groupHideOpenParents' only works when specifying specific columns for 'colDef.showRowGroup'` as const,
    7: () => 'Pivoting is not supported with aligned grids as it may produce different columns in each grid.' as const,
    8: ({ key }: { key: string }) => `Unknown key for navigation ${key}` as const,
    9: ({ variable }: { variable: { cssName: string; defaultValue: number } }) =>
        `No value for ${variable.cssName}. This usually means that the grid has been initialised before styles have been loaded. The default value of ${variable.defaultValue} will be used and updated when styles load.` as const,
    10: ({ eventType }: { eventType: RowNodeEventType }) =>
        `As of v33, the '${eventType}' event is deprecated. Use the global 'modelUpdated' event to determine when row children have changed.`,
    11: () => 'No gridOptions provided to createGrid' as const,
    12: ({ colKey }: { colKey: string | Column }) => ['column ', colKey, ' not found'] as const,
    13: () =>
        'Could not find rowIndex, this means tasks are being executed on a rowNode that has been removed from the grid.' as const,
    14: ({ groupPrefix }: { groupPrefix: string }) =>
        `Row IDs cannot start with ${groupPrefix}, this is a reserved prefix for AG Grid's row grouping feature.` as const,
    15: ({ expression }: { expression: any }) => ['value should be either a string or a function', expression] as const,
    16: ({ expression, params, e }: { expression: string; params: any; e: any }) =>
        [
            'Processing of the expression failed',
            'Expression = ',
            expression,
            'Params = ',
            params,
            'Exception = ',
            e,
        ] as const,
    17: () => 'you need either field or valueSetter set on colDef for editing to work' as const,
    18: () => `alignedGrids contains an undefined option.` as const,
    19: () => `alignedGrids - No api found on the linked grid.` as const,
    20: () =>
        `You may want to configure via a callback to avoid setup race conditions:
                     "alignedGrids: () => [linkedGrid]"` as const,
    21: () =>
        'pivoting is not supported with aligned grids. You can only use one of these features at a time in a grid.' as const,
    22: ({ key }: { key: string }) => `${key} is an initial property and cannot be updated.` as const,
    23: () =>
        'The return of `getRowHeight` cannot be zero. If the intention is to hide rows, use a filter instead.' as const,
    24: () => 'row height must be a number if not using standard row model' as const,
    25: ({ id }: { id: any }) =>
        [`The getRowId callback must return a string. The ID `, id, ` is being cast to a string.`] as const,
    26: ({ fnName, preDestroyLink }: { fnName: string; preDestroyLink: string }) => {
        return `Grid API function ${fnName}() cannot be called as the grid has been destroyed.\n Either clear local references to the grid api, when it is destroyed, or check gridApi.isDestroyed() to avoid calling methods against a destroyed grid.\n To run logic when the grid is about to be destroyed use the gridPreDestroy event. See: ${preDestroyLink}` as const;
    },
    27: ({ fnName, module }: { fnName: string; module: string }) =>
        `API function '${fnName}' not registered to module '${module}'` as const,
    28: () => 'setRowCount cannot be used while using row grouping.' as const,
    29: () =>
        'tried to call sizeColumnsToFit() but the grid is coming back with zero width, maybe the grid is not visible yet on the screen?' as const,
    30: ({ toIndex }: { toIndex: number }) =>
        [
            'tried to insert columns in invalid location, toIndex = ',
            toIndex,
            'remember that you should not count the moving columns when calculating the new index',
        ] as const,
    31: () => 'infinite loop in resizeColumnSets' as const,
    32: () =>
        'applyColumnState() - the state attribute should be an array, however an array was not found. Please provide an array of items (one for each col you want to change) for state.' as const,
    33: () =>
        'stateItem.aggFunc must be a string. if using your own aggregation functions, register the functions first before using them in get/set state. This is because it is intended for the column state to be stored and retrieved as simple JSON.' as const,

    34: ({ key }: { key: string }) =>
        `the column type '${key}' is a default column type and cannot be overridden.` as const,
    35: () =>
        `Column type definitions 'columnTypes' with a 'type' attribute are not supported because a column type cannot refer to another column type. Only column definitions 'columnDefs' can use the 'type' attribute to refer to a column type.` as const,
    36: ({ t }: { t: string }) => "colDef.type '" + t + "' does not correspond to defined gridOptions.columnTypes",
    37: () => `Changing the column pinning status is not allowed with domLayout='print'` as const,
    // 38: () => '' as const,
    39: () =>
        'Applying column order broke a group where columns should be married together. Applying new order has been discarded.' as const,
    40: ({ e, method }: { e: any; method: string }) => `${e}\n${clipboardApiError(method)}` as const,
    41: () =>
        "Browser did not allow document.execCommand('copy'). Ensure 'api.copySelectedRowsToClipboard() is invoked via a user event, i.e. button click, otherwise the browser will prevent it for security reasons." as const,
    42: () => "Browser does not support document.execCommand('copy') for clipboard operations" as const,
    // 43: () => '' as const,
    44: () =>
        'Data type definition hierarchies (via the "extendsDataType" property) cannot contain circular references.' as const,
    45: ({ parentCellDataType }: { parentCellDataType: string }) =>
        `The data type definition ${parentCellDataType} does not exist.` as const,
    46: () => 'The "baseDataType" property of a data type definition must match that of its parent.' as const,
    47: ({ cellDataType }: { cellDataType: string }) => `Missing data type definition - "${cellDataType}"` as const,
    48: ({ property }: { property: string }) =>
        `Cell data type is "object" but no Value ${property} has been provided. Please either provide an object data type definition with a Value ${property}, or set "colDef.value${property}"` as const,
    49: ({ methodName }: { methodName: string }) =>
        `Framework component is missing the method ${methodName}()` as const,
    50: ({ compName }: { compName: string | undefined }) =>
        `Could not find component ${compName}, did you forget to configure this component?` as const,
    51: () => `Export cancelled. Export is not allowed as per your configuration.` as const,
    52: () => 'There is no `window` associated with the current `document`' as const,
    53: () => `unknown value type during csv conversion` as const,
    54: () => 'Could not find document body, it is needed for drag and drop.' as const,
    55: () => 'addRowDropZone - A container target needs to be provided' as const,
    56: () =>
        'addRowDropZone - target already exists in the list of DropZones. Use `removeRowDropZone` before adding it again.' as const,
    // 57: () => '' as const,
    58: () => 'no values found for select cellEditor' as const,
    59: () => 'cannot select pinned rows' as const,
    60: () => 'cannot select node until it has finished loading' as const,
    61: () =>
        'since version v32.2.0, rowNode.isFullWidthCell() has been deprecated. Instead check `rowNode.detail` followed by the user provided `isFullWidthRow` grid option.' as const,
    62: ({ colId }: { colId: string }) => `setFilterModel() - no column found for colId: ${colId}` as const,
    63: ({ colId }: { colId: string }) =>
        `setFilterModel() - unable to fully apply model, filtering disabled for colId: ${colId}` as const,
    64: ({ colId }: { colId: string }) =>
        `setFilterModel() - unable to fully apply model, unable to create filter for colId: ${colId}` as const,
    65: () => 'filter missing setModel method, which is needed for setFilterModel' as const,
    66: () => 'filter API missing getModel method, which is needed for getFilterModel' as const,
    67: () => 'Filter is missing isFilterActive() method' as const,
    68: () => 'Column Filter API methods have been disabled as Advanced Filters are enabled.' as const,
    69: ({ guiFromFilter }: { guiFromFilter: any }) =>
        `getGui method from filter returned ${guiFromFilter}; it should be a DOM element.` as const,
    70: ({ newFilter }: { newFilter: any }) =>
        `Grid option quickFilterText only supports string inputs, received: ${typeof newFilter}` as const,
    71: () => 'debounceMs is ignored when apply button is present' as const,
    72: ({ keys }: { keys: string[] }) => [`ignoring FilterOptionDef as it doesn't contain one of `, keys] as const,
    73: () => `invalid FilterOptionDef supplied as it doesn't contain a 'displayKey'` as const,
    74: () => 'no filter options for filter' as const,
    75: () => 'Unknown button type specified' as const,
    76: ({ filterModelType }: { filterModelType: any }) =>
        [
            'Unexpected type of filter "',
            filterModelType,
            '", it looks like the filter was configured with incorrect Filter Options',
        ] as const,
    77: () => `Filter model is missing 'conditions'` as const,
    78: () =>
        'Filter Model contains more conditions than "filterParams.maxNumConditions". Additional conditions have been ignored.' as const,
    79: () => '"filterParams.maxNumConditions" must be greater than or equal to zero.' as const,
    80: () => '"filterParams.numAlwaysVisibleConditions" must be greater than or equal to zero.' as const,
    81: () =>
        '"filterParams.numAlwaysVisibleConditions" cannot be greater than "filterParams.maxNumConditions".' as const,
    82: ({ param }: { param: any }) => `DateFilter ${param} is not a number` as const,
    83: () => `DateFilter minValidYear should be <= maxValidYear` as const,
    84: () => `DateFilter minValidDate should be <= maxValidDate` as const,
    85: () =>
        'DateFilter should not have both minValidDate and minValidYear parameters set at the same time! minValidYear will be ignored.' as const,
    86: () =>
        'DateFilter should not have both maxValidDate and maxValidYear parameters set at the same time! maxValidYear will be ignored.' as const,
    87: () =>
        'DateFilter parameter minValidDate should always be lower than or equal to parameter maxValidDate.' as const,
    88: ({ index }: { index: number }) => `Invalid row index for ensureIndexVisible: ${index}` as const,
    89: () =>
        `A template was provided for Header Group Comp - templates are only supported for Header Comps (not groups)` as const,
    90: () => `datasource is missing getRows method` as const,
    // 91: () => '' as const,
    92: ({ methodName }: { methodName: string }) =>
        `AnimationFrameService.${methodName} called but animation frames are off` as const,
    93: () => 'cannot add multiple ranges when `cellSelection.suppressMultiRanges = true`' as const,
    94: ({
        paginationPageSizeOption,
        pageSizeSet,
        pageSizesSet,
        pageSizeOptions,
    }: {
        paginationPageSizeOption: number;
        pageSizeSet: boolean;
        pageSizesSet: any;
        pageSizeOptions: any[];
    }) =>
        `'paginationPageSize=${paginationPageSizeOption}'${pageSizeSet ? '' : ' (default value)'}, but ${paginationPageSizeOption} is not included in${pageSizesSet ? '' : ' the default'} paginationPageSizeSelector=[${pageSizeOptions.join(', ')}].` as const,
    95: ({
        paginationPageSizeOption,
        paginationPageSizeSelector,
    }: {
        paginationPageSizeOption: number;
        paginationPageSizeSelector: string;
    }) =>
        `Either set '${paginationPageSizeSelector}' to an array that includes ${paginationPageSizeOption} or to 'false' to disable the page size selector.` as const,
    96: ({ id, data }: { id: string; data: any }) =>
        [
            'Duplicate ID',
            id,
            'found for pinned row with data',
            data,
            'When `getRowId` is defined, it must return unique IDs for all pinned rows. Use the `rowPinned` parameter.',
        ] as const,
    97: ({ colId }: { colId: string }) => `cellEditor for column ${colId} is missing getGui() method` as const,
    98: () =>
        'popup cellEditor does not work with fullRowEdit - you cannot use them both - either turn off fullRowEdit, or stop using popup editors.' as const,
    99: () =>
        'Since v32, `api.hideOverlay()` does not hide the loading overlay when `loading=true`. Set `loading=false` instead.' as const,
    // 100: () => '' as const,
    101: ({
        propertyName,
        componentName,
        agGridDefaults,
        jsComps,
    }: {
        propertyName: string;
        componentName: string;
        agGridDefaults: { [key in UserComponentName]?: any };
        jsComps: { [key: string]: any };
    }) => {
        const textOutput: string[] = [];
        const validComponents = [
            // Don't include the old names / internals in potential suggestions
            ...Object.keys(agGridDefaults).filter(
                (k) => !['agCellEditor', 'agGroupRowRenderer', 'agSortIndicator'].includes(k)
            ),
            ...Object.keys(jsComps),
        ];
        const suggestions = _fuzzySuggestions({
            inputValue: componentName,
            allSuggestions: validComponents,
            hideIrrelevant: true,
            filterByPercentageOfBestMatch: 0.8,
        }).values;

        textOutput.push(
            `Could not find '${componentName}' component. It was configured as "${propertyName}: '${componentName}'" but it wasn't found in the list of registered components.\n`
        );
        if (suggestions.length > 0) {
            textOutput.push(`         Did you mean: [${suggestions.slice(0, 3)}]?\n`);
        }
        textOutput.push(`If using a custom component check it has been registered correctly.`);
        return textOutput;
    },
    102: () => "selecting just filtered only works when gridOptions.rowModelType='clientSide'" as const,
    103: () =>
        'Invalid selection state. When using client-side row model, the state must conform to `string[]`.' as const,
    104: ({ value, param }: { value: number; param: string }) =>
        `Numeric value ${value} passed to ${param} param will be interpreted as ${value} seconds. If this is intentional use "${value}s" to silence this warning.` as const,
    105: ({ e }: { e: any }) => [`chart rendering failed`, e] as const,
    106: () =>
        'Invalid mixing of Theming API and CSS File Themes in the same page. A Theming API theme has been provided to the `theme` grid option, but the file (ag-grid.css) is also included and will cause styling issues. Remove ag-grid.css from the page.' as const,
    107: ({ key, value }: { key: string; value: string }) => `Invalid value for param ${key} - ${value}` as const,
    108: ({ e }: { e: any }) => ['chart update failed', e] as const,
    109: ({ aggFuncOrString }: { aggFuncOrString: any }) =>
        `unrecognised aggregation function ${aggFuncOrString}` as const,
    110: () => 'groupHideOpenParents only works when specifying specific columns for colDef.showRowGroup' as const,
    111: () =>
        'Invalid selection state. When `groupSelectsChildren` is enabled, the state must conform to `IServerSideGroupSelectionState`.' as const,
    112: ({ googleFont, googleFontsDomain }: { googleFont: string; googleFontsDomain: string }) =>
        `Theme uses google font ${googleFont} but no value for loadThemeGoogleFonts was provided. Pass true to load fonts from ${googleFontsDomain} or false to silence this warning.` as const,
    113: () =>
        'Set Filter cannot initialise because you are using a row model that does not contain all rows in the browser. Either use a different filter type, or configure Set Filter such that you provide it with values' as const,
    114: ({ component }: { component: string }) =>
        `Could not find component with name of ${component}. Is it in Vue.components?` as const,
    115: () => 'The provided selection state should be an object.' as const,
    116: () => 'Invalid selection state. The state must conform to `IServerSideSelectionState`.' as const,
    117: () => 'selectAll must be of boolean type.' as const,
    118: () => 'Infinite scrolling must be enabled in order to set the row count.' as const,
    // 119: () => '',
    // 120: () => '',
    121: () =>
        'a column you are grouping or pivoting by has objects as values. If you want to group by complex objects then either a) use a colDef.keyCreator (see AG Grid docs) or b) to toString() on the object to return a key' as const,
    122: () => 'could not find the document, document is empty' as const,
    123: () => 'Advanced Filter is only supported with the Client-Side Row Model or Server-Side Row Model.' as const,
    124: () => 'No active charts to update.' as const,
    125: ({ chartId }: { chartId: string }) =>
        `Unable to update chart. No active chart found with ID: ${chartId}.` as const,
    126: () => 'unable to restore chart as no chart model is provided' as const,
    127: ({ allRange }: { allRange?: boolean }) =>
        `unable to create chart as ${allRange ? 'there are no columns in the grid' : 'no range is selected'}.` as const,
    128: ({ feature }: { feature: string }) =>
        `${feature} is only available if using 'multiRow' selection mode.` as const,
    129: ({ feature, rowModel }: { feature: string; rowModel: string }) =>
        `${feature} is only available if using 'clientSide' or 'serverSide' rowModelType, you are using ${rowModel}.` as const,
    130: () => 'cannot multi select unless selection mode is "multiRow"' as const,
    131: () => 'cannot range select while selecting multiple rows' as const,
    132: () => '' as const,
    133: () => 'iconRenderer should return back a string or a dom object' as const,
    134: ({ iconName }: { iconName: string }) => `Did not find icon ${iconName}` as const,
    135: () => `Data type of the new value does not match the cell data type of the column` as const,
    136: () =>
        `Unable to update chart as the 'type' is missing. It must be either 'rangeChartUpdate', 'pivotChartUpdate', or 'crossFilterChartUpdate'.` as const,
    137: ({ type, currentChartType }: { type: string; currentChartType: string }) =>
        `Unable to update chart as a '${type}' update type is not permitted on a ${currentChartType}.` as const,
    138: ({ chartType }: { chartType: string }) => `invalid chart type supplied: ${chartType}` as const,
    139: ({ customThemeName }: { customThemeName: string }) =>
        `a custom chart theme with the name ${customThemeName} has been supplied but not added to the 'chartThemes' list` as const,
    140: ({ name }: { name: string }) =>
        `no stock theme exists with the name '${name}' and no custom chart theme with that name was supplied to 'customChartThemes'` as const,
    141: () => 'cross filtering with row grouping is not supported.' as const,
    142: () => 'cross filtering is only supported in the client side row model.' as const,
    143: ({ panel }: { panel: string | undefined }) => `'${panel}' is not a valid Chart Tool Panel name` as const,
    144: ({ type }: { type: string }) => `Invalid charts data panel group name supplied: '${type}'` as const,
    145: ({ group }: { group: string }) =>
        `As of v32, only one charts customize panel group can be expanded at a time. '${group}' will not be expanded.` as const,
    146: () =>
        `'navigator' is now displayed in the charts advanced settings instead of the customize panel, and this setting will be ignored.` as const,
    147: ({ group }: { group: string }) => `Invalid charts customize panel group name supplied: '${group}'` as const,
    148: ({ group }: { group: string }) => `invalid chartGroupsDef config '${group}'` as const,
    149: ({ group, chartType }: { group: string; chartType: string }) =>
        `invalid chartGroupsDef config '${group}.${chartType}'` as const,
    150: () => `'seriesChartTypes' are required when the 'customCombo' chart type is specified.` as const,
    151: ({ chartType }: { chartType: string }) =>
        `invalid chartType '${chartType}' supplied in 'seriesChartTypes', converting to 'line' instead.` as const,
    152: ({ colId }: { colId: string }) =>
        `no 'seriesChartType' found for colId = '${colId}', defaulting to 'line'.` as const,
    153: ({ chartDataType }: { chartDataType: string }) =>
        `unexpected chartDataType value '${chartDataType}' supplied, instead use 'category', 'series' or 'excluded'` as const,
    154: ({ colId }: { colId: string }) =>
        `cross filtering requires a 'agSetColumnFilter' or 'agMultiColumnFilter' to be defined on the column with id: ${colId}` as const,
    155: ({ option }: { option: string }) => `'${option}' is not a valid Chart Toolbar Option` as const,
    156: ({ panel }: { panel: string }) => `Invalid panel in chartToolPanelsDef.panels: '${panel}'` as const,
    157: ({ unrecognisedGroupIds }: { unrecognisedGroupIds: string[] }) =>
        ['unable to find group(s) for supplied groupIds:', unrecognisedGroupIds] as const,
    158: () => 'can not expand a column item that does not represent a column group header' as const,
    159: () => 'Invalid params supplied to createExcelFileForExcel() - `ExcelExportParams.data` is empty.' as const,
    160: () => `Export cancelled. Export is not allowed as per your configuration.` as const,
    161: () =>
        "The Excel Exporter is currently on Multi Sheet mode. End that operation by calling 'api.getMultipleSheetAsExcel()' or 'api.exportMultipleSheetsAsExcel()'" as const,
    162: ({ id, dataType }: { id: string; dataType: string }) =>
        `Unrecognized data type for excel export [${id}.dataType=${dataType}]` as const,
    163: ({ featureName }: { featureName: string }) =>
        `Excel table export does not work with ${featureName}. The exported Excel file will not contain any Excel tables.\n Please turn off ${featureName} to enable Excel table exports.` as const,
    164: () => 'Unable to add data table to Excel sheet: A table already exists.' as const,
    165: () => 'Unable to add data table to Excel sheet: Missing required parameters.' as const,
    166: ({ unrecognisedGroupIds }: { unrecognisedGroupIds: string[] }) =>
        ['unable to find groups for these supplied groupIds:', unrecognisedGroupIds] as const,
    167: ({ unrecognisedColIds }: { unrecognisedColIds: string[] }) =>
        ['unable to find columns for these supplied colIds:', unrecognisedColIds] as const,
    168: () => 'detailCellRendererParams.template should be function or string' as const,
    169: () =>
        'Reference to eDetailGrid was missing from the details template. Please add data-ref="eDetailGrid" to the template.' as const,
    170: ({ providedStrategy }: { providedStrategy: string }) =>
        `invalid cellRendererParams.refreshStrategy = ${providedStrategy} supplied, defaulting to refreshStrategy = 'rows'.` as const,
    171: () =>
        'could not find detail grid options for master detail, please set gridOptions.detailCellRendererParams.detailGridOptions' as const,
    172: () =>
        'could not find getDetailRowData for master / detail, please set gridOptions.detailCellRendererParams.getDetailRowData' as const,
    173: ({ group }: { group: string }) => `invalid chartGroupsDef config '${group}'` as const,
    174: ({ group, chartType }: { group: string; chartType: string }) =>
        `invalid chartGroupsDef config '${group}.${chartType}'` as const,
    175: ({ menuTabName, itemsToConsider }: { menuTabName: string; itemsToConsider: string[] }) =>
        [
            `Trying to render an invalid menu item '${menuTabName}'. Check that your 'menuTabs' contains one of `,
            itemsToConsider,
        ] as const,
    176: ({ key }: { key: string }) => `unknown menu item type ${key}` as const,
    177: () => `valid values for fillHandleDirection are 'x', 'y' and 'xy'. Default to 'xy'.` as const,
    178: ({ colId }: { colId: string }) => `column ${colId} is not visible` as const,
    179: () => 'totalValueGetter should be either a function or a string (expression)' as const,
    180: () => 'agRichSelectCellEditor requires cellEditorParams.values to be set' as const,
    181: () =>
        'agRichSelectCellEditor cannot have `multiSelect` and `allowTyping` set to `true`. AllowTyping has been turned off.' as const,
    182: () =>
        'you cannot mix groupDisplayType = "multipleColumns" with treeData, only one column can be used to display groups when doing tree data' as const,
    183: () => 'Group Column Filter only works on group columns. Please use a different filter.' as const,
    184: ({ parentGroupData, childNodeData }: { parentGroupData: any; childNodeData: any }) =>
        [`duplicate group keys for row data, keys should be unique`, [parentGroupData, childNodeData]] as const,
    185: ({ data }: { data: any }) => [`getDataPath() should not return an empty path`, [data]] as const,
    186: ({
        rowId,
        rowData,
        duplicateRowsData,
    }: {
        rowId: string | undefined;
        rowData: any;
        duplicateRowsData: any[];
    }) => [`duplicate group keys for row data, keys should be unique`, rowId, rowData, ...duplicateRowsData] as const,
    187: ({ rowId, firstData, secondData }: { rowId: string; firstData: any; secondData: any }) =>
        [
            `Duplicate node id ${rowId}. Row IDs are provided via the getRowId() callback. Please modify the getRowId() callback code to provide unique row id values.`,
            'first instance',
            firstData,
            'second instance',
            secondData,
        ] as const,
    188: () => `getRowId callback must be provided for Server Side Row Model selection to work correctly.` as const,
    189: ({ startRow }: { startRow: number }) =>
        `invalid value ${startRow} for startRow, the value should be >= 0` as const,
    190: ({ rowGroupId, data }: { rowGroupId: string | undefined; data: any }) =>
        [
            `null and undefined values are not allowed for server side row model keys`,
            rowGroupId ? `column = ${rowGroupId}` : ``,
            `data is `,
            data,
        ] as const,
    191: () => `cannot multi select unless selection mode is 'multiRow'` as const,
    192: () => `cannot use range selection when multi selecting rows` as const,
    193: () => "cannot multi select unless selection mode is 'multiRow'" as const,
    194: ({ method }: { method: string }) =>
        `calling gridApi.${method}() is only possible when using rowModelType=\`clientSide\`.` as const,
    195: ({ justCurrentPage }: { justCurrentPage: boolean | undefined }) =>
        `selecting just ${justCurrentPage ? 'current page' : 'filtered'} only works when gridOptions.rowModelType='clientSide'` as const,
    196: ({ key }: { key: string }) => `Provided ids must be of string type. Invalid id provided: ${key}` as const,
    197: () => '`toggledNodes` must be an array of string ids.' as const,
    198: () => `cannot multi select unless selection mode is 'multiRow'` as const,
    199: () =>
        `getSelectedNodes and getSelectedRows functions cannot be used with select all functionality with the server-side row model. Use \`api.getServerSideSelectionState()\` instead.` as const,
    200: missingModule,
    201: ({ rowModelType }: { rowModelType: string }) => `Could not find row model for rowModelType = ${rowModelType}`,

    202: () =>
        `\`getSelectedNodes\` and \`getSelectedRows\` functions cannot be used with \`groupSelectsChildren\` and the server-side row model. Use \`api.getServerSideSelectionState()\` instead.` as const,
    203: () =>
        'Server Side Row Model does not support Dynamic Row Height and Cache Purging. Either a) remove getRowHeight() callback or b) remove maxBlocksInCache property. Purging has been disabled.' as const,
    204: () =>
        'Server Side Row Model does not support Auto Row Height and Cache Purging. Either a) remove colDef.autoHeight or b) remove maxBlocksInCache property. Purging has been disabled.' as const,
    205: ({ duplicateIdText }: { duplicateIdText: string }) =>
        `Unable to display rows as duplicate row ids (${duplicateIdText}) were returned by the getRowId callback. Please modify the getRowId callback to provide unique ids.` as const,
    206: () => 'getRowId callback must be implemented for transactions to work. Transaction was ignored.' as const,
    207: () =>
        'The Set Filter Parameter "defaultToNothingSelected" value was ignored because it does not work when "excelMode" is used.' as const,
    208: () =>
        `Set Filter Value Formatter must return string values. Please ensure the Set Filter Value Formatter returns string values for complex objects.` as const,
    209: () =>
        'Set Filter Key Creator is returning null for provided values and provided values are primitives. Please provide complex objects. See https://www.ag-grid.com/javascript-data-grid/filter-set-filter-list/#filter-value-types' as const,
    210: () =>
        'Set Filter has a Key Creator, but provided values are primitives. Did you mean to provide complex objects?' as const,
    211: () =>
        'property treeList=true for Set Filter params, but you did not provide a treeListPathGetter or values of type Date.' as const,
    212: () =>
        `please review all your toolPanel components, it seems like at least one of them doesn't have an id` as const,
    213: () => 'Advanced Filter does not work with Filters Tool Panel. Filters Tool Panel has been disabled.' as const,
    214: ({ key }: { key: string }) => `unable to lookup Tool Panel as invalid key supplied: ${key}` as const,
    215: ({ key, defaultByKey }: { key: string; defaultByKey: object }) =>
        `the key ${key} is not a valid key for specifying a tool panel, valid keys are: ${Object.keys(defaultByKey).join(',')}` as const,
    216: ({ id }: { id: string }) =>
        `error processing tool panel component ${id}. You need to specify 'toolPanel'` as const,
    217: ({ invalidColIds }: { invalidColIds: any[] }) =>
        ['unable to find grid columns for the supplied colDef(s):', invalidColIds] as const,
    218: ({ property, defaultOffset }: { property: string; defaultOffset: number | undefined }) =>
        `${property} must be a number, the value you provided is not a valid number. Using the default of ${defaultOffset}px.` as const,
    219: ({ property }: { property: string }) => `Property ${property} does not exist on the target object.` as const,
    220: ({ lineDash }: { lineDash: string }) => `'${lineDash}' is not a valid 'lineDash' option.` as const,
    221: () => `agAggregationComponent should only be used with the client and server side row model.` as const,
    222: () => `agFilteredRowCountComponent should only be used with the client side row model.` as const,
    223: () => `agSelectedRowCountComponent should only be used with the client and server side row model.` as const,
    224: () => `agTotalAndFilteredRowCountComponent should only be used with the client side row model.` as const,
    225: () => 'agTotalRowCountComponent should only be used with the client side row model.' as const,
    226: () => 'viewport is missing init method.' as const,
    227: () => 'menu item icon must be DOM node or string' as const,
    228: ({ menuItemOrString }: { menuItemOrString: string }) => `unrecognised menu item ${menuItemOrString}` as const,
    229: ({ index }: { index: number }) => ['invalid row index for ensureIndexVisible: ', index] as const,
    230: () =>
        'detailCellRendererParams.template is not supported by AG Grid React. To change the template, provide a Custom Detail Cell Renderer. See https://ag-grid.com/react-data-grid/master-detail-custom-detail/' as const,
    // @deprecated v32 mark for removal as part of v32 deprecated features
    231: () => 'As of v32, using custom components with `reactiveCustomComponents = false` is deprecated.' as const,
    232: () => 'Using both rowData and v-model. rowData will be ignored.' as const,
    233: ({ methodName }: { methodName: string }) =>
        `Framework component is missing the method ${methodName}()` as const,
    234: () =>
        'Group Column Filter does not work with the colDef property "field". This property will be ignored.' as const,
    235: () =>
        'Group Column Filter does not work with the colDef property "filterValueGetter". This property will be ignored.' as const,
    236: () =>
        'Group Column Filter does not work with the colDef property "filterParams". This property will be ignored.' as const,
    237: () =>
        'Group Column Filter does not work with Tree Data enabled. Please disable Tree Data, or use a different filter.' as const,
    238: ({ message }: { message: string }) => ['Failed to deserialize state with error ', message] as const,
    239: () =>
        'Invalid mixing of Theming API and CSS File Themes in the same page. No value was provided to the `theme` grid option so it defaulted to themeQuartz, but the file (ag-grid.css) is also included and will cause styling issues. Pass the string "legacy" to the theme grid option to use v32 style themes, or remove ag-grid.css from the page.' as const,
    240: ({ theme }: { theme: any }) =>
        `theme grid option must be a Theming API theme object or the string "legacy", received: ${theme}` as const,
    241: () => 'Row selection features are not available unless `rowSelection` is enabled.',
} as const;

export type ErrorMap = typeof AG_GRID_ERRORS;
export type ErrorId = keyof ErrorMap;

type ErrorValue<TId extends ErrorId | null> = TId extends ErrorId ? ErrorMap[TId] : never;
export type GetErrorParams<TId extends ErrorId> =
    ErrorValue<TId> extends (params: infer P) => any ? (P extends Record<string, any> ? P : undefined) : never;

export function getError<TId extends ErrorId, TParams extends GetErrorParams<TId>>(errorId: TId, args: TParams): any[] {
    const msgOrFunc: ErrorMap[TId] = AG_GRID_ERRORS[errorId];

    if (!msgOrFunc) {
        return [`Missing error text for error id ${errorId}!`];
    }

    const errorBody = msgOrFunc(args as any);
    const errorLink = getErrorLink(errorId, args);
    const errorSuffix = `\nSee ${errorLink}`;
    return Array.isArray(errorBody) ? (errorBody.concat(errorSuffix) as string[]) : [errorBody, errorSuffix];
}

export const MISSING_MODULE_REASONS = {
    1: 'Charting Aggregation',
    2: 'the Context Menu key "pivotChart"',
    3: 'the Context Menu key "chartRange"',
    4: 'Aggregation from Menu',
    5: 'Copy from Menu',
    6: 'Copy with Headers from Menu',
    7: 'Copy with Group Headers from Menu',
    8: 'Cut from Menu',
    9: 'Paste from Clipboard',
    10: 'pivotResultFields',
    11: 'Column Tool Panel',
    12: 'Filters Tool Panel',
} as const;

export type MissingModuleErrors = typeof MISSING_MODULE_REASONS;
