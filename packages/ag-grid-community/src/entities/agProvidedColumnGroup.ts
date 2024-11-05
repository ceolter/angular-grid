import { BeanStub } from '../context/beanStub';
import type { Column, ColumnGroupShowType, ColumnInstanceId, ProvidedColumnGroup } from '../interfaces/iColumn';
import type { AgColumn } from './agColumn';
import { getNextColInstanceId, isColumn } from './agColumn';
import type { ColGroupDef } from './colDef';

export function isProvidedColumnGroup(col: Column | ProvidedColumnGroup | string | null): col is AgProvidedColumnGroup {
    return col instanceof AgProvidedColumnGroup;
}

export type AgProvidedColumnGroupEvent = 'expandedChanged' | 'expandableChanged';
export class AgProvidedColumnGroup extends BeanStub<AgProvidedColumnGroupEvent> implements ProvidedColumnGroup {
    public readonly isColumn = false as const;

    public originalParent: AgProvidedColumnGroup | null;

    private children: (AgColumn | AgProvidedColumnGroup)[];
    private expandable = false;

    private expanded: boolean;

    // used by React (and possibly other frameworks) as key for rendering. also used to
    // identify old vs new columns for destroying cols when no longer used.
    private instanceId = getNextColInstanceId();

    private expandableListenerRemoveCallback: (() => void) | null = null;

    constructor(
        private colGroupDef: ColGroupDef | null,
        private readonly groupId: string,
        private padding: boolean,
        private level: number
    ) {
        super();
        this.expanded = !!colGroupDef?.openByDefault;
    }

    public override destroy() {
        if (this.expandableListenerRemoveCallback) {
            this.reset(null, undefined);
        }
        super.destroy();
    }

    private reset(colGroupDef: ColGroupDef | null, level: number | undefined): void {
        this.colGroupDef = colGroupDef;
        this.level = level!;

        this.originalParent = null;

        if (this.expandableListenerRemoveCallback) {
            this.expandableListenerRemoveCallback();
        }

        // we use ! below, as we want to set the object back to the
        // way it was when it was first created
        this.children = undefined!;
        this.expandable = undefined!;
    }

    public getInstanceId(): ColumnInstanceId {
        return this.instanceId;
    }

    public getOriginalParent(): AgProvidedColumnGroup | null {
        return this.originalParent;
    }

    public getLevel(): number {
        return this.level;
    }

    public isVisible(): boolean {
        // return true if at least one child is visible
        if (this.children) {
            return this.children.some((child) => child.isVisible());
        }

        return false;
    }

    public isPadding(): boolean {
        return this.padding;
    }

    public setExpanded(expanded: boolean | undefined): void {
        this.expanded = expanded === undefined ? false : expanded;
        this.dispatchLocalEvent({ type: 'expandedChanged' });
    }

    public isExpandable(): boolean {
        return this.expandable;
    }

    public isExpanded(): boolean {
        return this.expanded;
    }

    public getGroupId(): string {
        return this.groupId;
    }

    public getId(): string {
        return this.getGroupId();
    }

    public setChildren(children: (AgColumn | AgProvidedColumnGroup)[]): void {
        this.children = children;
    }

    public getChildren(): (AgColumn | AgProvidedColumnGroup)[] {
        return this.children;
    }

    public getColGroupDef(): ColGroupDef | null {
        return this.colGroupDef;
    }

    public getLeafColumns(): AgColumn[] {
        const result: AgColumn[] = [];
        this.addLeafColumns(result);
        return result;
    }

    private addLeafColumns(leafColumns: Column[]): void {
        if (!this.children) {
            return;
        }

        this.children.forEach((child) => {
            if (isColumn(child)) {
                leafColumns.push(child);
            } else if (isProvidedColumnGroup(child)) {
                child.addLeafColumns(leafColumns);
            }
        });
    }

    public getColumnGroupShow(): ColumnGroupShowType | undefined {
        const colGroupDef = this.colGroupDef;

        if (!colGroupDef) {
            return;
        }

        return colGroupDef.columnGroupShow;
    }

    // need to check that this group has at least one col showing when both expanded and contracted.
    // if not, then we don't allow expanding and contracting on this group

    public setupExpandable() {
        this.setExpandable();

        if (this.expandableListenerRemoveCallback) {
            this.expandableListenerRemoveCallback();
        }

        const listener = this.onColumnVisibilityChanged.bind(this);
        this.getLeafColumns().forEach((col) => col.addEventListener('visibleChanged', listener));

        this.expandableListenerRemoveCallback = () => {
            this.getLeafColumns().forEach((col) => col.removeEventListener('visibleChanged', listener));
            this.expandableListenerRemoveCallback = null;
        };
    }

    public setExpandable() {
        if (this.isPadding()) {
            return;
        }
        // want to make sure the group doesn't disappear when it's open
        let atLeastOneShowingWhenOpen = false;
        // want to make sure the group doesn't disappear when it's closed
        let atLeastOneShowingWhenClosed = false;
        // want to make sure the group has something to show / hide
        let atLeastOneChangeable = false;

        const children = this.findChildrenRemovingPadding();

        for (let i = 0, j = children.length; i < j; i++) {
            const abstractColumn = children[i];
            if (!abstractColumn.isVisible()) {
                continue;
            }
            // if the abstractColumn is a grid generated group, there will be no colDef
            const headerGroupShow = abstractColumn.getColumnGroupShow();

            if (headerGroupShow === 'open') {
                atLeastOneShowingWhenOpen = true;
                atLeastOneChangeable = true;
            } else if (headerGroupShow === 'closed') {
                atLeastOneShowingWhenClosed = true;
                atLeastOneChangeable = true;
            } else {
                atLeastOneShowingWhenOpen = true;
                atLeastOneShowingWhenClosed = true;
            }
        }

        const expandable = atLeastOneShowingWhenOpen && atLeastOneShowingWhenClosed && atLeastOneChangeable;

        if (this.expandable !== expandable) {
            this.expandable = expandable;
            this.dispatchLocalEvent({ type: 'expandableChanged' });
        }
    }

    private findChildrenRemovingPadding(): (AgColumn | AgProvidedColumnGroup)[] {
        const res: (AgColumn | AgProvidedColumnGroup)[] = [];

        const process = (items: (AgColumn | AgProvidedColumnGroup)[]) => {
            items.forEach((item) => {
                // if padding, we add this children instead of the padding
                const skipBecausePadding = isProvidedColumnGroup(item) && item.isPadding();
                if (skipBecausePadding) {
                    process((item as AgProvidedColumnGroup).children);
                } else {
                    res.push(item);
                }
            });
        };

        process(this.children);

        return res;
    }

    private onColumnVisibilityChanged(): void {
        this.setExpandable();
    }
}
