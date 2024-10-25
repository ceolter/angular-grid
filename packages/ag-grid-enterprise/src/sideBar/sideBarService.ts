import type { ComponentSelector, ISideBar, ISideBarService, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import { AgSideBarSelector } from './agSideBar';

export class SideBarService extends BeanStub implements NamedBean, ISideBarService {
    beanName = 'sideBar' as const;

    private sideBarComp: ISideBar;

    public registerSideBarComp(sideBarComp: ISideBar): void {
        this.sideBarComp = sideBarComp;
    }

    public getSideBarComp(): ISideBar {
        return this.sideBarComp;
    }

    public getSideBarSelector(): ComponentSelector {
        return AgSideBarSelector;
    }
}
