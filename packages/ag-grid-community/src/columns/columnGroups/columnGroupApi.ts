import type { BeanCollection } from '../../context/context';
import type { AgColumnGroup } from '../../entities/agColumnGroup';
import type { AgProvidedColumnGroup } from '../../entities/agProvidedColumnGroup';
import type { HeaderLocation } from '../../entities/colDef';
import type { Column, ColumnGroup, ProvidedColumnGroup } from '../../interfaces/iColumn';

export function setColumnGroupOpened(
    beans: BeanCollection,
    group: ProvidedColumnGroup | string,
    newValue: boolean
): void {
    beans.columnGroupSvc?.setColumnGroupOpened(group as AgProvidedColumnGroup | string, newValue, 'api');
}

export function getColumnGroup(beans: BeanCollection, name: string, instanceId?: number): ColumnGroup | null {
    return beans.columnGroupSvc?.getColumnGroup(name, instanceId) ?? null;
}

export function getProvidedColumnGroup(beans: BeanCollection, name: string): ProvidedColumnGroup | null {
    return beans.columnGroupSvc?.getProvidedColGroup(name) ?? null;
}

export function getDisplayNameForColumnGroup(
    beans: BeanCollection,
    columnGroup: ColumnGroup,
    location: HeaderLocation
): string {
    return beans.colNames.getDisplayNameForColumnGroup(columnGroup as AgColumnGroup, location) || '';
}

export function getColumnGroupState(beans: BeanCollection): { groupId: string; open: boolean }[] {
    return beans.columnGroupSvc?.getColumnGroupState() ?? [];
}

export function setColumnGroupState(beans: BeanCollection, stateItems: { groupId: string; open: boolean }[]): void {
    beans.columnGroupSvc?.setColumnGroupState(stateItems, 'api');
}

export function resetColumnGroupState(beans: BeanCollection): void {
    beans.columnGroupSvc?.resetColumnGroupState('api');
}

export function getLeftDisplayedColumnGroups(beans: BeanCollection): (Column | ColumnGroup)[] {
    return beans.visibleCols.treeLeft;
}

export function getCenterDisplayedColumnGroups(beans: BeanCollection): (Column | ColumnGroup)[] {
    return beans.visibleCols.treeCenter;
}

export function getRightDisplayedColumnGroups(beans: BeanCollection): (Column | ColumnGroup)[] {
    return beans.visibleCols.treeRight;
}

export function getAllDisplayedColumnGroups(beans: BeanCollection): (Column | ColumnGroup)[] | null {
    return beans.visibleCols.getAllTrees();
}
