import type { ComponentSelector, ISideBar, ISideBarService, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import { AgSideBarSelector } from './agSideBar';

export class SideBarService extends BeanStub implements NamedBean, ISideBarService {
    beanName = 'sideBar' as const;

    public comp: ISideBar;

    public getSelector(): ComponentSelector {
        return AgSideBarSelector;
    }
}
