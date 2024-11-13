import type { IntegratedModule } from 'ag-charts-types';

import type { NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

/** Bean to expose the AG Charts apis from a single location and not require a code dependency on ag-charts-community */
export class AgChartsExports extends BeanStub implements NamedBean {
    beanName = 'agChartsExports' as const;

    isEnterprise = false;
    create: IntegratedModule['create'];
    _Theme: IntegratedModule['_Theme'];
    _Scene: any; // types not exposed as only used for mini charts
    _Util: IntegratedModule['_Util'];

    constructor(params: IntegratedModule) {
        super();
        this.create = params.create;
        this._Theme = params._Theme;
        this._Scene = params._Scene;
        this.isEnterprise = params.isEnterprise;
        this._Util = params._Util;
    }
}
