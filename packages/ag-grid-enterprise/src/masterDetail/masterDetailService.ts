import type {
    BeanCollection,
    BeanName,
    FuncColsService,
    IMasterDetailService,
    IRowModel,
    NamedBean,
    RowCtrl,
    RowDataUpdatedEvent,
    RowNodeTransaction,
} from 'ag-grid-community';
import { RowNode, _exists } from 'ag-grid-community';
import {
    BeanStub,
    _getClientSideRowModel,
    _isClientSideRowModel,
    _isServerSideRowModel,
    _observeResize,
} from 'ag-grid-community';

export class MasterDetailService extends BeanStub implements NamedBean, IMasterDetailService {
    beanName: BeanName = 'masterDetailSvc' as const;

    private enabled: boolean;
    private rowModel: IRowModel;
    private funcColsSvc: FuncColsService;

    private isEnabled(): boolean {
        const gos = this.gos;
        return (
            gos.get('masterDetail') &&
            // TODO: AG-1752: [Tree Data] Allow tree data leaf rows to serve as master rows for detail grids (Tree Data hosting Master/Detail)"
            !gos.get('treeData')
        );
    }

    public wireBeans(beans: BeanCollection): void {
        this.funcColsSvc = beans.funcColsSvc;
        this.rowModel = beans.rowModel;
    }

    public postConstruct(): void {
        if (_isClientSideRowModel(this.gos)) {
            this.enabled = this.isEnabled();
            this.addManagedPropertyListeners(['treeData', 'masterDetail'], this.enabledUpdated.bind(this));
            this.addManagedEventListeners({ rowDataUpdated: this.rowDataUpdated.bind(this) });
        }
    }

    private enabledUpdated() {
        const enabled = this.isEnabled();
        if (this.enabled !== enabled) {
            if (this.setMasters(null)) {
                _getClientSideRowModel(this.beans)?.refreshModel({ step: 'map' });
            }
        }
    }

    private rowDataUpdated({ transactions }: RowDataUpdatedEvent) {
        this.setMasters(transactions);
    }

    private setMasters(transactions: RowNodeTransaction[] | null | undefined): boolean {
        const enabled = this.isEnabled();
        this.enabled = enabled;

        const gos = this.gos;
        const isRowMaster = gos.get('isRowMaster');
        const groupDefaultExpanded = gos.get('groupDefaultExpanded');
        let rowsChanged = false;

        const setMaster = (row: RowNode, created: boolean, updated: boolean) => {
            const oldMaster = row.master;

            let newMaster = enabled;

            if (enabled) {
                if (created || updated) {
                    if (isRowMaster) {
                        const data = row.data;
                        newMaster = !!data && !!isRowMaster(data);
                    }
                } else {
                    newMaster = oldMaster;
                }
            }

            if (newMaster && created) {
                // TODO: AG-11476 isGroupOpenByDefault callback doesn't apply to master/detail grid

                if (groupDefaultExpanded === -1) {
                    row.expanded = true;
                } else {
                    // need to take row group into account when determining level
                    const masterRowLevel = this.funcColsSvc.rowGroupCols?.length ?? 0;
                    row.expanded = masterRowLevel < groupDefaultExpanded;
                }
            } else if (!newMaster && oldMaster) {
                row.expanded = false; // if changing AWAY from master, then un-expand, otherwise next time it's shown it is expanded again
            }

            if (newMaster !== oldMaster) {
                row.master = newMaster;
                rowsChanged ||= !newMaster !== !oldMaster;

                row.dispatchRowEvent('masterChanged');
            }
        };

        if (transactions) {
            for (let i = 0, len = transactions.length; i < len; ++i) {
                const { update, add } = transactions[i];
                for (let j = 0, len = add.length; j < len; ++j) {
                    setMaster(add[j] as RowNode, true, false);
                }
                for (let j = 0, len = update.length; j < len; ++j) {
                    setMaster(update[j] as RowNode, false, true);
                }
            }
        } else {
            const allLeafChildren = _getClientSideRowModel(this.beans)?.rootNode?.allLeafChildren;
            if (allLeafChildren) {
                for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
                    setMaster(allLeafChildren[i], true, false);
                }
            }
        }

        return rowsChanged;
    }

    /** Used by flatten stage to get or create a detail node from a master node */
    public getDetail(masterNode: RowNode): RowNode | null {
        if (!masterNode.master || !masterNode.expanded) {
            return null;
        }

        let detailNode = masterNode.detailNode;
        if (detailNode) {
            return detailNode;
        }

        detailNode = new RowNode(this.beans);
        detailNode.detail = true;
        detailNode.selectable = false;
        detailNode.parent = masterNode;

        if (_exists(masterNode.id)) {
            detailNode.id = 'detail_' + masterNode.id;
        }

        detailNode.data = masterNode.data;
        detailNode.level = masterNode.level + 1;
        masterNode.detailNode = detailNode;

        return detailNode;
    }

    public setupDetailRowAutoHeight(rowCtrl: RowCtrl, eDetailGui: HTMLElement): void {
        const { gos } = this;
        if (!gos.get('detailRowAutoHeight')) {
            return;
        }

        const checkRowSizeFunc = () => {
            const clientHeight = eDetailGui.clientHeight;

            // if the UI is not ready, the height can be 0, which we ignore, as otherwise a flicker will occur
            // as UI goes from the default height, to 0, then to the real height as UI becomes ready. this means
            // it's not possible for have 0 as auto-height, however this is an improbable use case, as even an
            // empty detail grid would still have some styling around it giving at least a few pixels.
            if (clientHeight != null && clientHeight > 0) {
                // we do the update in a timeout, to make sure we are not calling from inside the grid
                // doing another update
                const updateRowHeightFunc = () => {
                    const { rowModel } = this;
                    const rowNode = rowCtrl.getRowNode();
                    rowNode.setRowHeight(clientHeight);
                    if (_isClientSideRowModel(gos, rowModel) || _isServerSideRowModel(gos, rowModel)) {
                        rowModel.onRowHeightChanged();
                    }
                };
                window.setTimeout(updateRowHeightFunc, 0);
            }
        };

        const resizeObserverDestroyFunc = _observeResize(gos, eDetailGui, checkRowSizeFunc);

        rowCtrl.addDestroyFunc(resizeObserverDestroyFunc);

        checkRowSizeFunc();
    }
}
