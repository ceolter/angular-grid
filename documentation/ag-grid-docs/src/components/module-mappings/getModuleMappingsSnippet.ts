import { ALL_ENTERPRISE_MODULE, INTEGRATED_CHARTS_MODULE, SPARKLINES_MODULE } from './constants';

export type ChartsImportType = 'enterprise' | 'community' | 'none';
interface Params {
    chartsImportType: ChartsImportType;
    selectedModules: SelectedModules;
}

export interface SelectedModules {
    community: string[];
    enterprise: string[];
}

const TAB_SPACING = '    ';

const getCodeSnippet = ({ chartsImportType, selectedModules }: Params) => {
    const { community, enterprise } = selectedModules;
    const communityImportsString = community.length
        ? community
              .map((name) => {
                  return `${TAB_SPACING}${name},`;
              })
              .join('\n')
        : '';
    const enterpriseImportsString = enterprise.length
        ? enterprise.map((name) => `${TAB_SPACING}${name},`).join('\n')
        : '';
    const chartsImport =
        chartsImportType === 'community'
            ? "import { AgChartsCommunityModule } from 'ag-charts-community';"
            : chartsImportType === 'enterprise'
              ? "import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';"
              : '';
    const allModules = community
        .concat(enterprise)
        .map((name) => {
            const isChartsModule = [SPARKLINES_MODULE.moduleName, INTEGRATED_CHARTS_MODULE.moduleName].includes(name);
            const isEnterpriseModule = name === ALL_ENTERPRISE_MODULE;
            const isCommunityCharts = chartsImportType === 'community' && (isChartsModule || isEnterpriseModule);
            const isEnterpriseCharts = chartsImportType === 'enterprise' && (isChartsModule || isEnterpriseModule);

            let exportName = name;
            if (isCommunityCharts) {
                exportName = `${name}.with(AgChartsCommunityModule)`;
            } else if (isEnterpriseCharts) {
                exportName = `${name}.with(AgChartsEnterpriseModule)`;
            }

            return exportName;
        })
        .map((name) => `${TAB_SPACING}${name},`)
        .join('\n');

    return `${chartsImport ? `${chartsImport}\n` : ''}import {
    ModuleRegistry,${communityImportsString ? `\n${communityImportsString}` : ''}
} from 'ag-grid-community';${
        enterpriseImportsString
            ? `\nimport {
${enterpriseImportsString}
} from 'ag-grid-enterprise';`
            : ''
    }

ModuleRegistry.registerModules([
${allModules}
]);`;
};

export function getModuleMappingsSnippet({ chartsImportType, selectedModules }: Params): string | undefined {
    if (!selectedModules.community.length && !selectedModules.enterprise.length) {
        return;
    }

    return getCodeSnippet({ chartsImportType, selectedModules });
}
