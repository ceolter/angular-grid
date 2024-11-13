import type { IntegratedModule } from 'ag-charts-types';

import type { _GridChartsGridApi, _ModuleWithApi } from 'ag-grid-community';
import { DragAndDropModule, PopupModule, _errMsg } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import type { ILicenseManager } from '../license/shared/licenseManager';
import { LicenseManager } from '../license/shared/licenseManager';
import { baseEnterpriseModule } from '../moduleUtils';
import { CellSelectionModule } from '../rangeSelection/rangeSelectionModule';
import { VERSION } from '../version';
import { MenuItemModule } from '../widgets/menuItemModule';
import { AgChartsExports } from './agChartsExports';
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
import { integratedChartsModuleCSS } from './integratedChartsModule.css-GENERATED';
import { validGridChartsVersion } from './utils/validGridChartsVersion';

type IntegratedChartsModuleType = {
    with: (params: IntegratedModule) => _ModuleWithApi<_GridChartsGridApi>;
} & _ModuleWithApi<_GridChartsGridApi>;

const baseIntegratedChartsModule: _ModuleWithApi<_GridChartsGridApi> = {
    ...baseEnterpriseModule('IntegratedChartsModule'),
    validate: () => {
        return {
            isValid: false,
            message: _errMsg(257),
        };
    },
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
    css: [integratedChartsModuleCSS],
};

/**
 * @deprecated v33 Deprecated as of v33, please use `IntegratedChartsModule` instead.
 */
export const GridChartsModule: _ModuleWithApi<_GridChartsGridApi> = {
    ...baseIntegratedChartsModule,
    ...baseEnterpriseModule('GridChartsModule'),
    validate: () => {
        return {
            isValid: false,
            message:
                'AG Grid: As of v33, the "GridChartsModule" has been deprecated. Please use "IntegratedChartsModule" instead.',
        };
    },
};

/**
 * @feature Integrated Charts
 */
export const IntegratedChartsModule: IntegratedChartsModuleType = {
    with: (params) => {
        params.setup();
        params.setGridContext(true);
        if (params.isEnterprise) {
            const chartsManager: ILicenseManager = {
                setLicenseKey: params.setLicenseKey,
            };
            LicenseManager.setChartsLicenseManager(chartsManager);
        }

        return {
            ...baseIntegratedChartsModule,
            validate: () => {
                return validGridChartsVersion({
                    gridVersion: VERSION,
                    chartsVersion: params.VERSION,
                });
            },
            beans: [
                // bind the params to the constructor to avoid the need for static properties
                AgChartsExports.bind(null, params),
                ChartService,
                ChartTranslationService,
                ChartCrossFilterService,
                ChartMenuListFactory,
                ChartMenuService,
                // Include enterprise beans for now for all users as tiny compared to charts bundle size
                EnterpriseChartProxyFactory,
                AdvancedSettingsMenuFactory,
            ],
        };
    },
    ...baseIntegratedChartsModule,
};
