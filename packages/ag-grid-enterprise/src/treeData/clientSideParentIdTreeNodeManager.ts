import type { GridOptions, NamedBean, RowNode } from 'ag-grid-community';

import { AbstractClientSideTreeNodeManager } from './abstractClientSideTreeNodeManager';
import type { DataFieldGetter } from './fieldAccess';
import { makeFieldPathGetter } from './fieldAccess';

export class ClientSideParentIdTreeNodeManager<TData>
    extends AbstractClientSideTreeNodeManager<TData>
    implements NamedBean
{
    beanName = 'csrmParentIdTreeNodeSvc' as const;

    private parentIdGetter: DataFieldGetter<TData, string | null | undefined> | null = null;

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.parentIdGetter = null;
    }

    public needsReset(changedProps: Set<keyof GridOptions<any>>): boolean {
        return changedProps.has('treeDataParentIdField' as any);
    }

    public override activate(rootNode: RowNode<TData>): void {
        const oldParentIdGetter = this.parentIdGetter;
        const parentIdGetter = this.gos.get('treeDataParentIdField' as any);
        if (!oldParentIdGetter || oldParentIdGetter.path !== parentIdGetter) {
            this.parentIdGetter = makeFieldPathGetter(parentIdGetter);
        }

        super.activate(rootNode);
    }

    protected override loadNewRowData(rowData: TData[]): void {
        const rootNode = this.rootNode!;
        const treeRoot = this.treeRoot!;

        this.treeClear(treeRoot);
        treeRoot.setRow(rootNode);

        super.loadNewRowData(rowData);

        this.treeCommit();
    }
}
