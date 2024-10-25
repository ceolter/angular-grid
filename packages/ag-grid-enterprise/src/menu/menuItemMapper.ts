import type {
    AgColumn,
    BeanCollection,
    ColumnAutosizeService,
    ColumnEventType,
    ColumnModel,
    ColumnNameService,
    FuncColsService,
    IAggFuncService,
    IClipboardService,
    IExpansionService,
    MenuItemDef,
    NamedBean,
    SortController,
} from 'ag-grid-community';
import { BeanStub, _createIconNoSpan, _escapeString, _exists, _getRowNode, _warn } from 'ag-grid-community';

import { isRowGroupColLocked } from '../rowGrouping/rowGroupingUtils';
import type { ChartMenuItemMapper } from './chartMenuItemMapper';
import type { ColumnChooserFactory } from './columnChooserFactory';

export class MenuItemMapper extends BeanStub implements NamedBean {
    beanName = 'menuItemMapper' as const;

    private columnModel: ColumnModel;
    private columnNameService: ColumnNameService;
    private funcColsService: FuncColsService;
    private chartMenuItemMapper: ChartMenuItemMapper;
    private sortController?: SortController;
    private columnAutosizeService?: ColumnAutosizeService;
    private expansionService?: IExpansionService;
    private clipboardService?: IClipboardService;
    private aggFuncService?: IAggFuncService;
    private columnChooserFactory?: ColumnChooserFactory;

    public wireBeans(beans: BeanCollection) {
        this.columnModel = beans.columnModel;
        this.columnNameService = beans.columnNameService;
        this.funcColsService = beans.funcColsService;
        this.chartMenuItemMapper = beans.chartMenuItemMapper as ChartMenuItemMapper;
        this.sortController = beans.sortController;
        this.columnAutosizeService = beans.columnAutosizeService;
        this.expansionService = beans.expansionService;
        this.clipboardService = beans.clipboardService;
        this.aggFuncService = beans.aggFuncService;
        this.columnChooserFactory = beans.columnChooserFactory as ColumnChooserFactory;
    }

    public mapWithStockItems(
        originalList: (MenuItemDef | string)[],
        column: AgColumn | null,
        sourceElement: () => HTMLElement,
        source: ColumnEventType
    ): (MenuItemDef | string)[] {
        if (!originalList) {
            return [];
        }

        const resultList: (MenuItemDef | string)[] = [];

        originalList.forEach((menuItemOrString) => {
            let result: MenuItemDef | string | null;

            if (typeof menuItemOrString === 'string') {
                result = this.getStockMenuItem(menuItemOrString, column, sourceElement, source);
            } else {
                // Spread to prevent leaking mapped subMenus back into the original menuItem
                result = { ...menuItemOrString };
            }
            // if no mapping, can happen when module is not loaded but user tries to use module anyway
            if (!result) {
                return;
            }

            const resultDef = result as MenuItemDef;
            const { subMenu } = resultDef;

            if (subMenu && subMenu instanceof Array) {
                resultDef.subMenu = this.mapWithStockItems(subMenu, column, sourceElement, source);
            }

            if (result != null) {
                resultList.push(result);
            }
        });

        return resultList;
    }

    private getStockMenuItem(
        key: string,
        column: AgColumn | null,
        sourceElement: () => HTMLElement,
        source: ColumnEventType
    ): MenuItemDef | string | null {
        const localeTextFunc = this.getLocaleTextFunc();
        const skipHeaderOnAutoSize = this.gos.get('skipHeaderOnAutoSize');
        const { pinnedColumnService } = this.beans;

        switch (key) {
            case 'pinSubMenu':
                return pinnedColumnService && column
                    ? {
                          name: localeTextFunc('pinColumn', 'Pin Column'),
                          icon: _createIconNoSpan('menuPin', this.beans, null),
                          subMenu: ['clearPinned', 'pinLeft', 'pinRight'],
                      }
                    : null;
            case 'pinLeft':
                return pinnedColumnService && column
                    ? {
                          name: localeTextFunc('pinLeft', 'Pin Left'),
                          action: () => pinnedColumnService.setColsPinned([column], 'left', source),
                          checked: !!column && column.isPinnedLeft(),
                      }
                    : null;
            case 'pinRight':
                return pinnedColumnService && column
                    ? {
                          name: localeTextFunc('pinRight', 'Pin Right'),
                          action: () => pinnedColumnService.setColsPinned([column], 'right', source),
                          checked: !!column && column.isPinnedRight(),
                      }
                    : null;
            case 'clearPinned':
                return pinnedColumnService && column
                    ? {
                          name: localeTextFunc('noPin', 'No Pin'),
                          action: () => pinnedColumnService.setColsPinned([column], null, source),
                          checked: !!column && !column.isPinned(),
                      }
                    : null;
            case 'valueAggSubMenu':
                if (this.gos.assertModuleRegistered('PivotCoreModule', 4)) {
                    if (!column?.isPrimary() && !column?.getColDef().pivotValueColumn) {
                        return null;
                    }

                    return {
                        name: localeTextFunc('valueAggregation', 'Value Aggregation'),
                        icon: _createIconNoSpan('menuValue', this.beans, null),
                        subMenu: this.createAggregationSubMenu(column!, this.aggFuncService!),
                        disabled: this.gos.get('functionsReadOnly'),
                    };
                } else {
                    return null;
                }
            case 'autoSizeThis':
                return {
                    name: localeTextFunc('autosizeThisColumn', 'Autosize This Column'),
                    action: () => this.columnAutosizeService?.autoSizeColumn(column, source, skipHeaderOnAutoSize),
                };
            case 'autoSizeAll':
                return {
                    name: localeTextFunc('autosizeAllColumns', 'Autosize All Columns'),
                    action: () => this.columnAutosizeService?.autoSizeAllColumns(source, skipHeaderOnAutoSize),
                };
            case 'rowGroup':
                return {
                    name:
                        localeTextFunc('groupBy', 'Group by') +
                        ' ' +
                        _escapeString(this.columnNameService.getDisplayNameForColumn(column, 'header')),
                    disabled:
                        this.gos.get('functionsReadOnly') ||
                        column?.isRowGroupActive() ||
                        !column?.getColDef().enableRowGroup,
                    action: () => this.funcColsService.addRowGroupColumns([column], source),
                    icon: _createIconNoSpan('menuAddRowGroup', this.beans, null),
                };
            case 'rowUnGroup': {
                const icon = _createIconNoSpan('menuRemoveRowGroup', this.beans, null);
                const showRowGroup = column?.getColDef().showRowGroup;
                const lockedGroups = this.gos.get('groupLockGroupColumns');
                // Handle single auto group column
                if (showRowGroup === true) {
                    return {
                        name: localeTextFunc('ungroupAll', 'Un-Group All'),
                        disabled:
                            this.gos.get('functionsReadOnly') ||
                            lockedGroups === -1 ||
                            lockedGroups >= this.funcColsService.rowGroupCols.length,
                        action: () =>
                            this.funcColsService.setRowGroupColumns(
                                this.funcColsService.rowGroupCols.slice(0, lockedGroups),
                                source
                            ),
                        icon: icon,
                    };
                }
                // Handle multiple auto group columns
                if (typeof showRowGroup === 'string') {
                    const underlyingColumn = this.columnModel.getColDefCol(showRowGroup);
                    const ungroupByName =
                        underlyingColumn != null
                            ? _escapeString(this.columnNameService.getDisplayNameForColumn(underlyingColumn, 'header'))
                            : showRowGroup;
                    return {
                        name: localeTextFunc('ungroupBy', 'Un-Group by') + ' ' + ungroupByName,
                        disabled:
                            this.gos.get('functionsReadOnly') ||
                            (underlyingColumn != null &&
                                isRowGroupColLocked(this.funcColsService, this.gos, underlyingColumn)),
                        action: () => this.funcColsService.removeRowGroupColumns([showRowGroup], source),
                        icon: icon,
                    };
                }
                // Handle primary column
                return {
                    name:
                        localeTextFunc('ungroupBy', 'Un-Group by') +
                        ' ' +
                        _escapeString(this.columnNameService.getDisplayNameForColumn(column, 'header')),
                    disabled:
                        this.gos.get('functionsReadOnly') ||
                        !column?.isRowGroupActive() ||
                        !column?.getColDef().enableRowGroup ||
                        isRowGroupColLocked(this.funcColsService, this.gos, column),
                    action: () => this.funcColsService.removeRowGroupColumns([column], source),
                    icon: icon,
                };
            }
            case 'resetColumns':
                return {
                    name: localeTextFunc('resetColumns', 'Reset Columns'),
                    action: () => this.beans.columnStateService.resetColumnState(source),
                };
            case 'expandAll':
                return {
                    name: localeTextFunc('expandAll', 'Expand All Row Groups'),
                    action: () => this.expansionService?.expandAll(true),
                };
            case 'contractAll':
                return {
                    name: localeTextFunc('collapseAll', 'Collapse All Row Groups'),
                    action: () => this.expansionService?.expandAll(false),
                };
            case 'copy':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 5)) {
                    return {
                        name: localeTextFunc('copy', 'Copy'),
                        shortcut: localeTextFunc('ctrlC', 'Ctrl+C'),
                        icon: _createIconNoSpan('clipboardCopy', this.beans, null),
                        action: () => this.clipboardService!.copyToClipboard(),
                    };
                } else {
                    return null;
                }
            case 'copyWithHeaders':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 6)) {
                    return {
                        name: localeTextFunc('copyWithHeaders', 'Copy with Headers'),
                        // shortcut: localeTextFunc('ctrlC','Ctrl+C'),
                        icon: _createIconNoSpan('clipboardCopy', this.beans, null),
                        action: () => this.clipboardService!.copyToClipboard({ includeHeaders: true }),
                    };
                } else {
                    return null;
                }
            case 'copyWithGroupHeaders':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 7)) {
                    return {
                        name: localeTextFunc('copyWithGroupHeaders', 'Copy with Group Headers'),
                        // shortcut: localeTextFunc('ctrlC','Ctrl+C'),
                        icon: _createIconNoSpan('clipboardCopy', this.beans, null),
                        action: () =>
                            this.clipboardService!.copyToClipboard({ includeHeaders: true, includeGroupHeaders: true }),
                    };
                } else {
                    return null;
                }
            case 'cut':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 8)) {
                    const focusedCell = this.beans.focusService.getFocusedCell();
                    const rowNode = focusedCell ? _getRowNode(this.beans, focusedCell) : null;
                    const isEditable = rowNode ? focusedCell?.column.isCellEditable(rowNode) : false;
                    return {
                        name: localeTextFunc('cut', 'Cut'),
                        shortcut: localeTextFunc('ctrlX', 'Ctrl+X'),
                        icon: _createIconNoSpan('clipboardCut', this.beans, null),
                        disabled: !isEditable || this.gos.get('suppressCutToClipboard'),
                        action: () => this.clipboardService!.cutToClipboard(undefined, 'contextMenu'),
                    };
                } else {
                    return null;
                }
            case 'paste':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 9)) {
                    return {
                        name: localeTextFunc('paste', 'Paste'),
                        shortcut: localeTextFunc('ctrlV', 'Ctrl+V'),
                        disabled: true,
                        icon: _createIconNoSpan('clipboardPaste', this.beans, null),
                        action: () => this.clipboardService!.pasteFromClipboard(),
                    };
                } else {
                    return null;
                }
            case 'export': {
                const exportSubMenuItems: string[] = [];

                const csvModuleLoaded = this.gos.isModuleRegistered('CsvExportCoreModule');
                const excelModuleLoaded = this.gos.isModuleRegistered('ExcelExportCoreModule');

                if (!this.gos.get('suppressCsvExport') && csvModuleLoaded) {
                    exportSubMenuItems.push('csvExport');
                }
                if (!this.gos.get('suppressExcelExport') && excelModuleLoaded) {
                    exportSubMenuItems.push('excelExport');
                }
                return {
                    name: localeTextFunc('export', 'Export'),
                    subMenu: exportSubMenuItems,
                    icon: _createIconNoSpan('save', this.beans, null),
                };
            }
            case 'csvExport':
                return {
                    name: localeTextFunc('csvExport', 'CSV Export'),
                    icon: _createIconNoSpan('csvExport', this.beans, null),
                    action: () => this.beans.csvCreator?.exportDataAsCsv(),
                };
            case 'excelExport':
                return {
                    name: localeTextFunc('excelExport', 'Excel Export'),
                    icon: _createIconNoSpan('excelExport', this.beans, null),
                    action: () => this.beans.excelCreator?.exportDataAsExcel(),
                };
            case 'separator':
                return 'separator';
            case 'pivotChart':
            case 'chartRange':
                return this.chartMenuItemMapper.getChartItems(key) ?? null;
            case 'columnFilter':
                if (column) {
                    return {
                        name: localeTextFunc('columnFilter', 'Column Filter'),
                        icon: _createIconNoSpan('filter', this.beans, null),
                        action: () =>
                            this.beans.menuService!.showFilterMenu({
                                column,
                                buttonElement: sourceElement(),
                                containerType: 'columnFilter',
                                positionBy: 'button',
                            }),
                    };
                } else {
                    return null;
                }
            case 'columnChooser':
                return {
                    name: localeTextFunc('columnChooser', 'Choose Columns'),
                    icon: _createIconNoSpan('columns', this.beans, null),
                    action: () =>
                        this.columnChooserFactory?.showColumnChooser({ column, eventSource: sourceElement() }),
                };
            case 'sortAscending':
                return {
                    name: localeTextFunc('sortAscending', 'Sort Ascending'),
                    icon: _createIconNoSpan('sortAscending', this.beans, null),
                    action: () => this.sortController?.setSortForColumn(column!, 'asc', false, source),
                };
            case 'sortDescending':
                return {
                    name: localeTextFunc('sortDescending', 'Sort Descending'),
                    icon: _createIconNoSpan('sortDescending', this.beans, null),
                    action: () => this.sortController?.setSortForColumn(column!, 'desc', false, source),
                };
            case 'sortUnSort':
                return {
                    name: localeTextFunc('sortUnSort', 'Clear Sort'),
                    icon: _createIconNoSpan('sortUnSort', this.beans, null),
                    action: () => this.sortController?.setSortForColumn(column!, null, false, source),
                };
            default: {
                _warn(176, { key });
                return null;
            }
        }
    }

    private createAggregationSubMenu(column: AgColumn, aggFuncService: IAggFuncService): MenuItemDef[] {
        const localeTextFunc = this.getLocaleTextFunc();

        let columnToUse: AgColumn | undefined;
        if (column.isPrimary()) {
            columnToUse = column;
        } else {
            const pivotValueColumn = column.getColDef().pivotValueColumn as AgColumn;
            columnToUse = _exists(pivotValueColumn) ? pivotValueColumn : undefined;
        }

        const result: MenuItemDef[] = [];
        if (columnToUse) {
            const columnIsAlreadyAggValue = columnToUse.isValueActive();
            const funcNames = aggFuncService.getFuncNames(columnToUse);

            result.push({
                name: localeTextFunc('noAggregation', 'None'),
                action: () => {
                    this.funcColsService.removeValueColumns([columnToUse!], 'contextMenu');
                    this.funcColsService.setColumnAggFunc(columnToUse, undefined, 'contextMenu');
                },
                checked: !columnIsAlreadyAggValue,
            });

            funcNames.forEach((funcName) => {
                result.push({
                    name: localeTextFunc(funcName, aggFuncService.getDefaultFuncLabel(funcName)),
                    action: () => {
                        this.funcColsService.setColumnAggFunc(columnToUse, funcName, 'contextMenu');
                        this.funcColsService.addValueColumns([columnToUse!], 'contextMenu');
                    },
                    checked: columnIsAlreadyAggValue && columnToUse!.getAggFunc() === funcName,
                });
            });
        }

        return result;
    }
}
