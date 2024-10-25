import type { BeanCollection, IToolPanel, SideBarDef } from 'ag-grid-community';
import { _unwrapUserComp } from 'ag-grid-community';

export function isSideBarVisible(beans: BeanCollection): boolean {
    return beans.sideBar?.getSideBarComp().isDisplayed() ?? false;
}

export function setSideBarVisible(beans: BeanCollection, show: boolean) {
    beans.sideBar?.getSideBarComp().setDisplayed(show);
}

export function setSideBarPosition(beans: BeanCollection, position: 'left' | 'right') {
    beans.sideBar?.getSideBarComp().setSideBarPosition(position);
}

export function openToolPanel(beans: BeanCollection, key: string) {
    beans.sideBar?.getSideBarComp().openToolPanel(key, 'api');
}

export function closeToolPanel(beans: BeanCollection) {
    beans.sideBar?.getSideBarComp().close('api');
}

export function getOpenedToolPanel(beans: BeanCollection): string | null {
    return beans.sideBar?.getSideBarComp().openedItem() ?? null;
}

export function refreshToolPanel(beans: BeanCollection): void {
    beans.sideBar?.getSideBarComp().refresh();
}

export function isToolPanelShowing(beans: BeanCollection): boolean {
    return beans.sideBar?.getSideBarComp().isToolPanelShowing() ?? false;
}

export function getToolPanelInstance<TToolPanel = IToolPanel>(
    beans: BeanCollection,
    id: string
): TToolPanel | undefined {
    const comp = beans.sideBar?.getSideBarComp().getToolPanelInstance(id);
    return _unwrapUserComp(comp) as any;
}

export function getSideBar(beans: BeanCollection): SideBarDef | undefined {
    return beans.sideBar?.getSideBarComp().getDef();
}
