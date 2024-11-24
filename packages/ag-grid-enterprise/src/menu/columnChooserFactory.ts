import type { AgColumn, ColumnChooserParams, NamedBean } from 'ag-grid-community';
import { BeanStub, _findNextFocusableElement } from 'ag-grid-community';

import { AgPrimaryCols } from '../columnToolPanel/agPrimaryCols';
import { AgDialog } from '../widgets/agDialog';
import type { MenuUtils } from './menuUtils';

interface ShowColumnChooserParams {
    column?: AgColumn | null;
    chooserParams?: ColumnChooserParams;
    eventSource?: HTMLElement;
}

export class ColumnChooserFactory extends BeanStub implements NamedBean {
    beanName = 'colChooserFactory' as const;

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
        const beans = this.beans;
        const { visibleCols, focusSvc, menuUtils } = beans;
        const columnIndex = visibleCols.allCols.indexOf(column as AgColumn);
        const headerPosition = column ? focusSvc.focusedHeader : null;

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
                    _findNextFocusableElement(beans, columnSelectPanel.getGui())?.focus({
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
                        (menuUtils as MenuUtils).restoreFocusOnClose(
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
        this.destroyBean(this.activeColumnChooserDialog);
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
