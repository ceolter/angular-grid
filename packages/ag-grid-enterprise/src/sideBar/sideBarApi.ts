import type { BeanCollection, IToolPanel, SideBarDef } from 'ag-grid-community';
import { _unwrapUserComp } from 'ag-grid-community';

export function isSideBarVisible(beans: BeanCollection): boolean {
    return beans.sideBar?.comp.isDisplayed() ?? false;
}

export function setSideBarVisible(beans: BeanCollection, show: boolean) {
    beans.sideBar?.comp.setDisplayed(show);
}

export function setSideBarPosition(beans: BeanCollection, position: 'left' | 'right') {
    beans.sideBar?.comp.setSideBarPosition(position);
}

export function openToolPanel(beans: BeanCollection, key: string) {
    beans.sideBar?.comp.openToolPanel(key, 'api');
}

export function closeToolPanel(beans: BeanCollection) {
    beans.sideBar?.comp.close('api');
}

export function getOpenedToolPanel(beans: BeanCollection): string | null {
    return beans.sideBar?.comp.openedItem() ?? null;
}

export function refreshToolPanel(beans: BeanCollection): void {
    beans.sideBar?.comp.refresh();
}

export function isToolPanelShowing(beans: BeanCollection): boolean {
    return beans.sideBar?.comp.isToolPanelShowing() ?? false;
}

export function getToolPanelInstance<TToolPanel = IToolPanel>(
    beans: BeanCollection,
    id: string
): TToolPanel | undefined {
    const comp = beans.sideBar?.comp.getToolPanelInstance(id);
    return _unwrapUserComp(comp) as any;
}

export function getSideBar(beans: BeanCollection): SideBarDef | undefined {
    return beans.sideBar?.comp.getDef();
}
