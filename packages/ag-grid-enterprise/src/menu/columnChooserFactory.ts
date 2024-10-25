import type {
    AgColumn,
    BeanCollection,
    ColumnChooserParams,
    FocusService,
    NamedBean,
    VisibleColsService,
} from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import { AgPrimaryCols } from '../columnToolPanel/agPrimaryCols';
import { AgDialog } from '../widgets/agDialog';
import type { MenuUtils } from './menuUtils';

interface ShowColumnChooserParams {
    column?: AgColumn | null;
    chooserParams?: ColumnChooserParams;
    eventSource?: HTMLElement;
}

export class ColumnChooserFactory extends BeanStub implements NamedBean {
    beanName = 'columnChooserFactory' as const;

    private focusSvc: FocusService;
    private menuUtils: MenuUtils;
    private visibleCols: VisibleColsService;

    public wireBeans(beans: BeanCollection) {
        this.focusSvc = beans.focusSvc;
        this.menuUtils = beans.menuUtils as MenuUtils;
        this.visibleCols = beans.visibleCols;
    }

    private activeColumnChooser: AgPrimaryCols | undefined;
    private activeColumnChooserDialog: AgDialog | undefined;

    public createColumnSelectPanel(
        parent: BeanStub<any>,
        column?: AgColumn | null,
        draggable?: boolean,
        params?: ColumnChooserParams
    ): AgPrimaryCols {
        const columnSelectPanel = parent.createManagedBean(new AgPrimaryCols());

        const columnChooserParams = params ?? column?.getColDef().columnChooserParams ?? {};

        const {
            contractColumnSelection,
            suppressColumnExpandAll,
            suppressColumnFilter,
            suppressColumnSelectAll,
            suppressSyncLayoutWithGrid,
            columnLayout,
        } = columnChooserParams;

        columnSelectPanel.init(
            !!draggable,
            this.gos.addGridCommonParams({
                suppressColumnMove: false,
                suppressValues: false,
                suppressPivots: false,
                suppressRowGroups: false,
                suppressPivotMode: false,
                contractColumnSelection: !!contractColumnSelection,
                suppressColumnExpandAll: !!suppressColumnExpandAll,
                suppressColumnFilter: !!suppressColumnFilter,
                suppressColumnSelectAll: !!suppressColumnSelectAll,
                suppressSyncLayoutWithGrid: !!columnLayout || !!suppressSyncLayoutWithGrid,
                onStateUpdated: () => {},
            }),
            'columnMenu'
        );

        if (columnLayout) {
            columnSelectPanel.setColumnLayout(columnLayout);
        }

        return columnSelectPanel;
    }

    public showColumnChooser({ column, chooserParams, eventSource }: ShowColumnChooserParams): void {
        this.hideActiveColumnChooser();

        const columnSelectPanel = this.createColumnSelectPanel(this, column, true, chooserParams);
        const translate = this.getLocaleTextFunc();
        const columnIndex = this.visibleCols.allCols.indexOf(column as AgColumn);
        const headerPosition = column ? this.focusSvc.getFocusedHeader() : null;

        this.activeColumnChooserDialog = this.createBean(
            new AgDialog({
                title: translate('chooseColumns', 'Choose Columns'),
                component: columnSelectPanel,
                width: 300,
                height: 300,
                resizable: true,
                movable: true,
                centered: true,
                closable: true,
                afterGuiAttached: () => {
                    this.focusSvc.findNextFocusableElement(columnSelectPanel.getGui())?.focus({
                        preventScroll: true,
                    });
                    this.dispatchVisibleChangedEvent(true, column);
                },
                closedCallback: (event) => {
                    const eComp = this.activeColumnChooser!.getGui();
                    this.destroyBean(this.activeColumnChooser);
                    this.activeColumnChooser = undefined;
                    this.activeColumnChooserDialog = undefined;
                    this.dispatchVisibleChangedEvent(false, column);
                    if (column) {
                        this.menuUtils.restoreFocusOnClose(
                            { column, headerPosition, columnIndex, eventSource },
                            eComp,
                            event,
                            true
                        );
                    }
                },
                postProcessPopupParams: {
                    type: 'columnChooser',
                    column,
                    eventSource,
                },
            })
        );

        this.activeColumnChooser = columnSelectPanel;
    }

    public hideActiveColumnChooser(): void {
        if (this.activeColumnChooserDialog) {
            this.destroyBean(this.activeColumnChooserDialog);
        }
    }

    private dispatchVisibleChangedEvent(visible: boolean, column?: AgColumn | null): void {
        this.eventSvc.dispatchEvent({
            type: 'columnMenuVisibleChanged',
            visible,
            switchingTab: false,
            key: 'columnChooser',
            column: column ?? null,
        });
    }
}
