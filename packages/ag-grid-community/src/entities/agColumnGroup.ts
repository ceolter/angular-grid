import { BeanStub } from '../context/beanStub';
import type {
    AgColumnGroupEvent,
    Column,
    ColumnGroup,
    ColumnGroupShowType,
    ColumnPinnedType,
    HeaderColumnId,
} from '../interfaces/iColumn';
import { _last } from '../utils/array';
import type { AgColumn } from './agColumn';
import { isColumn } from './agColumn';
import type { AgProvidedColumnGroup } from './agProvidedColumnGroup';
import type { AbstractColDef, ColGroupDef } from './colDef';

export function createUniqueColumnGroupId(groupId: string, instanceId: number): HeaderColumnId {
    return (groupId + '_' + instanceId) as HeaderColumnId;
}

export function isColumnGroup(col: Column | ColumnGroup | string): col is AgColumnGroup {
    return col instanceof AgColumnGroup;
}

export class AgColumnGroup<TValue = any> extends BeanStub<AgColumnGroupEvent> implements ColumnGroup<TValue> {
    public readonly isColumn = false as const;

    // all the children of this group, regardless of whether they are opened or closed
    private children: (AgColumn | AgColumnGroup)[] | null;
    // depends on the open/closed state of the group, only displaying columns are stored here
    private displayedChildren: (AgColumn | AgColumnGroup)[] | null = [];

    // The measured height of this column's header when autoHeaderHeight is enabled
    private autoHeaderHeight: number | null = null;

    // private moving = false
    private left: number | null;
    private oldLeft: number | null;

    public parent: AgColumnGroup | null = null;

    constructor(
        private readonly providedColumnGroup: AgProvidedColumnGroup,
        private readonly groupId: string,
        private readonly partId: number,
        private readonly pinned: ColumnPinnedType
    ) {
        super();
    }

    // as the user is adding and removing columns, the groups are recalculated.
    // this reset clears out all children, ready for children to be added again
    public reset(): void {
        this.parent = null;
        this.children = null;
        this.displayedChildren = null;
    }

    public getParent(): AgColumnGroup | null {
        return this.parent;
    }

    public getUniqueId(): HeaderColumnId {
        return createUniqueColumnGroupId(this.groupId, this.partId);
    }

    public isEmptyGroup(): boolean {
        return this.displayedChildren!.length === 0;
    }

    public isMoving(): boolean {
        const allLeafColumns = this.getProvidedColumnGroup().getLeafColumns();
        if (!allLeafColumns || allLeafColumns.length === 0) {
            return false;
        }

        return allLeafColumns.every((col) => col.isMoving());
    }

    public checkLeft(): void {
        // first get all children to setLeft, as it impacts our decision below
        this.displayedChildren!.forEach((child) => {
            if (isColumnGroup(child)) {
                child.checkLeft();
            }
        });

        // set our left based on first displayed column
        if (this.displayedChildren!.length > 0) {
            if (this.gos.get('enableRtl')) {
                const lastChild = _last(this.displayedChildren!);
                const lastChildLeft = lastChild.getLeft();
                this.setLeft(lastChildLeft);
            } else {
                const firstChildLeft = this.displayedChildren![0].getLeft();
                this.setLeft(firstChildLeft);
            }
        } else {
            // this should never happen, as if we have no displayed columns, then
            // this groups should not even exist.
            this.setLeft(null);
        }
    }

    public getLeft(): number | null {
        return this.left;
    }

    public getOldLeft(): number | null {
        return this.oldLeft;
    }

    public setLeft(left: number | null) {
        this.oldLeft = this.left;
        if (this.left !== left) {
            this.left = left;
            this.dispatchLocalEvent({ type: 'leftChanged' });
        }
    }

    public getPinned(): ColumnPinnedType {
        return this.pinned;
    }

    public getGroupId(): string {
        return this.groupId;
    }

    public getPartId(): number {
        return this.partId;
    }

    public getActualWidth(): number {
        let groupActualWidth = 0;
        this.displayedChildren?.forEach((child) => {
            groupActualWidth += child.getActualWidth();
        });
        return groupActualWidth;
    }

    public isResizable(): boolean {
        if (!this.displayedChildren) {
            return false;
        }

        // if at least one child is resizable, then the group is resizable
        let result = false;
        this.displayedChildren.forEach((child) => {
            if (child.isResizable()) {
                result = true;
            }
        });

        return result;
    }

    public getMinWidth(): number {
        let result = 0;
        this.displayedChildren!.forEach((groupChild) => {
            result += groupChild.getMinWidth();
        });
        return result;
    }

    public addChild(child: AgColumn | AgColumnGroup): void {
        if (!this.children) {
            this.children = [];
        }
        this.children.push(child);
    }

    public getDisplayedChildren(): (AgColumn | AgColumnGroup)[] | null {
        return this.displayedChildren;
    }

    public getLeafColumns(): AgColumn[] {
        const result: AgColumn[] = [];
        this.addLeafColumns(result);
        return result;
    }

    public getDisplayedLeafColumns(): AgColumn[] {
        const result: AgColumn[] = [];
        this.addDisplayedLeafColumns(result);
        return result;
    }

    public getDefinition(): AbstractColDef | null {
        return this.providedColumnGroup.getColGroupDef();
    }

    public getColGroupDef(): ColGroupDef | null {
        return this.providedColumnGroup.getColGroupDef();
    }

    public isPadding(): boolean {
        return this.providedColumnGroup.isPadding();
    }

    public isExpandable(): boolean {
        return this.providedColumnGroup.isExpandable();
    }

    public isExpanded(): boolean {
        return this.providedColumnGroup.isExpanded();
    }

    public setExpanded(expanded: boolean): void {
        this.providedColumnGroup.setExpanded(expanded);
    }

    public isAutoHeaderHeight(): boolean {
        return !!this.getColGroupDef()?.autoHeaderHeight;
    }

    public getAutoHeaderHeight(): number | null {
        return this.autoHeaderHeight;
    }

    /** Returns true if the header height has changed */
    public setAutoHeaderHeight(height: number): boolean {
        const changed = height !== this.autoHeaderHeight;
        this.autoHeaderHeight = height;
        return changed;
    }

    private addDisplayedLeafColumns(leafColumns: AgColumn[]): void {
        this.displayedChildren!.forEach((child) => {
            if (isColumn(child)) {
                leafColumns.push(child);
            } else if (isColumnGroup(child)) {
                child.addDisplayedLeafColumns(leafColumns);
            }
        });
    }

    private addLeafColumns(leafColumns: AgColumn[]): void {
        this.children!.forEach((child) => {
            if (isColumn(child)) {
                leafColumns.push(child);
            } else if (isColumnGroup(child)) {
                child.addLeafColumns(leafColumns);
            }
        });
    }

    public getChildren(): (AgColumn | AgColumnGroup)[] | null {
        return this.children;
    }

    public getColumnGroupShow(): ColumnGroupShowType | undefined {
        return this.providedColumnGroup.getColumnGroupShow();
    }

    public getProvidedColumnGroup(): AgProvidedColumnGroup {
        return this.providedColumnGroup;
    }

    public getPaddingLevel(): number {
        const parent = this.getParent();

        if (!this.isPadding() || !parent || !parent.isPadding()) {
            return 0;
        }

        return 1 + parent.getPaddingLevel();
    }

    public calculateDisplayedColumns() {
        // clear out last time we calculated
        this.displayedChildren = [];

        // find the column group that is controlling expandable. this is relevant when we have padding (empty)
        // groups, where the expandable is actually the first parent that is not a padding group.
        let parentWithExpansion: AgColumnGroup | null = this;
        while (parentWithExpansion != null && parentWithExpansion.isPadding()) {
            parentWithExpansion = parentWithExpansion.getParent();
        }

        const isExpandable = parentWithExpansion ? parentWithExpansion.getProvidedColumnGroup().isExpandable() : false;
        // it not expandable, everything is visible
        if (!isExpandable) {
            this.displayedChildren = this.children;
            this.dispatchLocalEvent({ type: 'displayedChildrenChanged' });
            return;
        }

        // Add cols based on columnGroupShow
        // Note - the below also adds padding groups, these are always added because they never have
        // colDef.columnGroupShow set.
        this.children!.forEach((child) => {
            // never add empty groups
            const emptyGroup = isColumnGroup(child) && (!child.displayedChildren || !child.displayedChildren.length);
            if (emptyGroup) {
                return;
            }

            const headerGroupShow = child.getColumnGroupShow();
            switch (headerGroupShow) {
                case 'open':
                    // when set to open, only show col if group is open
                    if (parentWithExpansion!.getProvidedColumnGroup().isExpanded()) {
                        this.displayedChildren!.push(child);
                    }
                    break;
                case 'closed':
                    // when set to open, only show col if group is open
                    if (!parentWithExpansion!.getProvidedColumnGroup().isExpanded()) {
                        this.displayedChildren!.push(child);
                    }
                    break;
                default:
                    this.displayedChildren!.push(child);
                    break;
            }
        });

        this.dispatchLocalEvent({ type: 'displayedChildrenChanged' });
    }
}
