import { throwDevWarning } from '@ag-website-shared/utils/throwDevWarning';
import { type RefObject, useCallback, useMemo, useState } from 'react';

import type { IRowNode } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';

import {
    ALL_COMMUNITY_MODULE,
    ALL_ENTERPRISE_MODULE,
    type BundleOptionValue,
    type ChartModuleName,
    type ChartOptions,
    DEFAULT_CHART_OPTIONS,
    INTEGRATED_CHARTS_MODULE,
    ROW_MODEL_OPTIONS,
    SPARKLINES_MODULE,
} from './constants';
import { type ChartsImportType, type SelectedModules, getModuleMappingsSnippet } from './getModuleMappingsSnippet';

export type ModuleConfig = ReturnType<typeof useModuleConfig>;

const getChartsImportType = (chartOptions: ChartOptions): ChartsImportType => {
    const hasSparklines = chartOptions['Sparklines'];
    const hasIntegratedCharts = chartOptions['Integrated Charts'];
    let chartsImport: ChartsImportType = 'none';
    if (hasSparklines && !hasIntegratedCharts) {
        chartsImport = 'community';
    } else if (hasIntegratedCharts) {
        chartsImport = 'enterprise';
    }

    return chartsImport;
};

export function useModuleConfig(gridRef: RefObject<AgGridReact>) {
    const [rowModelOption, setRowModelOption] = useState<string>('ClientSideRowModelModule');
    const [bundleOption, setBundleOption] = useState<BundleOptionValue>('');
    const [chartOptions, setChartOptions] = useState(DEFAULT_CHART_OPTIONS);
    const [selectedModules, setSelectedModules] = useState<SelectedModules>({
        community: [],
        enterprise: [],
    });
    const allImportModules = useMemo(() => {
        const community = [...selectedModules.community];
        const enterprise = [...selectedModules.enterprise];

        const rowModelOptionObj = ROW_MODEL_OPTIONS.find(({ moduleName }) => moduleName === rowModelOption);
        if (!rowModelOptionObj) {
            throwDevWarning({ message: `Invalid row model option: ${rowModelOption}` });
            return {
                community,
                enterprise,
            };
        }

        if (bundleOption === ALL_COMMUNITY_MODULE && rowModelOptionObj?.isEnterprise) {
            enterprise.push(rowModelOptionObj.moduleName);
        } else if (bundleOption === ALL_COMMUNITY_MODULE && !rowModelOptionObj?.isEnterprise) {
            // Do nothing, as `AllCommunityModule` includes all community row models
        } else if (bundleOption === ALL_ENTERPRISE_MODULE) {
            // Do nothing, as `AllEnterpriseModule` includes all row models
        } else if (rowModelOptionObj.isEnterprise) {
            enterprise.push(rowModelOptionObj.moduleName);
        } else {
            community.push(rowModelOptionObj.moduleName);
        }

        if (chartOptions['Sparklines'] && bundleOption === ALL_COMMUNITY_MODULE) {
            enterprise.push(SPARKLINES_MODULE.moduleName);
        } else if (chartOptions['Sparklines'] && bundleOption === ALL_ENTERPRISE_MODULE) {
            // Do nothing, `AllEnterpriseModule` includes sparklines module
        } else if (chartOptions['Sparklines']) {
            enterprise.push(SPARKLINES_MODULE.moduleName);
        }

        if (chartOptions['Integrated Charts'] && bundleOption === ALL_COMMUNITY_MODULE) {
            enterprise.push(INTEGRATED_CHARTS_MODULE.moduleName);
        } else if (chartOptions['Integrated Charts'] && bundleOption === ALL_ENTERPRISE_MODULE) {
            // Do nothing, `AllEnterpriseModule` includes integrated charts module
        } else if (chartOptions['Integrated Charts']) {
            enterprise.push(INTEGRATED_CHARTS_MODULE.moduleName);
        }

        return {
            community,
            enterprise,
        };
    }, [selectedModules, bundleOption, rowModelOption, chartOptions]);
    const selectedDependenciesSnippet = useMemo(() => {
        const chartsImportType = getChartsImportType(chartOptions);
        return getModuleMappingsSnippet({ chartsImportType, selectedModules: allImportModules });
    }, [allImportModules, chartOptions]);

    const updateRowModelOption = useCallback((moduleName: string) => {
        setRowModelOption(moduleName);
    }, []);

    const updateBundleOption = useCallback(
        (moduleName: BundleOptionValue) => {
            const api = gridRef?.current?.api;
            if (!api) {
                return;
            }

            if (moduleName === ALL_ENTERPRISE_MODULE) {
                api.selectAll('all');
                setSelectedModules({
                    community: [],
                    enterprise: [ALL_ENTERPRISE_MODULE],
                });
            } else if (moduleName === ALL_COMMUNITY_MODULE) {
                const nodesToToggle: IRowNode[] = [];

                api.deselectAll('all');
                // toggle all community modules
                api.forEachLeafNode((child) => {
                    if (!child.data.isEnterprise && child.data.moduleName) {
                        nodesToToggle.push(child);
                    }
                });
                api.setNodesSelected({
                    nodes: nodesToToggle,
                    newValue: true,
                });

                setSelectedModules({
                    community: [ALL_COMMUNITY_MODULE],
                    enterprise: [],
                });
            } else {
                api.deselectAll('all');

                setSelectedModules({
                    community: [],
                    enterprise: [],
                });
            }

            setBundleOption(moduleName);
        },
        [gridRef]
    );

    const updateChartOption = useCallback((name: ChartModuleName) => {
        setChartOptions((prevSelectedCharts) => {
            const newSelection = {
                ...prevSelectedCharts,
                [name]: !prevSelectedCharts[name],
            };

            return newSelection;
        });
    }, []);

    return {
        rowModelOption,
        updateRowModelOption,
        bundleOption,
        updateBundleOption,
        chartOptions,
        updateChartOption,
        setSelectedModules,
        selectedDependenciesSnippet,
    };
}
