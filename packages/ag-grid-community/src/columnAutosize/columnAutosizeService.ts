import { dispatchColumnResizedEvent } from '../columns/columnEventUtils';
import type { ColKey, ColumnModel, Maybe } from '../columns/columnModel';
import { getWidthOfColsInList } from '../columns/columnUtils';
import type { VisibleColsService } from '../columns/visibleColsService';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { ColumnEventType } from '../events';
import type { ScrollVisibleService } from '../gridBodyComp/scrollVisibleService';
import type { HeaderGroupCellCtrl } from '../headerRendering/cells/columnGroup/headerGroupCellCtrl';
import type { IColumnLimit, ISizeColumnsToFitParams } from '../interfaces/autoSize';
import type { IRenderStatusService } from '../interfaces/renderStatusService';
import type { AnimationFrameService } from '../misc/animationFrameService';
import type { AutoWidthCalculator } from '../rendering/autoWidthCalculator';
import { _removeFromArray } from '../utils/array';
import { _getInnerWidth } from '../utils/dom';
import { _warn } from '../validation/logging';
import { TouchListener } from '../widgets/touchListener';

export class ColumnAutosizeService extends BeanStub implements NamedBean {
    beanName = 'colAutosize' as const;

    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private animationFrameSvc?: AnimationFrameService;
    private autoWidthCalculator: AutoWidthCalculator;
    private ctrlsSvc: CtrlsService;
    private renderStatus?: IRenderStatusService;
    private scrollVisibleSvc: ScrollVisibleService;

    private timesDelayed = 0;

    // when we're waiting for cell data types to be inferred, we need to defer column resizing
    public shouldQueueResizeOperations: boolean = false;
    private resizeOperationQueue: (() => void)[] = [];

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.animationFrameSvc = beans.animationFrameSvc;
        this.autoWidthCalculator = beans.autoWidthCalculator!;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.renderStatus = beans.renderStatus;
        this.scrollVisibleSvc = beans.scrollVisibleSvc;
    }

    public postConstruct(): void {
        this.addManagedEventListeners({ firstDataRendered: () => this.onFirstDataRendered() });
    }

    public autoSizeCols(params: {
        colKeys: ColKey[];
        skipHeader?: boolean;
        skipHeaderGroups?: boolean;
        stopAtGroup?: AgColumnGroup;
        source?: ColumnEventType;
    }): void {
        if (this.shouldQueueResizeOperations) {
            this.pushResizeOperation(() => this.autoSizeCols(params));
            return;
        }

        const { colKeys, skipHeader, skipHeaderGroups, stopAtGroup, source = 'api' } = params;
        // because of column virtualisation, we can only do this function on columns that are
        // actually rendered, as non-rendered columns (outside the viewport and not rendered
        // due to column virtualisation) are not present. this can result in all rendered columns
        // getting narrowed, which in turn introduces more rendered columns on the RHS which
        // did not get autosized in the original run, leaving the visible grid with columns on
        // the LHS sized, but RHS no. so we keep looping through the visible columns until
        // no more cols are available (rendered) to be resized

        // we autosize after animation frames finish in case any cell renderers need to complete first. this can
        // happen eg if client code is calling api.autoSizeAllColumns() straight after grid is initialised, but grid
        // hasn't fully drawn out all the cells yet (due to cell renderers in animation frames).
        this.animationFrameSvc?.flushAllFrames();

        if (this.timesDelayed < 5 && this.renderStatus && !this.renderStatus.areHeaderCellsRendered()) {
            // This is needed for React, as it doesn't render the headers synchronously all the time.
            // Added a defensive check to avoid infinite loop in case headers are never rendered.
            this.timesDelayed++;
            setTimeout(() => {
                if (this.isAlive()) {
                    this.autoSizeCols(params);
                }
            });
            return;
        }
        this.timesDelayed = 0;

        // keep track of which cols we have resized in here
        const columnsAutosized: AgColumn[] = [];
        // initialise with anything except 0 so that while loop executes at least once
        let changesThisTimeAround = -1;

        const shouldSkipHeader = skipHeader != null ? skipHeader : this.gos.get('skipHeaderOnAutoSize');
        const shouldSkipHeaderGroups = skipHeaderGroups != null ? skipHeaderGroups : shouldSkipHeader;

        while (changesThisTimeAround !== 0) {
            changesThisTimeAround = 0;

            const updatedColumns: AgColumn[] = [];

            colKeys.forEach((key) => {
                if (!key) {
                    return;
                }
                const column = this.colModel.getCol(key);
                if (!column) {
                    return;
                }

                // if already autosized, skip it
                if (columnsAutosized.indexOf(column) >= 0) {
                    return;
                }

                // get how wide this col should be
                const preferredWidth = this.autoWidthCalculator.getPreferredWidthForColumn(column, shouldSkipHeader);

                // preferredWidth = -1 if this col is not on the screen
                if (preferredWidth > 0) {
                    const newWidth = this.normaliseColumnWidth(column, preferredWidth);
                    column.setActualWidth(newWidth, source);
                    columnsAutosized.push(column);
                    changesThisTimeAround++;
                }

                updatedColumns.push(column);
            });

            if (!updatedColumns.length) {
                continue;
            }

            this.visibleCols.refresh(source);
        }

        if (!shouldSkipHeaderGroups) {
            this.autoSizeColumnGroupsByColumns(colKeys, source, stopAtGroup);
        }

        dispatchColumnResizedEvent(this.eventSvc, columnsAutosized, true, 'autosizeColumns');
    }

    public autoSizeColumn(key: Maybe<ColKey>, source: ColumnEventType, skipHeader?: boolean): void {
        if (key) {
            this.autoSizeCols({ colKeys: [key], skipHeader, skipHeaderGroups: true, source });
        }
    }

    private autoSizeColumnGroupsByColumns(
        keys: ColKey[],
        source: ColumnEventType,
        stopAtGroup?: AgColumnGroup
    ): AgColumn[] {
        const columnGroups: Set<AgColumnGroup> = new Set();
        const columns = this.colModel.getColsForKeys(keys);

        columns.forEach((col) => {
            let parent: AgColumnGroup | null = col.getParent();
            while (parent && parent != stopAtGroup) {
                if (!parent.isPadding()) {
                    columnGroups.add(parent);
                }
                parent = parent.getParent();
            }
        });

        let headerGroupCtrl: HeaderGroupCellCtrl | undefined;

        const resizedColumns: AgColumn[] = [];

        for (const columnGroup of columnGroups) {
            for (const headerContainerCtrl of this.ctrlsSvc.getHeaderRowContainerCtrls()) {
                headerGroupCtrl = headerContainerCtrl.getHeaderCtrlForColumn(columnGroup) as
                    | HeaderGroupCellCtrl
                    | undefined;
                if (headerGroupCtrl) {
                    break;
                }
            }
            if (headerGroupCtrl) {
                headerGroupCtrl.resizeLeafColumnsToFit(source);
            }
        }

        return resizedColumns;
    }

    public autoSizeAllColumns(source: ColumnEventType, skipHeader?: boolean): void {
        if (this.shouldQueueResizeOperations) {
            this.pushResizeOperation(() => this.autoSizeAllColumns(source, skipHeader));
            return;
        }

        const allDisplayedColumns = this.visibleCols.allCols;
        this.autoSizeCols({ colKeys: allDisplayedColumns, skipHeader, source });
    }

    public addColumnAutosize(element: HTMLElement, column: AgColumn): () => void {
        const skipHeaderOnAutoSize = this.gos.get('skipHeaderOnAutoSize');

        const autoSizeColListener = () => {
            this.autoSizeColumn(column, 'uiColumnResized', skipHeaderOnAutoSize);
        };

        element.addEventListener('dblclick', autoSizeColListener);
        const touchListener: TouchListener = new TouchListener(element);
        touchListener.addEventListener('doubleTap', autoSizeColListener);

        return () => {
            element.removeEventListener('dblclick', autoSizeColListener);
            touchListener.removeEventListener('doubleTap', autoSizeColListener);
            touchListener.destroy();
        };
    }

    public addColumnGroupResize(element: HTMLElement, columnGroup: AgColumnGroup, callback: () => void): () => void {
        const skipHeaderOnAutoSize = this.gos.get('skipHeaderOnAutoSize');

        const listener = () => {
            // get list of all the column keys we are responsible for
            const keys: string[] = [];
            const leafCols = columnGroup.getDisplayedLeafColumns();

            leafCols.forEach((column) => {
                // not all cols in the group may be participating with auto-resize
                if (!column.getColDef().suppressAutoSize) {
                    keys.push(column.getColId());
                }
            });

            if (keys.length > 0) {
                this.autoSizeCols({
                    colKeys: keys,
                    skipHeader: skipHeaderOnAutoSize,
                    stopAtGroup: columnGroup,
                    source: 'uiColumnResized',
                });
            }

            callback();
        };

        element.addEventListener('dblclick', listener);

        return () => element.removeEventListener('dblclick', listener);
    }

    // method will call itself if no available width. this covers if the grid
    // isn't visible, but is just about to be visible.
    public sizeColumnsToFitGridBody(params?: ISizeColumnsToFitParams, nextTimeout?: number): void {
        if (!this.isAlive()) {
            return;
        }

        const gridBodyCtrl = this.ctrlsSvc.getGridBodyCtrl();
        const removeScrollWidth = gridBodyCtrl.isVerticalScrollShowing();
        const scrollWidthToRemove = removeScrollWidth ? this.scrollVisibleSvc.getScrollbarWidth() : 0;
        // bodyViewportWidth should be calculated from eGridBody, not eBodyViewport
        // because we change the width of the bodyViewport to hide the real browser scrollbar
        const bodyViewportWidth = _getInnerWidth(gridBodyCtrl.getGridBodyElement());
        const availableWidth = bodyViewportWidth - scrollWidthToRemove;

        if (availableWidth > 0) {
            this.sizeColumnsToFit(availableWidth, 'sizeColumnsToFit', false, params);
            return;
        }

        if (nextTimeout === undefined) {
            window.setTimeout(() => {
                this.sizeColumnsToFitGridBody(params, 100);
            }, 0);
        } else if (nextTimeout === 100) {
            window.setTimeout(() => {
                this.sizeColumnsToFitGridBody(params, 500);
            }, 100);
        } else if (nextTimeout === 500) {
            window.setTimeout(() => {
                this.sizeColumnsToFitGridBody(params, -1);
            }, 500);
        } else {
            // Grid coming back with zero width, maybe the grid is not visible yet on the screen?
            _warn(29);
        }
    }

    // called from api
    public sizeColumnsToFit(
        gridWidth: any,
        source: ColumnEventType = 'sizeColumnsToFit',
        silent?: boolean,
        params?: ISizeColumnsToFitParams
    ): void {
        if (this.shouldQueueResizeOperations) {
            this.pushResizeOperation(() => this.sizeColumnsToFit(gridWidth, source, silent, params));
            return;
        }

        const limitsMap: { [colId: string]: Omit<IColumnLimit, 'key'> } = {};
        if (params) {
            params?.columnLimits?.forEach(({ key, ...dimensions }) => {
                limitsMap[typeof key === 'string' ? key : key.getColId()] = dimensions;
            });
        }

        // avoid divide by zero
        const allDisplayedColumns = this.visibleCols.allCols;

        const doColumnsAlreadyFit = gridWidth === getWidthOfColsInList(allDisplayedColumns);
        if (gridWidth <= 0 || !allDisplayedColumns.length || doColumnsAlreadyFit) {
            return;
        }

        const colsToSpread: AgColumn[] = [];
        const colsToNotSpread: AgColumn[] = [];

        allDisplayedColumns.forEach((column) => {
            if (column.getColDef().suppressSizeToFit === true) {
                colsToNotSpread.push(column);
            } else {
                colsToSpread.push(column);
            }
        });

        // make a copy of the cols that are going to be resized
        const colsToDispatchEventFor = colsToSpread.slice(0);
        let finishedResizing = false;

        const moveToNotSpread = (column: AgColumn) => {
            _removeFromArray(colsToSpread, column);
            colsToNotSpread.push(column);
        };

        // resetting cols to their original width makes the sizeColumnsToFit more deterministic,
        // rather than depending on the current size of the columns. most users call sizeColumnsToFit
        // immediately after grid is created, so will make no difference. however if application is calling
        // sizeColumnsToFit repeatedly (eg after column group is opened / closed repeatedly) we don't want
        // the columns to start shrinking / growing over time.
        //
        // NOTE: the process below will assign values to `this.actualWidth` of each column without firing events
        // for this reason we need to manually dispatch resize events after the resize has been done for each column.
        colsToSpread.forEach((column) => {
            column.resetActualWidth(source);

            const widthOverride = limitsMap?.[column.getId()];
            const minOverride = widthOverride?.minWidth ?? params?.defaultMinWidth;
            const maxOverride = widthOverride?.maxWidth ?? params?.defaultMaxWidth;

            const colWidth = column.getActualWidth();
            if (typeof minOverride === 'number' && colWidth < minOverride) {
                column.setActualWidth(minOverride, source, true);
            } else if (typeof maxOverride === 'number' && colWidth > maxOverride) {
                column.setActualWidth(maxOverride, source, true);
            }
        });

        while (!finishedResizing) {
            finishedResizing = true;
            const availablePixels = gridWidth - getWidthOfColsInList(colsToNotSpread);
            if (availablePixels <= 0) {
                // no width, set everything to minimum
                colsToSpread.forEach((column) => {
                    const widthOverride = limitsMap?.[column.getId()]?.minWidth ?? params?.defaultMinWidth;
                    if (typeof widthOverride === 'number') {
                        column.setActualWidth(widthOverride, source, true);
                        return;
                    }
                    column.setMinimum(source);
                });
            } else {
                const scale = availablePixels / getWidthOfColsInList(colsToSpread);
                // we set the pixels for the last col based on what's left, as otherwise
                // we could be a pixel or two short or extra because of rounding errors.
                let pixelsForLastCol = availablePixels;
                // backwards through loop, as we are removing items as we go
                for (let i = colsToSpread.length - 1; i >= 0; i--) {
                    const column = colsToSpread[i];

                    const widthOverride = limitsMap?.[column.getId()];
                    const minOverride = widthOverride?.minWidth ?? params?.defaultMinWidth;
                    const maxOverride = widthOverride?.maxWidth ?? params?.defaultMaxWidth;
                    const colMinWidth = column.getMinWidth();
                    const colMaxWidth = column.getMaxWidth();
                    const minWidth =
                        typeof minOverride === 'number' && minOverride > colMinWidth ? minOverride : colMinWidth;
                    const maxWidth =
                        typeof maxOverride === 'number' && maxOverride < colMaxWidth ? maxOverride : colMaxWidth;
                    let newWidth = Math.round(column.getActualWidth() * scale);

                    if (newWidth < minWidth) {
                        newWidth = minWidth;
                        moveToNotSpread(column);
                        finishedResizing = false;
                    } else if (newWidth > maxWidth) {
                        newWidth = maxWidth;
                        moveToNotSpread(column);
                        finishedResizing = false;
                    } else if (i === 0) {
                        // if this is the last column
                        newWidth = pixelsForLastCol;
                    }

                    column.setActualWidth(newWidth, source, true);
                    pixelsForLastCol -= newWidth;
                }
            }
        }

        // see notes above
        colsToDispatchEventFor.forEach((col) => {
            col.fireColumnWidthChangedEvent(source);
        });

        this.visibleCols.setLeftValues(source);
        this.visibleCols.updateBodyWidths();

        if (silent) {
            return;
        }

        dispatchColumnResizedEvent(this.eventSvc, colsToDispatchEventFor, true, source);
    }

    public applyAutosizeStrategy(): void {
        const autoSizeStrategy = this.gos.get('autoSizeStrategy');
        if (!autoSizeStrategy) {
            return;
        }

        const { type } = autoSizeStrategy;
        // ensure things like aligned grids have linked first
        setTimeout(() => {
            if (type === 'fitGridWidth') {
                const { columnLimits: propColumnLimits, defaultMinWidth, defaultMaxWidth } = autoSizeStrategy;
                const columnLimits = propColumnLimits?.map(({ colId: key, minWidth, maxWidth }) => ({
                    key,
                    minWidth,
                    maxWidth,
                }));
                this.sizeColumnsToFitGridBody({
                    defaultMinWidth,
                    defaultMaxWidth,
                    columnLimits,
                });
            } else if (type === 'fitProvidedWidth') {
                this.sizeColumnsToFit(autoSizeStrategy.width, 'sizeColumnsToFit');
            }
        });
    }

    // returns the width we can set to this col, taking into consideration min and max widths
    private normaliseColumnWidth(column: AgColumn, newWidth: number): number {
        const minWidth = column.getMinWidth();

        if (newWidth < minWidth) {
            newWidth = minWidth;
        }

        const maxWidth = column.getMaxWidth();
        if (column.isGreaterThanMax(newWidth)) {
            newWidth = maxWidth;
        }

        return newWidth;
    }

    private onFirstDataRendered(): void {
        const autoSizeStrategy = this.gos.get('autoSizeStrategy');
        if (autoSizeStrategy?.type !== 'fitCellContents') {
            return;
        }

        const { colIds: columns, skipHeader } = autoSizeStrategy;
        // ensure render has finished
        setTimeout(() => {
            if (columns) {
                this.autoSizeCols({
                    colKeys: columns,
                    skipHeader,
                    source: 'autosizeColumns',
                });
            } else {
                this.autoSizeAllColumns('autosizeColumns', skipHeader);
            }
        });
    }

    public processResizeOperations(): void {
        this.shouldQueueResizeOperations = false;
        this.resizeOperationQueue.forEach((resizeOperation) => resizeOperation());
        this.resizeOperationQueue = [];
    }

    public pushResizeOperation(func: () => void): void {
        this.resizeOperationQueue.push(func);
    }

    public override destroy(): void {
        this.resizeOperationQueue.length = 0;
        super.destroy();
    }
}
