import type {
    AgColumn,
    ColumnEventType,
    DefaultMenuItem,
    IAggFuncService,
    IColsService,
    LocaleTextFunc,
    MenuItemDef,
    NamedBean,
} from 'ag-grid-community';
import {
    BeanStub,
    _createIconNoSpan,
    _escapeString,
    _exists,
    _getRowNode,
    _resetColumnState,
    _warn,
} from 'ag-grid-community';

import { isRowGroupColLocked } from '../rowGrouping/rowGroupingUtils';
import type { ChartMenuItemMapper } from './chartMenuItemMapper';
import type { ColumnChooserFactory } from './columnChooserFactory';

export const MENU_ITEM_SEPARATOR = 'separator';

export function _removeRepeatsFromArray<T>(array: T[], object: T) {
    if (!array) {
        return;
    }

    for (let index = array.length - 2; index >= 0; index--) {
        const thisOneMatches = array[index] === object;
        const nextOneMatches = array[index + 1] === object;

        if (thisOneMatches && nextOneMatches) {
            array.splice(index + 1, 1);
        }
    }
}

export class MenuItemMapper extends BeanStub implements NamedBean {
    beanName = 'menuItemMapper' as const;

    public mapWithStockItems(
        originalList: (MenuItemDef | DefaultMenuItem)[],
        column: AgColumn | null,
        sourceElement: () => HTMLElement,
        source: ColumnEventType
    ): (MenuItemDef | 'separator')[] {
        if (!originalList) {
            return [];
        }

        const resultList: (MenuItemDef | 'separator')[] = [];

        const localeTextFunc = this.getLocaleTextFunc();
        const { beans, gos } = this;
        const {
            validation,
            pinnedCols,
            colAutosize,
            aggFuncSvc,
            rowGroupColsSvc,
            colNames,
            colModel,
            clipboardSvc,
            expansionSvc,
            focusSvc,
            csvCreator,
            excelCreator,
            menuSvc,
            colChooserFactory,
            sortSvc,
            chartMenuItemMapper,
            valueColsSvc,
        } = beans;

        const getStockMenuItem = (
            key: DefaultMenuItem,
            column: AgColumn | null,
            sourceElement: () => HTMLElement,
            source: ColumnEventType
        ): MenuItemDef | 'separator' | null => {
            validation?.validateMenuItem(key);

            switch (key) {
                case 'pinSubMenu':
                    return pinnedCols && column
                        ? {
                              name: localeTextFunc('pinColumn', 'Pin Column'),
                              icon: _createIconNoSpan('menuPin', beans, null),
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
                    if (aggFuncSvc && valueColsSvc && (column?.isPrimary() || column?.getColDef().pivotValueColumn)) {
                        return {
                            name: localeTextFunc('valueAggregation', 'Value Aggregation'),
                            icon: _createIconNoSpan('menuValue', beans, null),
                            subMenu: createAggregationSubMenu(column!, aggFuncSvc, valueColsSvc, localeTextFunc),
                            disabled: gos.get('functionsReadOnly'),
                        };
                    } else {
                        return null;
                    }
                case 'autoSizeThis':
                    return colAutosize
                        ? {
                              name: localeTextFunc('autosizeThisColumn', 'Autosize This Column'),
                              action: () => colAutosize.autoSizeColumn(column, source, gos.get('skipHeaderOnAutoSize')),
                          }
                        : null;
                case 'autoSizeAll':
                    return colAutosize
                        ? {
                              name: localeTextFunc('autosizeAllColumns', 'Autosize All Columns'),
                              action: () => colAutosize.autoSizeAllColumns(source, gos.get('skipHeaderOnAutoSize')),
                          }
                        : null;
                case 'rowGroup':
                    return rowGroupColsSvc
                        ? {
                              name:
                                  localeTextFunc('groupBy', 'Group by') +
                                  ' ' +
                                  _escapeString(colNames.getDisplayNameForColumn(column, 'header')),
                              disabled:
                                  gos.get('functionsReadOnly') ||
                                  column?.isRowGroupActive() ||
                                  !column?.getColDef().enableRowGroup,
                              action: () => rowGroupColsSvc.addColumns([column], source),
                              icon: _createIconNoSpan('menuAddRowGroup', beans, null),
                          }
                        : null;
                case 'rowUnGroup': {
                    if (rowGroupColsSvc && gos.isModuleRegistered('SharedRowGrouping')) {
                        const showRowGroup = column?.getColDef().showRowGroup;
                        const lockedGroups = gos.get('groupLockGroupColumns');
                        let name: string;
                        let disabled: boolean;
                        let action: () => void;
                        // Handle single auto group column
                        if (showRowGroup === true) {
                            name = localeTextFunc('ungroupAll', 'Un-Group All');
                            disabled =
                                gos.get('functionsReadOnly') ||
                                lockedGroups === -1 ||
                                lockedGroups >= (rowGroupColsSvc.columns.length ?? 0);
                            action = () =>
                                rowGroupColsSvc.setColumns(rowGroupColsSvc.columns.slice(0, lockedGroups), source);
                        } else if (typeof showRowGroup === 'string') {
                            // Handle multiple auto group columns
                            const underlyingColumn = colModel.getColDefCol(showRowGroup);
                            const ungroupByName =
                                underlyingColumn != null
                                    ? _escapeString(colNames.getDisplayNameForColumn(underlyingColumn, 'header'))
                                    : showRowGroup;
                            name = localeTextFunc('ungroupBy', 'Un-Group by') + ' ' + ungroupByName;
                            disabled = gos.get('functionsReadOnly') || isRowGroupColLocked(underlyingColumn, beans);
                            action = () => {
                                rowGroupColsSvc.removeColumns([showRowGroup], source);
                            };
                        } else {
                            // Handle primary column
                            name =
                                localeTextFunc('ungroupBy', 'Un-Group by') +
                                ' ' +
                                _escapeString(colNames.getDisplayNameForColumn(column, 'header'));
                            disabled =
                                gos.get('functionsReadOnly') ||
                                !column?.isRowGroupActive() ||
                                !column?.getColDef().enableRowGroup ||
                                isRowGroupColLocked(column, beans);
                            action = () => rowGroupColsSvc.removeColumns([column], source);
                        }
                        return {
                            name,
                            disabled,
                            action,
                            icon: _createIconNoSpan('menuRemoveRowGroup', beans, null),
                        };
                    } else {
                        return null;
                    }
                }
                case 'resetColumns':
                    return {
                        name: localeTextFunc('resetColumns', 'Reset Columns'),
                        action: () => _resetColumnState(beans, source),
                    };
                case 'expandAll':
                    return expansionSvc
                        ? {
                              name: localeTextFunc('expandAll', 'Expand All Row Groups'),
                              action: () => expansionSvc.expandAll(true),
                          }
                        : null;
                case 'contractAll':
                    return expansionSvc
                        ? {
                              name: localeTextFunc('collapseAll', 'Collapse All Row Groups'),
                              action: () => expansionSvc.expandAll(false),
                          }
                        : null;
                case 'copy':
                    return clipboardSvc
                        ? {
                              name: localeTextFunc('copy', 'Copy'),
                              shortcut: localeTextFunc('ctrlC', 'Ctrl+C'),
                              icon: _createIconNoSpan('clipboardCopy', beans, null),
                              action: () => clipboardSvc.copyToClipboard(),
                          }
                        : null;
                case 'copyWithHeaders':
                    return clipboardSvc
                        ? {
                              name: localeTextFunc('copyWithHeaders', 'Copy with Headers'),
                              // shortcut: localeTextFunc('ctrlC','Ctrl+C'),
                              icon: _createIconNoSpan('clipboardCopy', beans, null),
                              action: () => clipboardSvc.copyToClipboard({ includeHeaders: true }),
                          }
                        : null;
                case 'copyWithGroupHeaders':
                    return clipboardSvc
                        ? {
                              name: localeTextFunc('copyWithGroupHeaders', 'Copy with Group Headers'),
                              // shortcut: localeTextFunc('ctrlC','Ctrl+C'),
                              icon: _createIconNoSpan('clipboardCopy', beans, null),
                              action: () =>
                                  clipboardSvc.copyToClipboard({ includeHeaders: true, includeGroupHeaders: true }),
                          }
                        : null;
                case 'cut':
                    if (clipboardSvc) {
                        const focusedCell = focusSvc.getFocusedCell();
                        const rowNode = focusedCell ? _getRowNode(beans, focusedCell) : null;
                        const isEditable = rowNode ? focusedCell?.column.isCellEditable(rowNode) : false;
                        return {
                            name: localeTextFunc('cut', 'Cut'),
                            shortcut: localeTextFunc('ctrlX', 'Ctrl+X'),
                            icon: _createIconNoSpan('clipboardCut', beans, null),
                            disabled: !isEditable || gos.get('suppressCutToClipboard'),
                            action: () => clipboardSvc.cutToClipboard(undefined, 'contextMenu'),
                        };
                    } else {
                        return null;
                    }
                case 'paste':
                    return clipboardSvc
                        ? {
                              name: localeTextFunc('paste', 'Paste'),
                              shortcut: localeTextFunc('ctrlV', 'Ctrl+V'),
                              disabled: true,
                              icon: _createIconNoSpan('clipboardPaste', beans, null),
                              action: () => clipboardSvc.pasteFromClipboard(),
                          }
                        : null;
                case 'export': {
                    const exportSubMenuItems: string[] = [];

                    if (!gos.get('suppressCsvExport') && csvCreator) {
                        exportSubMenuItems.push('csvExport');
                    }
                    if (!gos.get('suppressExcelExport') && excelCreator) {
                        exportSubMenuItems.push('excelExport');
                    }
                    return exportSubMenuItems.length
                        ? {
                              name: localeTextFunc('export', 'Export'),
                              subMenu: exportSubMenuItems,
                              icon: _createIconNoSpan('save', beans, null),
                          }
                        : null;
                }
                case 'csvExport':
                    return csvCreator
                        ? {
                              name: localeTextFunc('csvExport', 'CSV Export'),
                              icon: _createIconNoSpan('csvExport', beans, null),
                              action: () => csvCreator.exportDataAsCsv(),
                          }
                        : null;
                case 'excelExport':
                    return excelCreator
                        ? {
                              name: localeTextFunc('excelExport', 'Excel Export'),
                              icon: _createIconNoSpan('excelExport', beans, null),
                              action: () => excelCreator.exportDataAsExcel(),
                          }
                        : null;
                case 'separator':
                    return 'separator';
                case 'pivotChart':
                case 'chartRange':
                    return (chartMenuItemMapper as ChartMenuItemMapper).getChartItems(key);
                case 'columnFilter':
                    return menuSvc && column
                        ? {
                              name: localeTextFunc('columnFilter', 'Column Filter'),
                              icon: _createIconNoSpan('filter', beans, null),
                              action: () =>
                                  menuSvc.showFilterMenu({
                                      column,
                                      buttonElement: sourceElement(),
                                      containerType: 'columnFilter',
                                      positionBy: 'button',
                                  }),
                          }
                        : null;
                case 'columnChooser':
                    return colChooserFactory
                        ? {
                              name: localeTextFunc('columnChooser', 'Choose Columns'),
                              icon: _createIconNoSpan('columns', beans, null),
                              action: () =>
                                  (colChooserFactory as ColumnChooserFactory).showColumnChooser({
                                      column,
                                      eventSource: sourceElement(),
                                  }),
                          }
                        : null;
                case 'sortAscending':
                    return sortSvc
                        ? {
                              name: localeTextFunc('sortAscending', 'Sort Ascending'),
                              icon: _createIconNoSpan('sortAscending', beans, null),
                              action: () => sortSvc.setSortForColumn(column!, 'asc', false, source),
                          }
                        : null;
                case 'sortDescending':
                    return sortSvc
                        ? {
                              name: localeTextFunc('sortDescending', 'Sort Descending'),
                              icon: _createIconNoSpan('sortDescending', beans, null),
                              action: () => sortSvc.setSortForColumn(column!, 'desc', false, source),
                          }
                        : null;
                case 'sortUnSort':
                    return sortSvc
                        ? {
                              name: localeTextFunc('sortUnSort', 'Clear Sort'),
                              icon: _createIconNoSpan('sortUnSort', beans, null),
                              action: () => sortSvc.setSortForColumn(column!, null, false, source),
                          }
                        : null;
                default: {
                    _warn(176, { key });
                    return null;
                }
            }
        };

        originalList.forEach((menuItemOrString) => {
            let result: MenuItemDef | 'separator' | null;

            if (typeof menuItemOrString === 'string') {
                result = getStockMenuItem(menuItemOrString as DefaultMenuItem, column, sourceElement, source);
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
                resultDef.subMenu = this.mapWithStockItems(
                    subMenu as (DefaultMenuItem | MenuItemDef)[],
                    column,
                    sourceElement,
                    source
                );
            }

            if (result != null) {
                resultList.push(result);
            }
        });

        // items could have been removed due to missing modules
        _removeRepeatsFromArray(resultList, MENU_ITEM_SEPARATOR);

        return resultList;
    }
}
function createAggregationSubMenu(
    column: AgColumn,
    aggFuncSvc: IAggFuncService,
    valueColsSvc: IColsService,
    localeTextFunc: LocaleTextFunc
): MenuItemDef[] {
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
            action: () => {
                valueColsSvc.removeColumns([columnToUse!], 'contextMenu');
                valueColsSvc.setColumnAggFunc!(columnToUse, undefined, 'contextMenu');
            },
            checked: !columnIsAlreadyAggValue,
        });

        funcNames.forEach((funcName) => {
            result.push({
                name: localeTextFunc(funcName, aggFuncSvc.getDefaultFuncLabel(funcName)),
                action: () => {
                    valueColsSvc.setColumnAggFunc!(columnToUse, funcName, 'contextMenu');
                    valueColsSvc.addColumns([columnToUse!], 'contextMenu');
                },
                checked: columnIsAlreadyAggValue && columnToUse!.getAggFunc() === funcName,
            });
        });
    }

    return result;
}
