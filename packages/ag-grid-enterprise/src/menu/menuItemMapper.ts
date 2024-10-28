import type {
    AgColumn,
    BeanCollection,
    ColumnAutosizeService,
    ColumnEventType,
    ColumnModel,
    ColumnNameService,
    IAggFuncService,
    IClipboardService,
    IColsService,
    IExpansionService,
    MenuItemDef,
    NamedBean,
    SortService,
} from 'ag-grid-community';
import { BeanStub, _createIconNoSpan, _escapeString, _exists, _getRowNode, _warn } from 'ag-grid-community';

import { isRowGroupColLocked } from '../rowGrouping/rowGroupingUtils';
import type { ChartMenuItemMapper } from './chartMenuItemMapper';
import type { ColumnChooserFactory } from './columnChooserFactory';

export class MenuItemMapper extends BeanStub implements NamedBean {
    beanName = 'menuItemMapper' as const;

    private colModel: ColumnModel;
    private colNames: ColumnNameService;
    private valueColsSvc?: IColsService;
    private rowGroupColsSvc?: IColsService;
    private chartMenuItemMapper: ChartMenuItemMapper;
    private sortSvc?: SortService;
    private colAutosize?: ColumnAutosizeService;
    private expansionSvc?: IExpansionService;
    private clipboardSvc?: IClipboardService;
    private aggFuncSvc?: IAggFuncService;
    private columnChooserFactory?: ColumnChooserFactory;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.colNames = beans.colNames;
        this.valueColsSvc = beans.valueColsSvc;
        this.rowGroupColsSvc = beans.rowGroupColsSvc;
        this.chartMenuItemMapper = beans.chartMenuItemMapper as ChartMenuItemMapper;
        this.sortSvc = beans.sortSvc;
        this.colAutosize = beans.colAutosize;
        this.expansionSvc = beans.expansionSvc;
        this.clipboardSvc = beans.clipboardSvc;
        this.aggFuncSvc = beans.aggFuncSvc;
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
        const { pinnedCols } = this.beans;

        switch (key) {
            case 'pinSubMenu':
                return pinnedCols && column
                    ? {
                          name: localeTextFunc('pinColumn', 'Pin Column'),
                          icon: _createIconNoSpan('menuPin', this.gos, null),
                          subMenu: ['clearPinned', 'pinLeft', 'pinRight'],
                      }
                    : null;
            case 'pinLeft':
                return pinnedCols && column
                    ? {
                          name: localeTextFunc('pinLeft', 'Pin Left'),
                          action: () => pinnedCols.setColsPinned([column], 'left', source),
                          checked: !!column && column.isPinnedLeft(),
                      }
                    : null;
            case 'pinRight':
                return pinnedCols && column
                    ? {
                          name: localeTextFunc('pinRight', 'Pin Right'),
                          action: () => pinnedCols.setColsPinned([column], 'right', source),
                          checked: !!column && column.isPinnedRight(),
                      }
                    : null;
            case 'clearPinned':
                return pinnedCols && column
                    ? {
                          name: localeTextFunc('noPin', 'No Pin'),
                          action: () => pinnedCols.setColsPinned([column], null, source),
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
                        icon: _createIconNoSpan('menuValue', this.gos, null),
                        subMenu: this.createAggregationSubMenu(column!, this.aggFuncSvc!),
                        disabled: this.gos.get('functionsReadOnly'),
                    };
                } else {
                    return null;
                }
            case 'autoSizeThis':
                return {
                    name: localeTextFunc('autosizeThisColumn', 'Autosize This Column'),
                    action: () => this.colAutosize?.autoSizeColumn(column, source, skipHeaderOnAutoSize),
                };
            case 'autoSizeAll':
                return {
                    name: localeTextFunc('autosizeAllColumns', 'Autosize All Columns'),
                    action: () => this.colAutosize?.autoSizeAllColumns(source, skipHeaderOnAutoSize),
                };
            case 'rowGroup':
                return {
                    name:
                        localeTextFunc('groupBy', 'Group by') +
                        ' ' +
                        _escapeString(this.colNames.getDisplayNameForColumn(column, 'header')),
                    disabled:
                        !this.rowGroupColsSvc ||
                        this.gos.get('functionsReadOnly') ||
                        column?.isRowGroupActive() ||
                        !column?.getColDef().enableRowGroup,
                    action: () => this.rowGroupColsSvc?.addColumns([column], source),
                    icon: _createIconNoSpan('menuAddRowGroup', this.gos, null),
                };
            case 'rowUnGroup': {
                const icon = _createIconNoSpan('menuRemoveRowGroup', this.gos, null);
                const showRowGroup = column?.getColDef().showRowGroup;
                const lockedGroups = this.gos.get('groupLockGroupColumns');
                // Handle single auto group column
                if (showRowGroup === true) {
                    return {
                        name: localeTextFunc('ungroupAll', 'Un-Group All'),
                        disabled:
                            !this.rowGroupColsSvc ||
                            this.gos.get('functionsReadOnly') ||
                            lockedGroups === -1 ||
                            lockedGroups >= (this.rowGroupColsSvc?.columns.length ?? 0),
                        action: () => {
                            if (this.rowGroupColsSvc) {
                                this.rowGroupColsSvc.setColumns(
                                    this.rowGroupColsSvc.columns.slice(0, lockedGroups),
                                    source
                                );
                            }
                        },
                        icon: icon,
                    };
                }
                // Handle multiple auto group columns
                if (typeof showRowGroup === 'string') {
                    const underlyingColumn = this.colModel.getColDefCol(showRowGroup);
                    const ungroupByName =
                        underlyingColumn != null
                            ? _escapeString(this.colNames.getDisplayNameForColumn(underlyingColumn, 'header'))
                            : showRowGroup;
                    return {
                        name: localeTextFunc('ungroupBy', 'Un-Group by') + ' ' + ungroupByName,
                        disabled:
                            !this.rowGroupColsSvc ||
                            this.gos.get('functionsReadOnly') ||
                            isRowGroupColLocked(underlyingColumn, this.beans),
                        action: () => {
                            this.rowGroupColsSvc?.removeColumns([showRowGroup], source);
                        },
                        icon: icon,
                    };
                }
                // Handle primary column
                return {
                    name:
                        localeTextFunc('ungroupBy', 'Un-Group by') +
                        ' ' +
                        _escapeString(this.colNames.getDisplayNameForColumn(column, 'header')),
                    disabled:
                        !this.rowGroupColsSvc ||
                        this.gos.get('functionsReadOnly') ||
                        !column?.isRowGroupActive() ||
                        !column?.getColDef().enableRowGroup ||
                        isRowGroupColLocked(column, this.beans),
                    action: () => this.rowGroupColsSvc?.removeColumns([column], source),
                    icon: icon,
                };
            }
            case 'resetColumns':
                return {
                    name: localeTextFunc('resetColumns', 'Reset Columns'),
                    action: () => this.beans.colState.resetColumnState(source),
                };
            case 'expandAll':
                return {
                    name: localeTextFunc('expandAll', 'Expand All Row Groups'),
                    action: () => this.expansionSvc?.expandAll(true),
                };
            case 'contractAll':
                return {
                    name: localeTextFunc('collapseAll', 'Collapse All Row Groups'),
                    action: () => this.expansionSvc?.expandAll(false),
                };
            case 'copy':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 5)) {
                    return {
                        name: localeTextFunc('copy', 'Copy'),
                        shortcut: localeTextFunc('ctrlC', 'Ctrl+C'),
                        icon: _createIconNoSpan('clipboardCopy', this.gos, null),
                        action: () => this.clipboardSvc!.copyToClipboard(),
                    };
                } else {
                    return null;
                }
            case 'copyWithHeaders':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 6)) {
                    return {
                        name: localeTextFunc('copyWithHeaders', 'Copy with Headers'),
                        // shortcut: localeTextFunc('ctrlC','Ctrl+C'),
                        icon: _createIconNoSpan('clipboardCopy', this.gos, null),
                        action: () => this.clipboardSvc!.copyToClipboard({ includeHeaders: true }),
                    };
                } else {
                    return null;
                }
            case 'copyWithGroupHeaders':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 7)) {
                    return {
                        name: localeTextFunc('copyWithGroupHeaders', 'Copy with Group Headers'),
                        // shortcut: localeTextFunc('ctrlC','Ctrl+C'),
                        icon: _createIconNoSpan('clipboardCopy', this.gos, null),
                        action: () =>
                            this.clipboardSvc!.copyToClipboard({ includeHeaders: true, includeGroupHeaders: true }),
                    };
                } else {
                    return null;
                }
            case 'cut':
                if (this.gos.assertModuleRegistered('ClipboardCoreModule', 8)) {
                    const focusedCell = this.beans.focusSvc.getFocusedCell();
                    const rowNode = focusedCell ? _getRowNode(this.beans, focusedCell) : null;
                    const isEditable = rowNode ? focusedCell?.column.isCellEditable(rowNode) : false;
                    return {
                        name: localeTextFunc('cut', 'Cut'),
                        shortcut: localeTextFunc('ctrlX', 'Ctrl+X'),
                        icon: _createIconNoSpan('clipboardCut', this.gos, null),
                        disabled: !isEditable || this.gos.get('suppressCutToClipboard'),
                        action: () => this.clipboardSvc!.cutToClipboard(undefined, 'contextMenu'),
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
                        icon: _createIconNoSpan('clipboardPaste', this.gos, null),
                        action: () => this.clipboardSvc!.pasteFromClipboard(),
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
                    icon: _createIconNoSpan('save', this.gos, null),
                };
            }
            case 'csvExport':
                return {
                    name: localeTextFunc('csvExport', 'CSV Export'),
                    icon: _createIconNoSpan('csvExport', this.gos, null),
                    action: () => this.beans.csvCreator?.exportDataAsCsv(),
                };
            case 'excelExport':
                return {
                    name: localeTextFunc('excelExport', 'Excel Export'),
                    icon: _createIconNoSpan('excelExport', this.gos, null),
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
                        icon: _createIconNoSpan('filter', this.gos, null),
                        action: () =>
                            this.beans.menuSvc!.showFilterMenu({
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
                    icon: _createIconNoSpan('columns', this.gos, null),
                    action: () =>
                        this.columnChooserFactory?.showColumnChooser({ column, eventSource: sourceElement() }),
                };
            case 'sortAscending':
                return {
                    name: localeTextFunc('sortAscending', 'Sort Ascending'),
                    icon: _createIconNoSpan('sortAscending', this.gos, null),
                    action: () => this.sortSvc?.setSortForColumn(column!, 'asc', false, source),
                };
            case 'sortDescending':
                return {
                    name: localeTextFunc('sortDescending', 'Sort Descending'),
                    icon: _createIconNoSpan('sortDescending', this.gos, null),
                    action: () => this.sortSvc?.setSortForColumn(column!, 'desc', false, source),
                };
            case 'sortUnSort':
                return {
                    name: localeTextFunc('sortUnSort', 'Clear Sort'),
                    icon: _createIconNoSpan('sortUnSort', this.gos, null),
                    action: () => this.sortSvc?.setSortForColumn(column!, null, false, source),
                };
            default: {
                _warn(176, { key });
                return null;
            }
        }
    }

    private createAggregationSubMenu(column: AgColumn, aggFuncSvc: IAggFuncService): MenuItemDef[] {
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
            const funcNames = aggFuncSvc.getFuncNames(columnToUse);

            result.push({
                name: localeTextFunc('noAggregation', 'None'),
                disabled: !this.valueColsSvc,
                action: () => {
                    if (this.valueColsSvc) {
                        this.valueColsSvc.removeColumns([columnToUse!], 'contextMenu');
                        this.valueColsSvc.setColumnAggFunc!(columnToUse, undefined, 'contextMenu');
                    }
                },
                checked: !columnIsAlreadyAggValue,
            });

            funcNames.forEach((funcName) => {
                result.push({
                    name: localeTextFunc(funcName, aggFuncSvc.getDefaultFuncLabel(funcName)),
                    disabled: !this.valueColsSvc,
                    action: () => {
                        if (this.valueColsSvc) {
                            this.valueColsSvc.setColumnAggFunc!(columnToUse, funcName, 'contextMenu');
                            this.valueColsSvc.addColumns([columnToUse!], 'contextMenu');
                        }
                    },
                    checked: columnIsAlreadyAggValue && columnToUse!.getAggFunc() === funcName,
                });
            });
        }

        return result;
    }
}
