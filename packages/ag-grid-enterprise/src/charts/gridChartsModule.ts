import type { IntegratedChartModule } from 'ag-charts-types';

import type { NamedBean, _GridChartsGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { BeanStub, DragAndDropModule, PopupModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import type { ILicenseManager } from '../license/shared/licenseManager';
import { LicenseManager } from '../license/shared/licenseManager';
import { baseEnterpriseModule } from '../moduleUtils';
import { CellSelectionModule } from '../rangeSelection/rangeSelectionModule';
import { VERSION } from '../version';
import { MenuItemModule } from '../widgets/menuItemModule';
import { EnterpriseChartProxyFactory } from './chartComp/chartProxies/enterpriseChartProxyFactory';
import { AdvancedSettingsMenuFactory } from './chartComp/menu/advancedSettings/advancedSettingsMenuFactory';
import { ChartMenuListFactory } from './chartComp/menu/chartMenuList';
import { ChartCrossFilterService } from './chartComp/services/chartCrossFilterService';
import { ChartMenuService } from './chartComp/services/chartMenuService';
import { ChartTranslationService } from './chartComp/services/chartTranslationService';
import { ChartService } from './chartService';
import {
    closeChartToolPanel,
    createCrossFilterChart,
    createPivotChart,
    createRangeChart,
    downloadChart,
    getChartImageDataURL,
    getChartModels,
    getChartRef,
    openChartToolPanel,
    restoreChart,
    updateChart,
} from './chartsApi';
import { gridChartsModuleCSS } from './gridChartsModule.css-GENERATED';
import { validGridChartsVersion } from './utils/validGridChartsVersion';

/**
 * @feature Integrated Charts
 */
export const GridChartsModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('GridChartsModule'),
    validate: () => {
        return {
            isValid: false,
            message:
                'AG Grid: As of v33, the "GridChartsModule" has been deprecated. Please use "IntegratedChartsModule" instead.',
        };
    },
};

type IntegratedChartsModuleType = {
    with: (params: IntegratedChartModule) => _ModuleWithApi<_GridChartsGridApi>;
} & _ModuleWithApi<_GridChartsGridApi>;

const baseIntegratedChartsModule: _ModuleWithApi<_GridChartsGridApi> = {
    ...baseEnterpriseModule('IntegratedChartsModule'),
    validate: () => {
        return {
            isValid: false,
            message: 'AG Grid: Integrated Charts module must be initialised with a version of the charts library',
        };
    },
    beans: [
        ChartService,
        ChartTranslationService,
        ChartCrossFilterService,
        ChartMenuListFactory,
        ChartMenuService,
        // Include enterprise beans for now for all users as tiny compared to charts bundle size
        EnterpriseChartProxyFactory,
        AdvancedSettingsMenuFactory,
    ],
    icons: {
        // shown on top right of chart when chart is linked to range data (click to unlink)
        linked: 'linked',
        // shown on top right of chart when chart is not linked to range data (click to link)
        unlinked: 'unlinked',
        // icon to open charts menu
        chartsMenu: 'menu-alt',
        // download chart
        chartsDownload: 'save',
        // Edit Chart menu item shown in Integrated Charts menu
        chartsMenuEdit: 'chart',
        // Advanced Settings menu item shown in Integrated Charts menu
        chartsMenuAdvancedSettings: 'settings',
        // shown in Integrated Charts menu add fields
        chartsMenuAdd: 'plus',
        // shown in Integrated Charts tool panel color picker
        chartsColorPicker: 'small-down',
        // previous in Integrated Charts settings tool panel theme switcher
        chartsThemePrevious: 'previous',
        // next in Integrated Charts settings tool panel theme switcher
        chartsThemeNext: 'next',
    },
    apiFunctions: {
        getChartModels,
        getChartRef,
        getChartImageDataURL,
        downloadChart,
        openChartToolPanel,
        closeChartToolPanel,
        createRangeChart,
        createPivotChart,
        createCrossFilterChart,
        updateChart,
        restoreChart,
    },
    dependsOn: [CellSelectionModule, EnterpriseCoreModule, DragAndDropModule, PopupModule, MenuItemModule],
    css: [gridChartsModuleCSS],
};

export const IntegratedChartsModule: IntegratedChartsModuleType = {
    with: (params) => {
        const AgCharts = (params as any).AgCharts;
        AgCharts.setGridContext(true);
        // init agChartsContext bean to provide chart things to the grid
        if (params.isEnterprise) {
            // warn about passing enterprise charts into community integrated charts
            LicenseManager.setChartsLicenseManager(AgCharts as ILicenseManager);
        }

        params.setup();

        return {
            ...baseIntegratedChartsModule,
            validate: () => {
                return validGridChartsVersion({
                    gridVersion: VERSION,
                    chartsVersion: params.VERSION,
                });
            },
            // bind the params to the constructor to avoid the need for static properties
            beans: [...baseIntegratedChartsModule.beans!, AgChartsContext.bind(null, params)],
        };
    },
    ...baseIntegratedChartsModule,
};

export class AgChartsContext extends BeanStub implements NamedBean {
    beanName = 'agChartsContext' as const;

    isEnterprise = false;
    createChart: IntegratedChartModule['create'];
    _Theme: IntegratedChartModule['_Theme'];
    _Scene: any; // IntegratedChartModule['_Scene'];
    _Util: IntegratedChartModule['_Util'];
    AgCharts: any; // AgChartsModule;

    constructor(params: IntegratedChartModule) {
        super();
        this.AgCharts = (params as any).AgCharts;
        this.createChart = params.create;
        this._Theme = params._Theme;
        this._Scene = params._Scene;
        this.isEnterprise = params.isEnterprise;
        this._Util = params._Util;
    }
}
