import type {
    BeanCollection,
    BeanName,
    BeforeRefreshModelEvent,
    DetailGridInfo,
    IColsService,
    IMasterDetailService,
    IRowModel,
    NamedBean,
    RowCtrl,
} from 'ag-grid-community';
import {
    BeanStub,
    RowNode,
    _exists,
    _isClientSideRowModel,
    _isServerSideRowModel,
    _observeResize,
} from 'ag-grid-community';

export class MasterDetailService extends BeanStub implements NamedBean, IMasterDetailService {
    beanName: BeanName = 'masterDetailSvc' as const;

    public store: { [id: string]: DetailGridInfo | undefined } = {};

    private enabled: boolean;
    private rowModel: IRowModel;
    private rowGroupColsSvc?: IColsService;

    private isEnabled(): boolean {
        const gos = this.gos;
        return (
            gos.get('masterDetail') &&
            // TODO: AG-1752: [Tree Data] Allow tree data leaf rows to serve as master rows for detail grids (Tree Data hosting Master/Detail)"
            !gos.get('treeData')
        );
    }

    public wireBeans(beans: BeanCollection): void {
        this.rowGroupColsSvc = beans.rowGroupColsSvc;
        this.rowModel = beans.rowModel;
    }

    public postConstruct(): void {
        if (_isClientSideRowModel(this.gos)) {
            this.enabled = this.isEnabled();
            this.addManagedEventListeners({ beforeRefreshModel: this.beforeRefreshModel.bind(this) });
        }
    }

    private beforeRefreshModel({ state }: BeforeRefreshModelEvent) {
        const enabled = this.isEnabled();
        let enabledChanged = false;
        if (enabled !== this.enabled) {
            this.enabled = enabled;
            enabledChanged = true;
        }

        const gos = this.gos;
        const isRowMaster = gos.get('isRowMaster');
        const groupDefaultExpanded = gos.get('groupDefaultExpanded');

        const setMaster = (row: RowNode, reset: boolean, updated: boolean) => {
            const oldMaster = row.master;

            let newMaster = enabled;

            if (enabled) {
                const data = row.data;
                if (!data) {
                    newMaster = false;
                } else if (reset || updated) {
                    if (isRowMaster) {
                        newMaster = !!isRowMaster(data);
                    }
                } else {
                    newMaster = oldMaster;
                }
            }

            if (newMaster && reset) {
                // TODO: AG-11476 isGroupOpenByDefault callback doesn't apply to master/detail grid

                if (groupDefaultExpanded === -1) {
                    row.expanded = true;
                } else {
                    // need to take row group into account when determining level
                    const masterRowLevel = this.rowGroupColsSvc?.columns.length ?? 0;
                    row.expanded = masterRowLevel < groupDefaultExpanded;
                }
            } else if (!newMaster && oldMaster) {
                row.expanded = false; // if changing AWAY from master, then un-expand, otherwise next time it's shown it is expanded again
            }

            if (newMaster !== oldMaster) {
                row.master = newMaster;

                row.dispatchRowEvent('masterChanged');
            }
        };

        const updates = state.updates;
        if (!enabledChanged && state.deltaUpdate) {
            for (const node of updates.keys()) {
                const created = updates.get(node)!;
                setMaster(node, created, !created);
            }
        } else {
            const allLeafChildren = state.rootNode.allLeafChildren;
            if (allLeafChildren) {
                for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
                    const node = allLeafChildren[i];
                    const createdOrUpdated = updates.get(node);
                    setMaster(node, enabledChanged || createdOrUpdated === true, createdOrUpdated === false);
                }
            }
        }
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
        const { gos, beans } = this;
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
                    const { rowNode } = rowCtrl;
                    rowNode.setRowHeight(clientHeight);
                    if (_isClientSideRowModel(gos, rowModel) || _isServerSideRowModel(gos, rowModel)) {
                        rowModel.onRowHeightChanged();
                    }
                };
                window.setTimeout(updateRowHeightFunc, 0);
            }
        };

        const resizeObserverDestroyFunc = _observeResize(beans, eDetailGui, checkRowSizeFunc);

        rowCtrl.addDestroyFunc(resizeObserverDestroyFunc);

        checkRowSizeFunc();
    }

    public override destroy(): void {
        this.store = {};
        super.destroy();
    }
}
