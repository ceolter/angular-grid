import { EnterpriseIcon } from '@ag-website-shared/components/icon/EnterpriseIcon';
import { type FunctionComponent } from 'react';

import styles from './ModuleConfiguration.module.scss';
import {
    BUNDLE_OPTIONS,
    type BundleOptionValue,
    CHART_OPTIONS,
    type ChartModuleName,
    ROW_MODEL_OPTIONS,
} from './constants';
import type { ModuleConfig } from './useModuleConfig';

interface Props {
    moduleConfig: ModuleConfig;
}

export const ModuleConfiguration: FunctionComponent<Props> = ({ moduleConfig }) => {
    const { rowModelOption, updateRowModelOption, bundleOption, updateBundleOption, chartOptions, updateChartOption } =
        moduleConfig;
    return (
        <div className={styles.configuration}>
            <div className={styles.rowModel}>
                <span>Row Model:</span>
                <div>
                    {ROW_MODEL_OPTIONS.map(({ name, moduleName, isEnterprise }) => {
                        return (
                            <label key={name}>
                                <input
                                    type="radio"
                                    name="rowModel"
                                    value={moduleName}
                                    checked={rowModelOption === moduleName}
                                    onChange={() => {
                                        updateRowModelOption(moduleName);
                                    }}
                                />{' '}
                                {name}
                                {isEnterprise && (
                                    <>
                                        {' '}
                                        <EnterpriseIcon />
                                    </>
                                )}
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className={styles.bundles}>
                <span>Bundles:</span>
                <div>
                    {BUNDLE_OPTIONS.map(({ name, moduleName, isEnterprise }) => {
                        return (
                            <label key={name}>
                                <input
                                    type="radio"
                                    name="bundles"
                                    value={moduleName}
                                    checked={bundleOption === moduleName}
                                    onChange={() => {
                                        updateBundleOption(moduleName as BundleOptionValue);
                                    }}
                                />{' '}
                                {name}
                                {isEnterprise && (
                                    <>
                                        {' '}
                                        <EnterpriseIcon />
                                    </>
                                )}
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className={styles.charts}>
                <span>Charts:</span>
                <div>
                    {CHART_OPTIONS.map(({ name, moduleName, isEnterprise }) => {
                        return (
                            <label key={name}>
                                <input
                                    type="checkbox"
                                    name="charts"
                                    value={moduleName}
                                    checked={chartOptions[name as ChartModuleName]}
                                    onChange={() => {
                                        updateChartOption(name as ChartModuleName);
                                    }}
                                />{' '}
                                {name}
                                {isEnterprise && (
                                    <>
                                        {' '}
                                        <EnterpriseIcon />
                                    </>
                                )}
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
